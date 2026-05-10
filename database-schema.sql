create table projects (
  id text primary key,
  name text not null,
  path text not null,
  repo text,
  status text not null default 'Active',
  linked_cards jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table cards (
  id text primary key,
  column_name text not null,
  sort_order numeric not null default 0,
  title text not null,
  outcome text not null,
  owner text not null,
  status text not null,
  impact integer not null check (impact between 1 and 10),
  confidence integer not null check (confidence between 1 and 10),
  risk integer not null check (risk between 1 and 10),
  context jsonb not null default '[]'::jsonb,
  gate text not null,
  prd text not null default '',
  prd_fields jsonb not null default '{}'::jsonb,
  prompt text not null default '',
  agent_spec jsonb not null default '{}'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  agent_runs jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table activity (
  id text primary key,
  project_id text references projects(id) on delete set null,
  source text not null default 'Codex',
  status text not null,
  title text not null,
  detail text not null default '',
  linked_card_id text references cards(id) on delete set null,
  created_at timestamptz not null default now()
);
