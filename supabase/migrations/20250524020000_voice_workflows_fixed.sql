-- Voice workflows for automated AI calls
-- Enables non-technical users to configure call triggers

-- Workflow templates table
CREATE TABLE IF NOT EXISTS voice_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Trigger configuration
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'booking_reminder',
        'no_show_followup',
        'post_meeting',
        'custom'
    )),
    trigger_timing INTEGER NOT NULL,
    
    -- Filter conditions
    event_type_ids INTEGER[] DEFAULT NULL,
    min_duration INTEGER DEFAULT NULL,
    
    -- Action configuration
    action_type TEXT NOT NULL DEFAULT 'ai_phone_call' CHECK (action_type = 'ai_phone_call'),
    
    -- Message template with variables
    message_template TEXT NOT NULL DEFAULT 'Bonjour {{attendeeName}}, ceci est un rappel pour votre rendez-vous {{eventTitle}} prevu le {{eventDate}} a {{eventTime}}.',
    
    -- Voice settings
    voice_provider TEXT DEFAULT 'custom' CHECK (voice_provider IN ('custom', 'retell')),
    voice_id TEXT DEFAULT NULL,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow execution log
CREATE TABLE IF NOT EXISTS voice_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES voice_workflows(id) ON DELETE CASCADE,
    booking_id TEXT NOT NULL,
    
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
    error_message TEXT,
    
    call_sid TEXT,
    credits_used INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_workflows_user ON voice_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_workflows_active ON voice_workflows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_voice_workflow_executions_workflow ON voice_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_voice_workflow_executions_status ON voice_workflow_executions(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_voice_workflow_executions_scheduled ON voice_workflow_executions(scheduled_for) WHERE status = 'pending';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_voice_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS voice_workflows_updated_at ON voice_workflows;
CREATE TRIGGER voice_workflows_updated_at
    BEFORE UPDATE ON voice_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_voice_workflow_updated_at();

-- Enable Row Level Security
ALTER TABLE voice_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Policies for voice_workflows
DROP POLICY IF EXISTS voice_workflows_user_select ON voice_workflows;
CREATE POLICY voice_workflows_user_select ON voice_workflows
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE auth.uid() = users.raw_user_meta_data->>'sub'
    ));

DROP POLICY IF EXISTS voice_workflows_user_insert ON voice_workflows;
CREATE POLICY voice_workflows_user_insert ON voice_workflows
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE auth.uid() = users.raw_user_meta_data->>'sub'
    ));

DROP POLICY IF EXISTS voice_workflows_user_update ON voice_workflows;
CREATE POLICY voice_workflows_user_update ON voice_workflows
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE auth.uid() = users.raw_user_meta_data->>'sub'
    ));

DROP POLICY IF EXISTS voice_workflows_user_delete ON voice_workflows;
CREATE POLICY voice_workflows_user_delete ON voice_workflows
    FOR DELETE USING (user_id IN (
        SELECT id FROM users WHERE auth.uid() = users.raw_user_meta_data->>'sub'
    ));

-- Policies for voice_workflow_executions
DROP POLICY IF EXISTS voice_workflow_executions_user_select ON voice_workflow_executions;
CREATE POLICY voice_workflow_executions_user_select ON voice_workflow_executions
    FOR SELECT USING (workflow_id IN (
        SELECT id FROM voice_workflows WHERE user_id IN (
            SELECT id FROM users WHERE auth.uid() = users.raw_user_meta_data->>'sub'
        )
    ));

-- Comments
COMMENT ON TABLE voice_workflows IS 'User-defined workflows for automated AI phone calls';
COMMENT ON TABLE voice_workflow_executions IS 'Scheduled and executed workflow instances';
