-- Add workflow execution tracking to voice_calls
-- First check if voice_calls exists, if not create it

CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    callSid TEXT NOT NULL UNIQUE,
    userId INTEGER REFERENCES users(id) ON DELETE SET NULL,
    bookingId TEXT,
    workflowExecutionId UUID REFERENCES voice_workflow_executions(id) ON DELETE SET NULL,
    purpose TEXT,
    toPhone TEXT NOT NULL,
    fromPhone TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    direction TEXT DEFAULT 'outbound',
    duration INTEGER,
    recordingUrl TEXT,
    transcript JSONB,
    notes TEXT,
    professionalName TEXT,
    creditsUsed INTEGER DEFAULT 0,
    errorMessage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add workflow_execution_id to voice_calls (if table exists)
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS workflowExecutionId UUID REFERENCES voice_workflow_executions(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_calls_workflow_execution ON voice_calls(workflowExecutionId);

-- Update existing workflow execution status function
CREATE OR REPLACE FUNCTION update_workflow_execution_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a call is completed, update the workflow execution
    IF NEW.status = 'completed' AND NEW.workflowExecutionId IS NOT NULL THEN
        UPDATE voice_workflow_executions
        SET 
            status = 'executed',
            executed_at = NOW(),
            credits_used = NEW.creditsUsed
        WHERE id = NEW.workflowExecutionId;
    END IF;
    
    -- When a call fails, mark execution as failed
    IF NEW.status = 'failed' AND NEW.workflowExecutionId IS NOT NULL THEN
        UPDATE voice_workflow_executions
        SET 
            status = 'failed',
            executed_at = NOW(),
            error_message = NEW.errorMessage
        WHERE id = NEW.workflowExecutionId;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workflow execution updates
DROP TRIGGER IF EXISTS voice_calls_workflow_status ON voice_calls;
CREATE TRIGGER voice_calls_workflow_status
    AFTER UPDATE ON voice_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_execution_status();

COMMENT ON COLUMN voice_calls.workflowExecutionId IS 'Links call to workflow execution that triggered it';
