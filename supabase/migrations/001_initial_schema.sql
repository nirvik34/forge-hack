CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    system_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    head_commit_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE commits (
    hash TEXT PRIMARY KEY,
    parent_hash TEXT REFERENCES commits(hash) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    compressed_payload TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'flagged')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
