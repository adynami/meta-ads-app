import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/tenants';
import {
  ChatError,
  parseChatRequest,
  prepareTurn,
  reserveTurnCredit,
  runChatTurn,
  sseResponse,
  type ChatRequestBody,
} from '@/lib/chat';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user?.email ? await getUserByEmail(session.user.email) : null;
    if (session?.user?.email && !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const parsed = parseChatRequest((await req.json()) as ChatRequestBody);
    // Resolve auth, trial, account and conversation BEFORE streaming so
    // failures come back as proper HTTP status codes.
    const prepared = await prepareTurn(user ?? null, parsed);
    const reservation = await reserveTurnCredit(prepared);

    if (parsed.stream) {
      return sseResponse((emit) => runChatTurn(prepared, reservation, parsed, emit, req.signal));
    }

    const { conversationId, output } = await runChatTurn(
      prepared,
      reservation,
      parsed,
      () => {},
      req.signal,
    );
    return Response.json({
      text: output.text,
      toolCalls: output.toolCalls,
      actions: output.actions,
      conversationId,
    });
  } catch (error) {
    if (error instanceof ChatError) {
      return Response.json(
        { error: error.message, code: error.code, ...error.extra },
        { status: error.status },
      );
    }
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    console.error('[chat/route] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
