import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '@/lib/anthropic';
import { ALL_TOOLS, executeTool } from '@/lib/tool-executor';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { TenantContext } from 'meta-mcp-server/tenant-context';
import type { AttachmentStore } from '@/lib/attachments';
import type { StreamEvent } from '@/types/chat';
import {
  type PersistenceContext,
  type AccountLabel,
  buildSystemBlocks,
  getAnthropicTools,
  extractAndStripContext,
  truncateOldToolResults,
  persistChatData,
  MAX_TOOL_ROUNDS,
} from '@/lib/chat';

function sseEncode(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function runChatStreaming(
  ctx: TenantContext | TenantContext[],
  messages: Anthropic.MessageParam[],
  persist?: PersistenceContext,
  accountNames?: AccountLabel[],
  attachmentStore?: AttachmentStore,
  signal?: AbortSignal,
): Response {
  const isMultiAccount = Array.isArray(ctx);
  const systemBlocks = buildSystemBlocks(isMultiAccount, accountNames, persist?.existingContext);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const write = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(sseEncode(event)));
        } catch {
          // stream may be closed
        }
      };

      try {
        const client = getAnthropicClient();
        let currentMessages: Anthropic.MessageParam[] = truncateOldToolResults([...messages]);
        let finalText = '';
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCacheCreationTokens = 0;
        let totalCacheReadTokens = 0;
        const allToolCalls: { id: string; name: string; input: any; result: string }[] = [];

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          if (signal?.aborted) break;

          const streamResponse = client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 16384,
            system: systemBlocks,
            tools: getAnthropicTools(),
            messages: currentMessages,
          });

          // Stream text deltas
          streamResponse.on('text', (text) => {
            write({ type: 'text-delta', text });
          });

          // Track tool use blocks as they arrive
          streamResponse.on('contentBlock', (block) => {
            if (block.type === 'tool_use') {
              write({
                type: 'tool-start',
                id: block.id,
                name: block.name,
                input: block.input as Record<string, unknown>,
              });
            }
          });

          const finalMessage = await streamResponse.finalMessage();

          const cacheRead = (finalMessage.usage as any).cache_read_input_tokens ?? 0;
          const cacheCreate = (finalMessage.usage as any).cache_creation_input_tokens ?? 0;
          console.log(
            `[chat-streaming] round=${round} stop=${finalMessage.stop_reason} cache_read=${cacheRead} cache_create=${cacheCreate} input=${finalMessage.usage.input_tokens}`,
          );

          totalInputTokens += finalMessage.usage.input_tokens;
          totalOutputTokens += finalMessage.usage.output_tokens;
          totalCacheCreationTokens += cacheCreate;
          totalCacheReadTokens += cacheRead;

          // Collect text and tool use blocks from final message
          const textParts: string[] = [];
          const toolUseBlocks: Anthropic.ContentBlockParam[] = [];

          for (const block of finalMessage.content) {
            if (block.type === 'text') {
              textParts.push(block.text);
            } else if (block.type === 'tool_use') {
              toolUseBlocks.push(block);
            }
          }

          if (textParts.length > 0) {
            finalText = textParts.join('\n');
          }

          if (toolUseBlocks.length === 0) break;

          // Execute tools in parallel
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (block) => {
              if (block.type !== 'tool_use') return null;

              let result: string;

              if (isMultiAccount && accountNames) {
                const perAccount = await Promise.all(
                  (ctx as TenantContext[]).map(async (tenantCtx, i) => {
                    const r = await executeTool(
                      tenantCtx,
                      block.name,
                      block.input as Record<string, any>,
                      attachmentStore,
                    );
                    return { account: accountNames[i].name, result: r };
                  }),
                );
                result = JSON.stringify(perAccount);
              } else {
                result = await executeTool(
                  ctx as TenantContext,
                  block.name,
                  block.input as Record<string, any>,
                  attachmentStore,
                );
              }

              allToolCalls.push({
                id: block.id,
                name: block.name,
                input: block.input,
                result,
              });

              write({ type: 'tool-result', id: block.id, name: block.name, result });

              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: result,
              };
            }),
          );

          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: finalMessage.content },
            {
              role: 'user',
              content: toolResults.filter(Boolean) as Anthropic.ToolResultBlockParam[],
            },
          ];
        }

        // Post-loop: persist and finalize
        const { cleanText, context: extractedContext } = extractAndStripContext(finalText);
        let returnedConversationId: string | undefined;

        if (persist) {
          try {
            returnedConversationId = await persistChatData(
              persist,
              messages,
              cleanText,
              totalInputTokens,
              totalOutputTokens,
              totalCacheCreationTokens,
              totalCacheReadTokens,
              extractedContext,
            );

            if (persist.useBonusCall) {
              await db
                .update(users)
                .set({ bonusCalls: sql`bonus_calls - 1` })
                .where(eq(users.id, persist.userId));
            }
          } catch (err) {
            console.error('[chat-streaming] Persistence error:', err);
          }
        }

        write({
          type: 'done',
          conversationId: returnedConversationId ?? persist?.conversationId,
        });
      } catch (err: any) {
        write({ type: 'error', message: err?.message ?? 'Internal server error' });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
