import type { TenantContext } from '../tenant-context.js';
import { rateLimitedCall } from '../utils/rate-limiter.js';
import { graphGet, graphPost } from '../utils/graph.js';

export const testingTools = [
  {
    name: 'meta_list_ab_tests',
    description: 'List A/B split tests: name, status, type, cells.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', minimum: 1, maximum: 50, description: 'Max results (default 10)' },
      },
    },
  },
  {
    name: 'meta_create_ab_test',
    description: 'Create A/B test comparing two campaigns on a single variable. Write op — confirm first.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Name for this A/B test' },
        campaign_a_id: { type: 'string', description: 'First campaign ID (control). Should be PAUSED.' },
        campaign_b_id: { type: 'string', description: 'Second campaign ID (variant). Should be PAUSED.' },
        variable: {
          type: 'string',
          enum: ['CREATIVE', 'PLACEMENT', 'TARGETING', 'BUDGET_OPTIMIZATION'],
          description: 'The single variable being tested. The two campaigns should only differ on this dimension.',
        },
        optimization_metric: {
          type: 'string',
          enum: ['COST_PER_RESULT', 'ROAS'],
          description: 'Metric to determine the winner (default: COST_PER_RESULT)',
        },
        end_time: {
          type: 'string',
          description: 'Test end date/time in ISO 8601 format (e.g. 2025-07-15T23:59:59Z). Meta recommends 7+ days.',
        },
        confidence_level: {
          type: 'number',
          enum: [0.90, 0.95, 0.99],
          description: 'Statistical confidence threshold to declare a winner (default: 0.95)',
        },
      },
      required: ['name', 'campaign_a_id', 'campaign_b_id', 'variable'],
    },
  },
];

export async function handleTestingTool(ctx: TenantContext, name: string, args: any): Promise<any> {
  switch (name) {
    case 'meta_list_ab_tests': return listAbTests(ctx, args);
    case 'meta_create_ab_test': return createAbTest(ctx, args);
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

async function listAbTests(ctx: TenantContext, args: any): Promise<any> {
  const result = await rateLimitedCall(() =>
    graphGet(ctx, `${ctx.adAccountId}/ad_studies`, {
      fields: 'id,name,type,status,start_time,end_time,description',
      limit: args.limit ?? 10,
    }),
  );

  return {
    tests: (result.data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      type: s.type ?? null,
      status: s.status ?? null,
      start_time: s.start_time ?? null,
      end_time: s.end_time ?? null,
      description: s.description ?? null,
    })),
    total: (result.data ?? []).length,
  };
}

async function createAbTest(ctx: TenantContext, args: any): Promise<any> {
  if (ctx.dryRun) {
    return {
      dry_run: true,
      message: `Simulated: A/B test "${args.name}" — campaign ${args.campaign_a_id} vs ${args.campaign_b_id} on ${args.variable}`,
    };
  }

  const confidenceLevel = args.confidence_level ?? 0.95;
  const optimizationMetric = args.optimization_metric ?? 'COST_PER_RESULT';

  const cells = [
    { name: 'Cell A (Control)', treatment_percentage: 50, campaigns: [args.campaign_a_id] },
    { name: 'Cell B (Variant)', treatment_percentage: 50, campaigns: [args.campaign_b_id] },
  ];

  const objectives = [{ name: optimizationMetric, type: 'HOLDOUT', is_primary: true }];

  const params: Record<string, any> = {
    name: args.name,
    description: `A/B test: ${args.variable} — ${args.campaign_a_id} vs ${args.campaign_b_id}`,
    cells: JSON.stringify(cells),
    objectives: JSON.stringify(objectives),
    confidence_level: String(confidenceLevel),
  };

  if (args.end_time) {
    params.end_time = String(Math.floor(new Date(args.end_time).getTime() / 1000));
  }

  const result = await rateLimitedCall(() =>
    graphPost(ctx, `${ctx.adAccountId}/ad_studies`, params),
  );

  return {
    success: true,
    test_id: result.id,
    name: args.name,
    variable: args.variable,
    optimization_metric: optimizationMetric,
    confidence_level: `${(confidenceLevel * 100).toFixed(0)}%`,
    campaign_a: args.campaign_a_id,
    campaign_b: args.campaign_b_id,
    ...(args.end_time && { end_time: args.end_time }),
    note: 'Activate both campaigns simultaneously to start the test. Meta will split the audience 50/50 automatically.',
  };
}
