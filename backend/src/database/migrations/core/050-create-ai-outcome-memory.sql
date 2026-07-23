-- Create AI Outcome Memory
-- Migration: 050-create-ai-outcome-memory.sql
--
-- Stores historical AI decisions, actions and outcomes.
-- Enables future learning loops and predictive intelligence.

CREATE TABLE ai_outcome_memory (

    id UUID PRIMARY KEY,

    property_id UUID NOT NULL,

    command VARCHAR(100) NOT NULL,

    decision VARCHAR(150) NOT NULL,

    action VARCHAR(150),

    confidence NUMERIC(5,2),

    execution_status VARCHAR(50) NOT NULL,

    outcome_summary TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()

);


CREATE INDEX idx_ai_outcome_memory_property
ON ai_outcome_memory(property_id);


CREATE INDEX idx_ai_outcome_memory_status
ON ai_outcome_memory(property_id, execution_status);
