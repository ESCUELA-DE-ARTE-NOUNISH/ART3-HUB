# Intelligent Chat System

The Art3 Hub Intelligent Chat System is an enhanced AI assistant that guides artists through personalized conversations to determine their optimal learning path. It features user memory, conversation tracking, and intelligent recommendations.

## 🎯 Core Features

### 3 Outcome Paths
After 3-5 questions, the agent recommends one of three paths:

1. **Tutorial Path** (`/tutorials/art3hub-connect.mp4`)
   - For beginners needing step-by-step guidance
   - Shows introduction video to Art3 Hub

2. **Opportunities Path** (`/opportunities`)
   - For artists seeking art projects and collaborations
   - Redirects to opportunities page

3. **Create Path** (`/create`)
   - For users ready to create their first NFT
   - Redirects to NFT creation page

### User Memory System
- **Persistent Memory**: Uses wallet address for user identification
- **Learning Progress**: Tracks completed tutorials and preferences
- **Conversation Context**: Remembers past interactions and outcomes
- **Adaptive Responses**: Personalizes conversation based on history

### Intelligent Assessment
- **Progressive Questions**: 5 assessment questions maximum
- **Response Analysis**: Scores user responses to determine experience level
- **Confidence Rating**: Provides confidence score for recommendations
- **Multi-language Support**: Available in English, Spanish, French, Portuguese

## 🗄️ Database Schema

### Core Tables

#### `conversation_sessions`
Tracks individual chat sessions with stages and outcomes.
```sql
- id: UUID (Primary Key)
- wallet_address: TEXT (User identifier)
- conversation_stage: ENUM ('initial', 'assessing', 'recommending', 'completed')
- outcome_path: ENUM ('tutorial', 'opportunities', 'create')
- questions_asked: INTEGER
- locale: TEXT
- user_level: ENUM ('beginner', 'intermediate', 'advanced')
```

#### `user_memory`
Stores persistent user context and learning progress.
```sql
- id: UUID (Primary Key)
- wallet_address: TEXT (User identifier)
- experience_level: ENUM ('beginner', 'intermediate', 'advanced')
- art_interests: TEXT[]
- completed_tutorials: TEXT[]
- learning_goals: TEXT[]
- total_sessions: INTEGER
- preferred_outcome_path: TEXT
- conversation_context: JSONB
```

#### `conversation_messages`
Stores individual messages in conversations.
```sql
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key)
- role: ENUM ('user', 'assistant', 'system')
- content: TEXT
- message_order: INTEGER
```

#### `assessment_responses`
Tracks user responses during assessment for analysis.
```sql
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key)
- question_type: TEXT
- user_response: TEXT
- assessment_score: INTEGER (1-5)
```

## 🚀 Setup Instructions

### 1. Database Migration
Run the migration to create necessary tables:
```bash
npm run db:migrate:chat
```

Or manually execute the SQL in Supabase:
```bash
# The migration script will show you the SQL to run
npm run db:migrate:chat
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 3. Access the System
- **New Interface**: `/[locale]/ai-agent/intelligent`
- **Original Interface**: `/[locale]/ai-agent` (still available)

## 📱 Usage Flow

### 1. User Connection
- User connects wallet (required for intelligent features)
- System creates or retrieves user memory
- Conversation session begins

### 2. Assessment Phase
The agent asks up to 5 questions about:
- **Experience Level**: Digital art background
- **Goals**: Learning vs. opportunities vs. creating
- **Interests**: Art styles and preferences
- **Time Availability**: Learning commitment
- **Technical Comfort**: Technology familiarity

### 3. Recommendation Phase
Based on assessment responses and user history:
- Analyzes responses with scoring algorithm
- Considers past preferences and outcomes
- Provides recommendation with confidence score
- Shows outcome card with clear next steps

### 4. Action Phase
- User can accept recommendation and redirect
- Or continue conversation for clarification
- System updates memory with outcome choice

## 🛠️ Technical Implementation

### API Endpoints

#### `/api/chat/intelligent` (POST)
Enhanced chat endpoint with memory and assessment.

**Request Body:**
```json
{
  "message": "User message",
  "walletAddress": "0x...",
  "locale": "en"
}
```

**Response:**
```json
{
  "response": "Assistant response",
  "conversationStage": "assessing",
  "questionsAsked": 2,
  "outcomeRecommendation": {
    "type": "tutorial",
    "confidence": 0.85,
    "redirectUrl": "/tutorials/art3hub-connect.mp4",
    "message": "Perfect! I think you'd love to start with our tutorial..."
  }
}
```

### Service Layer

#### `ChatMemoryService`
Centralized service for all database operations:

```typescript
// User Memory
ChatMemoryService.getUserMemory(walletAddress)
ChatMemoryService.createOrUpdateUserMemory(walletAddress, updates)
ChatMemoryService.updateUserMemoryAfterOutcome(walletAddress, outcome, context)

