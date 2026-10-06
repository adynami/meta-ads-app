-- Agent v2: server-side transcripts, write approvals + undo, attachments, playbooks, alerts.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS transcript jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS alerts_enabled boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_webhook_enc text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alerts_last_run_at timestamptz;

CREATE TABLE IF NOT EXISTS agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  ad_account_id uuid REFERENCES ad_accounts(id) ON DELETE CASCADE,
  meta_ad_account_id text NOT NULL,
  tool_name text NOT NULL,
  tool_use_id text,
  input jsonb NOT NULL,
  summary text,
  status text DEFAULT 'pending' NOT NULL,
  before jsonb,
  result jsonb,
  error text,
  created_at timestamptz DEFAULT now() NOT NULL,
  decided_at timestamptz,
  rolled_back_at timestamptz
);
CREATE INDEX IF NOT EXISTS agent_actions_user_idx ON agent_actions (user_id, created_at);

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  name text NOT NULL,
  media_type text NOT NULL,
  size integer NOT NULL,
  url text,
  data_base64 text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
