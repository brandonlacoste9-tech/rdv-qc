-- Add workflow execution tracking to voice_calls
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS workflow_execution_id UUID REFERENCES voice_workflow_executions(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_calls_workflow_execution ON voice_calls(workflow_execution_id);

-- Update existing workflow execution status function
CREATE OR REPLACE FUNCTION update_workflow_execution_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a call is completed, update the workflow execution
    IF NEW.status = 'completed' AND NEW.workflow_execution_id IS NOT NULL THEN
        UPDATE voice_workflow_executions
        SET 
            status = 'executed',
            executed_at = NOW(),
            credits_used = NEW.credits_used
        WHERE id = NEW.workflow_execution_id;
    END IF;
    
    -- When a call fails, mark execution as failed
    IF NEW.status = 'failed' AND NEW.workflow_execution_id IS NOT NULL THEN
        UPDATE voice_workflow_executions
        SET 
            status = 'failed',
            executed_at = NOW(),
            error_message = NEW.error_message
        WHERE id = NEW.workflow_execution_id;
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

COMMENT ON COLUMN voice_calls.workflow_execution_id IS 'Links call to workflow execution that triggered it';
