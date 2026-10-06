/**
 * Read/write classification for every Meta tool.
 *
 * Every tool exposed to Claude MUST appear in exactly one of these sets —
 * `tool-policy.test.ts` fails the build otherwise, so a new tool can never
 * silently default to "safe to fan out" or "no confirmation needed".
 */

/** Tools that never mutate the Meta account. Safe to fan out across accounts. */
export const READ_TOOLS = new Set([
  'meta_search_ad_library',
  'meta_get_breakdown_insights',
  'meta_request_insights_report',
  'meta_account_intelligence',
  'meta_list_audiences',
  'meta_generate_creative_brief',
  'meta_list_budget_schedules',
  'meta_list_product_catalogs',
  'meta_get_catalog',
  'meta_list_catalog_products',
  'meta_list_product_sets',
  'meta_generate_ad_copy',
  'meta_debug_ad',
  'meta_list_lead_forms',
  'meta_get_leads',
  'meta_list_ad_images',
  'meta_list_ad_videos',
  'meta_list_campaigns',
  'meta_get_campaign',
  'meta_list_adsets',
  'meta_list_ads',
  'meta_get_insights',
  'meta_get_account',
  'meta_search_targeting',
  'meta_search_interests',
  'meta_search_behaviors',
  'meta_search_demographics',
  'meta_search_geo_locations',
  'meta_get_interest_suggestions',
  'meta_estimate_audience_size',
  'meta_get_ad_image',
  'meta_get_ad_details',
  'meta_get_adset_details',
  'meta_get_creative_details',
  'meta_list_pages',
  'meta_predict_reach',
  'meta_get_ad_preview',
  'meta_get_account_billing',
  'meta_get_recommendations',
  'meta_analyze_creative_performance',
  'meta_list_pixels',
  'meta_get_pixel_events',
  'meta_list_rules',
  'meta_list_ab_tests',
  'meta_list_value_rules',
]);

/** Tools that create, change, delete, or send data to Meta. */
export const WRITE_TOOLS = new Set([
  'meta_create_customer_audience',
  'meta_create_lookalike_audience',
  'meta_create_website_audience',
  'meta_create_engagement_audience',
  'meta_create_video_audience',
  'meta_delete_audience',
  'meta_create_budget_schedule',
  'meta_delete_budget_schedule',
  'meta_send_conversions_event',
  'meta_deploy_campaign',
  'meta_deploy_dco_campaign',
  'meta_duplicate_adset',
  'meta_duplicate_creative',
  'meta_duplicate_campaign',
  'meta_create_lead_form',
  'meta_upload_image',
  'meta_upload_video',
  'meta_update_campaign_status',
  'meta_bulk_update_status',
  'meta_add_ad',
  'meta_create_rule',
  'meta_update_rule',
  'meta_delete_rule',
  'meta_create_ab_test',
  'meta_update_campaign',
  'meta_update_adset',
  'meta_update_ad',
  'meta_create_value_rule',
  'meta_update_value_rule',
  'meta_delete_value_rule',
]);

export function isWriteTool(name: string): boolean {
  // Unknown tools are treated as writes: fail closed.
  return !READ_TOOLS.has(name);
}

/**
 * Extra input property injected into write tools in multi-account mode so
 * Claude must name exactly one target account. Stripped before dispatch.
 */
export const TARGET_ACCOUNT_PARAM = 'target_account_id';
