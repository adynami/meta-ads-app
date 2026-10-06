/** Built-in playbooks: repeatable workflows the user can run in one click. */
export interface Playbook {
  id: string;
  name: string;
  prompt: string;
  builtIn?: boolean;
}

export const BUILT_IN_PLAYBOOKS: Playbook[] = [
  {
    id: 'weekly-review',
    name: 'Weekly performance review',
    prompt:
      'Review the last 7 days vs the previous 7 days at campaign level: spend, results by conversion type, CPA and ROAS. Flag the 3 biggest changes and explain the likely cause of each. End with 3 concrete recommendations.',
  },
  {
    id: 'creative-fatigue',
    name: 'Creative fatigue check',
    prompt:
      'Find active ads showing creative fatigue over the last 14 days: frequency above 3, CTR down 20%+ vs their first week, or CPA up 30%+. List them in a table with the evidence, and propose which to pause or refresh. Do not change anything until I approve.',
  },
  {
    id: 'scale-winners',
    name: 'Scale the winners',
    prompt:
      'Identify ad sets from the last 7 days with CPA at least 20% below the account average and stable delivery (at least 3 days of spend). Propose a budget increase of 20% for each (never more than 20% per change). Show current vs proposed budget and queue the changes for my approval.',
  },
  {
    id: 'wasted-spend',
    name: 'Wasted spend audit',
    prompt:
      'Find campaigns, ad sets and ads that spent money in the last 14 days with zero conversions, or with CPA more than 2x the account average. Show total wasted spend and propose what to pause.',
  },
  {
    id: 'audience-breakdown',
    name: 'Audience breakdown',
    prompt:
      'Break down the last 30 days by age and gender, then by placement. Show where CPA is best and worst, and suggest targeting or placement changes.',
  },
];
