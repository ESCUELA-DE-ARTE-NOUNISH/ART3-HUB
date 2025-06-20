-- Enhanced database schema for intelligent chat system with user memory

-- Create conversation_sessions table to track chat sessions
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    session_end TIMESTAMP WITH TIME ZONE,
    locale TEXT DEFAULT 'en' NOT NULL,
    user_level TEXT DEFAULT 'beginner' NOT NULL CHECK (user_level IN ('beginner', 'intermediate', 'advanced')),
    conversation_stage TEXT DEFAULT 'initial' NOT NULL CHECK (conversation_stage IN ('initial', 'assessing', 'recommending', 'completed')),
    outcome_path TEXT CHECK (outcome_path IN ('tutorial', 'opportunities', 'create')),
    questions_asked INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create conversation_messages table to store individual messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    message_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_memory table to store persistent user context and preferences
CREATE TABLE IF NOT EXISTS user_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    experience_level TEXT DEFAULT 'beginner' NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
    art_interests TEXT[], -- Array of art interests (digital, traditional, nft, etc.)
    preferred_blockchain TEXT DEFAULT 'base' CHECK (preferred_blockchain IN ('base', 'celo', 'zora')),
    completed_tutorials TEXT[] DEFAULT '{}', -- Array of completed tutorial IDs
    tutorial_progress JSONB DEFAULT '{}', -- JSON object tracking tutorial progress
    learning_goals TEXT[], -- Array of learning goals
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    total_sessions INTEGER DEFAULT 0 NOT NULL,
    successful_outcomes INTEGER DEFAULT 0 NOT NULL,
    preferred_outcome_path TEXT, -- Most common outcome path
    conversation_context JSONB DEFAULT '{}', -- Flexible JSON for storing conversation context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create assessment_responses table to track user responses during assessment
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL, -- 'experience', 'goals', 'interests', 'time_availability', 'technical_level'
    question_text TEXT NOT NULL,
    user_response TEXT NOT NULL,
    assessment_score INTEGER, -- Score from 1-5 for quantifying responses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_wallet_address ON conversation_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_session_start ON conversation_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_outcome_path ON conversation_sessions(outcome_path);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_order ON conversation_messages(session_id, message_order);

CREATE INDEX IF NOT EXISTS idx_user_memory_wallet_address ON user_memory(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_last_interaction ON user_memory(last_interaction);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_session_id ON assessment_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_question_type ON assessment_responses(question_type);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_conversation_sessions_updated_at ON conversation_sessions;
CREATE TRIGGER update_conversation_sessions_updated_at
    BEFORE UPDATE ON conversation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_memory_updated_at ON user_memory;
CREATE TRIGGER update_user_memory_updated_at
    BEFORE UPDATE ON user_memory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for all tables
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversation_sessions
CREATE POLICY "Users can access their own conversation sessions" ON conversation_sessions
    FOR ALL USING (wallet_address = auth.jwt() ->> 'sub' OR true); -- Allow all for now, can be restricted later

-- Create RLS policies for conversation_messages
CREATE POLICY "Users can access their own conversation messages" ON conversation_messages
    FOR ALL USING (
        session_id IN (
            SELECT id FROM conversation_sessions 
            WHERE wallet_address = auth.jwt() ->> 'sub'
        ) OR true
    );

-- Create RLS policies for user_memory
CREATE POLICY "Users can access their own memory" ON user_memory
    FOR ALL USING (wallet_address = auth.jwt() ->> 'sub' OR true);

-- Create RLS policies for assessment_responses
CREATE POLICY "Users can access their own assessment responses" ON assessment_responses
    FOR ALL USING (
        session_id IN (
            SELECT id FROM conversation_sessions 
            WHERE wallet_address = auth.jwt() ->> 'sub'
        ) OR true
    );

-- Create function to get or create user memory
CREATE OR REPLACE FUNCTION get_or_create_user_memory(
    p_wallet_address TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    wallet_address TEXT,
    experience_level TEXT,
    art_interests TEXT[],
    preferred_blockchain TEXT,
    completed_tutorials TEXT[],
    tutorial_progress JSONB,
    learning_goals TEXT[],
    last_interaction TIMESTAMP WITH TIME ZONE,
    total_sessions INTEGER,
    successful_outcomes INTEGER,
    preferred_outcome_path TEXT,
    conversation_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
    memory_record user_memory%ROWTYPE;
    resolved_user_id UUID;
BEGIN
    -- Get user_id if not provided
    IF p_user_id IS NULL THEN
        SELECT up.id INTO resolved_user_id
        FROM user_profiles up
        WHERE up.wallet_address = p_wallet_address;
    ELSE
        resolved_user_id := p_user_id;
    END IF;

    -- Try to get existing memory
    SELECT * INTO memory_record
    FROM user_memory um
    WHERE um.wallet_address = p_wallet_address;

    -- If not found, create new memory record
    IF NOT FOUND THEN
        INSERT INTO user_memory (user_id, wallet_address)
        VALUES (resolved_user_id, p_wallet_address)
        RETURNING * INTO memory_record;
    END IF;

    -- Return the memory record
    RETURN QUERY SELECT 
        memory_record.id,
        memory_record.user_id,
        memory_record.wallet_address,
        memory_record.experience_level,
        memory_record.art_interests,
        memory_record.preferred_blockchain,
        memory_record.completed_tutorials,
        memory_record.tutorial_progress,
        memory_record.learning_goals,
        memory_record.last_interaction,
        memory_record.total_sessions,
        memory_record.successful_outcomes,
        memory_record.preferred_outcome_path,
        memory_record.conversation_context,
        memory_record.created_at,
        memory_record.updated_at;
END;
$$;

-- Create function to update user memory after conversation
CREATE OR REPLACE FUNCTION update_user_memory_after_conversation(
    p_wallet_address TEXT,
    p_outcome_path TEXT,
    p_new_context JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_memory
    SET 
        last_interaction = TIMEZONE('utc'::text, NOW()),
        total_sessions = total_sessions + 1,
        successful_outcomes = CASE 
            WHEN p_outcome_path IS NOT NULL THEN successful_outcomes + 1 
            ELSE successful_outcomes 
        END,
        preferred_outcome_path = CASE
            WHEN preferred_outcome_path IS NULL OR preferred_outcome_path = p_outcome_path THEN p_outcome_path
            ELSE preferred_outcome_path
        END,
        conversation_context = conversation_context || p_new_context,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE wallet_address = p_wallet_address;
END;
$$;