// Conversation Sessions
ChatMemoryService.getOrCreateConversationSession(walletAddress, locale)
ChatMemoryService.updateConversationSession(sessionId, updates)

// Messages
ChatMemoryService.saveConversationMessage(sessionId, role, content, order)
ChatMemoryService.getConversationMessages(sessionId)

// Assessment
ChatMemoryService.saveAssessmentResponse(sessionId, type, question, response, score)
ChatMemoryService.getAssessmentResponses(sessionId)

// Analytics
ChatMemoryService.getUserAnalytics(walletAddress)
ChatMemoryService.getConversationContext(walletAddress)
```

## 🎨 UI Components

### Intelligent Agent Page
Enhanced interface with:
- **Progress Indicator**: Shows assessment progress (0-100%)
- **Stage Descriptions**: Clear indication of current conversation phase
- **Outcome Cards**: Beautiful recommendation display with confidence meters
- **Wallet Connection**: Required for intelligent features
- **Multi-language**: Full internationalization support

### Key Features
- **Auto-scroll**: Messages scroll smoothly
- **Loading States**: Animated indicators during AI responses
- **Error Handling**: Rate limiting and connection error display
- **Responsive Design**: Works on all device sizes
- **Accessibility**: Proper keyboard navigation and screen reader support

## 🔍 Assessment Algorithm

### Question Types & Scoring

#### Experience Level (1-5 scale)
- **1-2**: Beginner keywords (new, never, starting)
- **3**: Some experience keywords (little, basic, some)
- **4-5**: Advanced keywords (experienced, familiar, comfortable)

#### Goals Assessment
- **1**: Learning/tutorial keywords → Tutorial path
- **2**: Opportunities/work keywords → Opportunities path  
- **3**: Create/NFT keywords → Create path

#### Time Availability
- **1-2**: Limited time (minutes, busy) → Tutorial path
- **3+**: More time available → Other paths

### Outcome Determination
Algorithm considers:
- **Assessment scores** with weighted importance
- **User memory** and past preferences
- **Session history** and success patterns
- **Confidence calculation** based on score consistency

## 🌍 Internationalization

### Supported Languages
- **English** (en) - Default
- **Spanish** (es) - LATAM focus
- **French** (fr) - International support
- **Portuguese** (pt) - Brazil support

### Assessment Questions
All assessment questions are translated and culturally adapted for each language, ensuring natural conversation flow across different regions.

## 📊 Analytics & Insights

### User Analytics
Track user journey and system effectiveness:
- Total conversation sessions
- Successful outcome rates
- Preferred outcome paths
- Average questions needed for assessment
- Tutorial completion rates (when integrated)

### System Metrics
Monitor system performance:
- Conversation completion rates
- Assessment accuracy
- User satisfaction (implicit through outcome acceptance)
- Language usage patterns

## 🔧 Development & Testing

### Testing the System
1. **Connect Wallet**: Use any test wallet address
2. **Start Conversation**: Navigate to `/en/ai-agent/intelligent`
3. **Answer Questions**: Provide varied responses to test different paths
4. **Verify Outcomes**: Confirm redirects work correctly
5. **Test Memory**: Reconnect with same wallet to test persistence

### Debugging
- Check browser console for API errors
- Verify database tables exist and have proper permissions
- Test with different wallet addresses for user isolation
- Monitor rate limiting in Redis

## 🚀 Future Enhancements

### Planned Features
- **Tutorial Progress Tracking**: Integration with video completion
- **Learning Path Recommendations**: Advanced personalized curricula
- **Community Integration**: Connect users with similar interests
- **Achievement System**: NFT badges for learning milestones
- **Voice Interface**: Audio conversation support
- **Advanced Analytics**: ML-powered insights and recommendations

### Integration Opportunities
- **NFT Creation Tracking**: Monitor actual NFT minting success
- **Opportunity Matching**: AI-powered project recommendations
- **Social Features**: Artist networking and collaboration
- **Educational Content**: Dynamic lesson suggestions
- **Progress Gamification**: Reward systems and leaderboards

This intelligent chat system transforms the Art3 Hub experience from a simple Q&A interface into a personalized learning journey that adapts to each artist's needs and grows smarter with every interaction.