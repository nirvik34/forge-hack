CREATE TABLE watchdog_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_hash TEXT REFERENCES commits(hash) ON DELETE CASCADE,
    verdict TEXT NOT NULL CHECK (verdict IN ('PASS', 'FAIL')),
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
