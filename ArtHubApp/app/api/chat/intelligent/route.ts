import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { ChatMemoryService } from '@/lib/services/chat-memory-service'

// Types
type RateLimitInfo = {
  success: boolean
  limit: number
  reset: number
  remaining: number
}

interface ApiResponse {
  response: string
  conversationStage: string
  outcomeRecommendation?: {
    type: 'tutorial' | 'opportunities' | 'create'
    confidence: number
    redirectUrl?: string
    message: string
    recommendations: ('tutorial' | 'opportunities' | 'create')[]
  }
  questionsAsked: number
  rateLimitInfo?: {
    remaining: number
    limit: number
    reset: number
  }
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface UserMemory {
  id: string
  wallet_address: string
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  art_interests: string[]
  learning_goals: string[]
  total_sessions: number
  successful_outcomes: number
  preferred_outcome_path?: string
  conversation_context: any
}

interface ConversationSession {
  id: string
  wallet_address: string
  conversation_stage: 'initial' | 'assessing' | 'recommending' | 'completed'
  outcome_path?: 'tutorial' | 'opportunities' | 'create'
  questions_asked: number
  locale: string
  user_level: 'beginner' | 'intermediate' | 'advanced'
}

interface AssessmentResponse {
  question_type: string
  question_text: string
  user_response: string
  assessment_score: number
}

// Use the ChatMemoryService for all database operations

// Language mapping for system instructions
const languageInstructions: Record<string, string> = {
  en: "Respond in English.",
  es: "Responde en español.",
  fr: "Réponds en français.",
  pt: "Responda em português."
}

// Super simple questions for beginners
const assessmentQuestions = {
  experience: {
    en: "Have you made digital art before?",
    es: "¿Has hecho arte digital antes?",
    fr: "Avez-vous déjà fait de l'art numérique?",
    pt: "Você já fez arte digital?"
  },
  goals: {
    en: "What sounds fun: learning, finding work, or making art?",
    es: "¿Qué suena divertido: aprender, encontrar trabajo, o hacer arte?",
    fr: "Qu'est-ce qui semble amusant: apprendre, trouver du travail, ou faire de l'art?",
    pt: "O que parece divertido: aprender, encontrar trabalho, ou fazer arte?"
  },
  interests: {
    en: "What art do you love most?",
    es: "¿Qué arte amas más?",
    fr: "Quel art aimez-vous le plus?",
    pt: "Que arte você mais ama?"
  },
  time: {
    en: "Do you like to learn slowly?",
    es: "¿Te gusta aprender despacio?",
    fr: "Aimez-vous apprendre lentement?",
    pt: "Você gosta de aprender devagar?"
  },
  technical: {
    en: "Are apps easy for you?",
    es: "¿Las apps son fáciles para ti?",
    fr: "Les apps sont-elles faciles pour vous?",
    pt: "Os apps são fáceis para você?"
  }
}

// Set up rate limiting
let ratelimit: Ratelimit | undefined

try {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  })
  
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "60 s"),
    analytics: true,
    prefix: "app:intelligent-chat:",
  })
} catch (error) {
  console.warn("⚠️ Rate limiting not configured:", (error as Error).message)
}

// Initialize chat model
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENROUTER_API_KEY || '',
  modelName: 'openai/gpt-4o-mini',
  temperature: 0.7,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      'X-Title': 'Art Hub Intelligent Chat',
    },
  },
})

// All database operations are now handled by ChatMemoryService

function analyzeUserResponse(questionType: string, response: string, locale: string): number {
  const lowerResponse = response.toLowerCase()
  
  // Enhanced detection for CREATE intent throughout conversation
  if (lowerResponse.includes('nft') || lowerResponse.includes('mint') || lowerResponse.includes('create art') ||
      lowerResponse.includes('art nft') || lowerResponse.includes('ready') || lowerResponse.includes('wallet') ||
      lowerResponse.includes('marketplace') || lowerResponse.includes('upload') || lowerResponse.includes('publish') ||
      lowerResponse.includes('have my artwork') || lowerResponse.includes('have artwork') || lowerResponse.includes('my art') ||
      lowerResponse.includes('upload here') || lowerResponse.includes('create here') || lowerResponse.includes('mint here') ||
      lowerResponse.includes('publish nft') || lowerResponse.includes('create nft') || lowerResponse.includes('make nft') ||
      lowerResponse.includes('/create') || lowerResponse.includes('create page') || lowerResponse.includes('the link') ||
      lowerResponse.includes('crear') || lowerResponse.includes('créer') || lowerResponse.includes('subir') ||
      lowerResponse.includes('publicar') || lowerResponse.includes('télécharger') || lowerResponse.includes('publier') ||
      lowerResponse.includes('criar') || lowerResponse.includes('cunhar') || lowerResponse.includes('minter') ||
      lowerResponse.includes('fazer upload') || lowerResponse.includes('publicar')) {
    return 5 // Strong CREATE signal regardless of question type
  }
  
  // Enhanced detection for TUTORIAL intent
  if (lowerResponse.includes('learn') || lowerResponse.includes('how') || lowerResponse.includes('tutorial') ||
      lowerResponse.includes('beginner') || lowerResponse.includes('new') || lowerResponse.includes('help') ||
      lowerResponse.includes('guide') || lowerResponse.includes('start') || lowerResponse.includes('first time') ||
      lowerResponse.includes('aprender') || lowerResponse.includes('ayuda') || lowerResponse.includes('guía') ||
      lowerResponse.includes('apprendre') || lowerResponse.includes('aide') || lowerResponse.includes('commencer') ||
      lowerResponse.includes('ajuda') || lowerResponse.includes('começar')) {
    return 1 // Strong TUTORIAL signal
  }
  
  // Enhanced detection for OPPORTUNITIES intent  
  if (lowerResponse.includes('work') || lowerResponse.includes('job') || lowerResponse.includes('money') ||
      lowerResponse.includes('earn') || lowerResponse.includes('income') || lowerResponse.includes('opportunities') ||
      lowerResponse.includes('freelance') || lowerResponse.includes('career') || lowerResponse.includes('sell') ||
      lowerResponse.includes('trabajo') || lowerResponse.includes('dinero') || lowerResponse.includes('ganar') ||
      lowerResponse.includes('travail') || lowerResponse.includes('argent') || lowerResponse.includes('gagner') ||
      lowerResponse.includes('trabalho') || lowerResponse.includes('dinheiro') || lowerResponse.includes('ganhar')) {
    return 2 // Strong OPPORTUNITIES signal
  }
  
  switch (questionType) {
    case 'experience':
      if (lowerResponse.includes('beginner') || lowerResponse.includes('new') || lowerResponse.includes('never') || 
          lowerResponse.includes('principiante') || lowerResponse.includes('nuevo') || lowerResponse.includes('nunca') ||
          lowerResponse.includes('débutant') || lowerResponse.includes('nouveau') || lowerResponse.includes('jamais') ||
          lowerResponse.includes('iniciante') || lowerResponse.includes('novo') || lowerResponse.includes('nunca')) {
        return 1
      } else if (lowerResponse.includes('some') || lowerResponse.includes('little') || lowerResponse.includes('basic') ||
                 lowerResponse.includes('algo') || lowerResponse.includes('poco') || lowerResponse.includes('básico') ||
                 lowerResponse.includes('un peu') || lowerResponse.includes('basique') ||
                 lowerResponse.includes('pouco') || lowerResponse.includes('básico')) {
        return 3
      } else {
        return 5
      }
    
    case 'goals':
      if (lowerResponse.includes('learn') || lowerResponse.includes('skill') || lowerResponse.includes('tutorial') ||
          lowerResponse.includes('aprender') || lowerResponse.includes('habilidad') || lowerResponse.includes('tutorial') ||
          lowerResponse.includes('apprendre') || lowerResponse.includes('compétence') ||
          lowerResponse.includes('aprender') || lowerResponse.includes('habilidade')) {
        return 1 // Tutorial path
      } else if (lowerResponse.includes('opportunities') || lowerResponse.includes('work') || lowerResponse.includes('job') ||
                 lowerResponse.includes('oportunidades') || lowerResponse.includes('trabajo') ||
                 lowerResponse.includes('opportunités') || lowerResponse.includes('travail') ||
                 lowerResponse.includes('oportunidades') || lowerResponse.includes('trabalho')) {
        return 2 // Opportunities path
      } else if (lowerResponse.includes('nft') || lowerResponse.includes('create') || lowerResponse.includes('mint') ||
                 lowerResponse.includes('crear') || lowerResponse.includes('crear') ||
                 lowerResponse.includes('créer') || lowerResponse.includes('minter') ||
                 lowerResponse.includes('criar') || lowerResponse.includes('cunhar')) {
        return 5 // Strong CREATE signal
      }
      return 3
    
    case 'time':
      if (lowerResponse.includes('minutes') || lowerResponse.includes('little') || lowerResponse.includes('busy') ||
          lowerResponse.includes('minutos') || lowerResponse.includes('poco') || lowerResponse.includes('ocupado') ||
          lowerResponse.includes('minutes') || lowerResponse.includes('peu') || lowerResponse.includes('occupé') ||
          lowerResponse.includes('minutos') || lowerResponse.includes('pouco') || lowerResponse.includes('ocupado')) {
        return 1
      } else {
        return 3
      }
    
    default:
      // Check for CREATE intent in any response
      if (lowerResponse.includes('yes') && questionType === 'general') {
        return 4 // Positive response
      }
      return 3
  }
}

async function shouldCompleteAssessment(
  assessmentResponses: AssessmentResponse[], 
  assistantResponseCount: number, 
  userMemory: UserMemory | null
): Promise<boolean> {
  // Check for very strong immediate signals - can complete after just 3 interactions
  if (assistantResponseCount >= 3) {
    const veryStrongSignals = assessmentResponses.filter(response => 
      response.assessment_score === 1 || // TUTORIAL
      response.assessment_score === 2 || // OPPORTUNITIES  
      response.assessment_score === 5    // CREATE
    )
    
    // If we have multiple very strong signals, complete immediately
    if (veryStrongSignals.length >= 2) { // Lowered from 3 to 2
      console.log(`Very strong signals detected (${veryStrongSignals.length}) - completing assessment early`)
      return true
    }
    
    // Special case: If we have even 1 CREATE signal and user mentions /create page, complete
    const createSignals = assessmentResponses.filter(response => response.assessment_score === 5)
    const mentionsCreatePage = assessmentResponses.some(response => 
      response.user_response.toLowerCase().includes('/create') ||
      response.user_response.toLowerCase().includes('create page')
    )
    
    if (createSignals.length >= 1 && mentionsCreatePage) {
      console.log(`CREATE signals + /create page mention detected - completing assessment`)
      return true
    }
  }
  
  // Minimum 4 interactions before normal completion consideration
  if (assistantResponseCount < 4) return false
  
  // Enhanced early completion logic for any clear intent
  if (assessmentResponses.length >= 2) {
    const strongSignals = assessmentResponses.filter(response => 
      response.assessment_score === 1 || // TUTORIAL signals
      response.assessment_score === 2 || // OPPORTUNITIES signals  
      response.assessment_score === 5    // CREATE signals
    )
    
    const clearPathIndicators = assessmentResponses.filter(response => {
      // Strong indicators for specific paths
      if (response.assessment_score === 1) return true // Clear tutorial need
      if (response.assessment_score === 2) return true // Clear opportunities need
      if (response.assessment_score === 5) return true // Clear create intent
      if (response.question_type === 'goals' && response.assessment_score >= 4) return true // General create intent
      if (response.question_type === 'experience' && response.assessment_score >= 4) return true // Advanced user
      return false
    })
    
    // If we have 2+ strong signals for any path, complete early
    if (strongSignals.length >= 2 && assistantResponseCount >= 4) {
      console.log(`Early completion triggered: ${strongSignals.length} strong signals detected`)
      return true
    }
    
    // If we have 2+ clear indicators and minimum interactions, complete assessment
    if (clearPathIndicators.length >= 2 && assistantResponseCount >= 4) {
      console.log(`Early completion triggered: ${clearPathIndicators.length} clear path indicators`)
      return true
    }
  }
  
  // Continue if user seems uncertain or responses are mixed
  if (assistantResponseCount >= 6) {
    // Check for uncertainty patterns
    const uncertainResponses = assessmentResponses.filter(response => 
      response.assessment_score === 2 || response.assessment_score === 3
    )
    
    // If most responses are uncertain, complete after 6-7 interactions
    if (uncertainResponses.length >= assessmentResponses.length * 0.6) return true
  }
  
  // For returning users with history, complete faster
  if (userMemory && userMemory.total_sessions > 2 && assistantResponseCount >= 4) return true
  
  return false
}

function determineOutcomePath(assessmentResponses: AssessmentResponse[], userMemory: UserMemory | null): { 
  type: 'tutorial' | 'opportunities' | 'create'
  confidence: number
  recommendations: ('tutorial' | 'opportunities' | 'create')[]
} {
  let tutorialScore = 2 // Default bias toward tutorial for beginners
  let opportunitiesScore = 1
  let createScore = 1
  
  // Extra boost for CREATE when user explicitly mentions upload/publish intent
  const hasUploadPublishIntent = assessmentResponses.some(response => 
    response.user_response.toLowerCase().includes('upload') ||
    response.user_response.toLowerCase().includes('publish') ||
    response.user_response.toLowerCase().includes('have my artwork') ||
    response.user_response.toLowerCase().includes('have artwork')
  )
  
  if (hasUploadPublishIntent) {
    createScore += 5 // Major boost for explicit upload/publish intent
    console.log('Upload/Publish intent detected - boosting CREATE score')
  }
  
  // Analyze assessment responses with enhanced detection for all paths
  assessmentResponses.forEach(response => {
    // Handle strong signals for each path
    if (response.assessment_score === 1) {
      // Strong TUTORIAL signal
      tutorialScore += 6
      console.log(`Strong TUTORIAL signal detected: ${response.question_type} = ${response.assessment_score}`)
    } else if (response.assessment_score === 2) {
      // Strong OPPORTUNITIES signal
      opportunitiesScore += 6
      console.log(`Strong OPPORTUNITIES signal detected: ${response.question_type} = ${response.assessment_score}`)
    } else if (response.assessment_score === 5) {
      // Strong CREATE signal
      createScore += 6
      console.log(`Strong CREATE signal detected: ${response.question_type} = ${response.assessment_score}`)
    } else {
      // Standard scoring logic for medium signals
      if (response.question_type === 'experience') {
        if (response.assessment_score <= 2) tutorialScore += 2
        else if (response.assessment_score >= 4) createScore += 2
        else opportunitiesScore += 1 // Medium experience might want opportunities
      }
      
      if (response.question_type === 'goals') {
        if (response.assessment_score <= 2) tutorialScore += 3
        else if (response.assessment_score === 3) opportunitiesScore += 3
        else if (response.assessment_score >= 4) createScore += 3
      }
      
      if (response.question_type === 'time') {
        if (response.assessment_score <= 2) tutorialScore += 1
        else opportunitiesScore += 1
      }
      
      // For other question types, distribute based on score
      if (!['experience', 'goals', 'time'].includes(response.question_type)) {
        if (response.assessment_score <= 2) tutorialScore += 1
        else if (response.assessment_score === 3) opportunitiesScore += 1
        else createScore += 1
      }
    }
  })
  
  // Consider user memory/history
  if (userMemory) {
    if (userMemory.experience_level === 'beginner') tutorialScore += 2
    else if (userMemory.experience_level === 'advanced') createScore += 2
    
    if (userMemory.preferred_outcome_path) {
      if (userMemory.preferred_outcome_path === 'tutorial') tutorialScore += 3
      else if (userMemory.preferred_outcome_path === 'opportunities') opportunitiesScore += 3
      else if (userMemory.preferred_outcome_path === 'create') createScore += 3
    }
  }
  
  // Determine primary recommendation and additional options
  const scores = [
    { type: 'tutorial' as const, score: tutorialScore },
    { type: 'opportunities' as const, score: opportunitiesScore },
    { type: 'create' as const, score: createScore }
  ].sort((a, b) => b.score - a.score)
  
  const totalScore = tutorialScore + opportunitiesScore + createScore
  const primaryConfidence = totalScore > 0 ? scores[0].score / totalScore : 0.7
  
  console.log(`Outcome scores: tutorial=${tutorialScore}, opportunities=${opportunitiesScore}, create=${createScore}`)
  
  // Smart recommendation logic - default to showing all 3 options unless we have clear intent
  const recommendations: ('tutorial' | 'opportunities' | 'create')[] = []
  const scoreDifference = scores[0].score - scores[1].score
  const secondDifference = scores[1].score - scores[2].score
  
  if (primaryConfidence >= 0.75 && scoreDifference >= 3) {
    // Very high confidence in one path - show only that option
    recommendations.push(scores[0].type)
    console.log(`High confidence (${Math.round(primaryConfidence * 100)}%) - showing single recommendation: ${scores[0].type}`)
  } else if (primaryConfidence >= 0.6 && scoreDifference >= 2) {
    // Good confidence - show primary + secondary
    recommendations.push(scores[0].type, scores[1].type)
    console.log(`Medium confidence (${Math.round(primaryConfidence * 100)}%) - showing 2 recommendations: ${scores[0].type}, ${scores[1].type}`)
  } else {
    // Low confidence or unclear intent - show all 3 options
    recommendations.push('tutorial', 'opportunities', 'create')
    console.log(`Low confidence (${Math.round(primaryConfidence * 100)}%) - showing all 3 options`)
  }
  
  // Special cases for mixed signals
  const hasStrongTutorialSignals = assessmentResponses.some(r => r.assessment_score === 1)
  const hasStrongOpportunitiesSignals = assessmentResponses.some(r => r.assessment_score === 2)
  const hasStrongCreateSignals = assessmentResponses.some(r => r.assessment_score === 5)
  
  // If we have mixed strong signals, ensure we show appropriate options
  const strongSignalCount = [hasStrongTutorialSignals, hasStrongOpportunitiesSignals, hasStrongCreateSignals].filter(Boolean).length
  
  if (strongSignalCount >= 2 && recommendations.length < 3) {
    // Multiple strong signals detected - user might be exploring options
    recommendations.length = 0 // Clear current recommendations
    recommendations.push('tutorial', 'opportunities', 'create')
    console.log(`Mixed strong signals detected (${strongSignalCount}) - showing all 3 options for exploration`)
  } else if (recommendations.length === 1) {
    // Single recommendation but add relevant backup based on primary
    if (scores[0].type === 'create' && hasStrongCreateSignals) {
      recommendations.push('tutorial') // CREATE users might want to learn more
    } else if (scores[0].type === 'tutorial' && hasStrongTutorialSignals) {
      recommendations.push('create') // TUTORIAL users might want to try creating
    } else if (scores[0].type === 'opportunities' && hasStrongOpportunitiesSignals) {
      recommendations.push('tutorial') // OPPORTUNITIES users might need to learn first
    }
    console.log(`Single strong signal for ${scores[0].type} - adding complementary option`)
  }
  
  return { 
    type: scores[0].type, 
    confidence: primaryConfidence,
    recommendations 
  }
}

function generateOutcomeMessage(outcome: 'tutorial' | 'opportunities' | 'create', locale: string): { message: string, redirectUrl?: string } {
  const messages = {
    tutorial: {
      en: "Perfect! 🎨 I know what's best for you!",
      es: "¡Perfecto! 🎨 ¡Sé qué es mejor para ti!",
      fr: "Parfait! 🎨 Je sais ce qui est le mieux pour vous!",
      pt: "Perfeito! 🎨 Eu sei o que é melhor para você!"
    },
    opportunities: {
      en: "Great! 🌟 I found something perfect for you!",
      es: "¡Genial! 🌟 ¡Encontré algo perfecto para ti!",
      fr: "Super! 🌟 J'ai trouvé quelque chose de parfait pour vous!",
      pt: "Ótimo! 🌟 Encontrei algo perfeito para você!"
    },
    create: {
      en: "Awesome! 🚀 You're ready to make art!",
      es: "¡Increíble! 🚀 ¡Estás listo para hacer arte!",
      fr: "Génial! 🚀 Vous êtes prêt à faire de l'art!",
      pt: "Incrível! 🚀 Você está pronto para fazer arte!"
    }
  }
  
  const redirectUrls = {
    tutorial: '/tutorials/art3hub-connect.mp4',
    opportunities: '/opportunities',
    create: '/create'
  }
  
  return {
    message: messages[outcome][locale] || messages[outcome].en,
    redirectUrl: redirectUrls[outcome]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, walletAddress, locale = 'en' } = await request.json() as {
      message: string
      walletAddress: string
      locale?: string
    }
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required for intelligent chat' },
        { status: 400 }
      )
    }
    
    // Apply rate limiting
    let rateLimitInfo: RateLimitInfo | undefined
    
    if (ratelimit) {
      rateLimitInfo = await ratelimit.limit(walletAddress)
      
      if (!rateLimitInfo.success) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please try again later.',
            rateLimitInfo: { 
              limit: rateLimitInfo.limit, 
              reset: rateLimitInfo.reset, 
              remaining: rateLimitInfo.remaining 
            }
          },
          { status: 429 }
        )
      }
    }
    
    // Get user memory and conversation session
    const userMemory = await ChatMemoryService.getUserMemory(walletAddress)
    const session = await ChatMemoryService.getOrCreateConversationSession(walletAddress, locale)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create conversation session' },
        { status: 500 }
      )
    }
    
    // Get conversation history
    const conversationHistory = await ChatMemoryService.getConversationMessages(session.id)
    
    // Count assistant responses (exclude system messages)
    const assistantResponseCount = conversationHistory.filter(msg => msg.role === 'assistant').length
    
    // Count assistant responses to determine when to show actions
    
    const messageOrder = conversationHistory.length + 1
    
    // Save user message
    await ChatMemoryService.saveConversationMessage(session.id, 'user', message, messageOrder)
    
    // Get language instruction
    const languageInstruction = languageInstructions[locale] || languageInstructions.en
    
    let systemPrompt = ''
    let assistantResponse = ''
    let newStage = session.conversation_stage
    let outcomeRecommendation: ApiResponse['outcomeRecommendation'] = undefined
    
    // Get user context for personalization
    const userContext = await ChatMemoryService.getConversationContext(walletAddress)
    
    // Determine conversation flow based on stage
    if (session.conversation_stage === 'initial') {
      // Analyze the initial message for strong CREATE signals
      const initialScore = analyzeUserResponse('initial', message, locale)
      console.log(`Initial message analysis: "${message}" -> Score: ${initialScore}`)
      
      // Save the initial analysis
      await ChatMemoryService.saveAssessmentResponse(session.id, 'initial', 'Initial conversation', message, initialScore)
      
      // If initial message shows very strong CREATE intent, we can skip to recommendations
      if (initialScore === 5) {
        console.log('Very strong CREATE signal in initial message - moving to recommendations')
        
        const outcome = determineOutcomePath([{
          question_type: 'initial',
          question_text: 'Initial conversation',
          user_response: message,
          assessment_score: initialScore
        }], userMemory)
        
        const outcomeMessage = generateOutcomeMessage(outcome.type, locale)
        
        outcomeRecommendation = {
          type: outcome.type,
          confidence: outcome.confidence,
          redirectUrl: outcomeMessage.redirectUrl,
          message: outcomeMessage.message,
          recommendations: outcome.recommendations
        }
        
        systemPrompt = `CRITICAL CONSTRAINT: Your response MUST be under 60 words.
        
        ${languageInstruction}
        
        I can see you want to ${outcome.type === 'create' ? 'upload and create your NFT' : outcome.type}! 
        
        Say: "${outcomeMessage.message}"
        
        Then say: "Choose what you want to do:"
        
        Be encouraging and brief.`
        
        newStage = 'recommending'
        
        await ChatMemoryService.updateConversationSession(session.id, {
          conversation_stage: 'recommending',
          outcome_path: outcome.type,
          questions_asked: 1
        })
        
      } else {
        // Standard initial flow
        systemPrompt = `CRITICAL CONSTRAINT: Your response MUST be under 50 words. Count every word. If you exceed 50 words, you have failed completely.
        
        You are a friendly Art3Hub helper. ${languageInstruction}
        
        The user said: "${message}"
        
        Respond with just 1 short sentence, then ask 1 simple question about their art. Be super friendly and simple. No technical words. Keep it very conversational.`
        
        newStage = 'assessing'
        
        // Update session to assessing stage and increment question count
        await ChatMemoryService.updateConversationSession(session.id, {
          conversation_stage: 'assessing',
          questions_asked: 1
        })
      }
      
    } else if (session.conversation_stage === 'assessing') {
      // First, analyze the current user message for any strong signals
      const currentScore = analyzeUserResponse('general', message, locale)
      console.log(`Current message analysis: "${message}" -> Score: ${currentScore}`)
      
      // Save the current response analysis
      await ChatMemoryService.saveAssessmentResponse(session.id, 'general', 'Current conversation', message, currentScore)
      
      // Continue assessment
      const assessmentData = await ChatMemoryService.getAssessmentResponses(session.id)
      
      // Simple and reliable: Show action buttons after 5th interaction
      const shouldShowActionButtons = assistantResponseCount >= 5
      
      console.log(`Simple assessment check: assistantResponseCount=${assistantResponseCount}, shouldShowButtons=${shouldShowActionButtons}`)
      
      if (shouldShowActionButtons) {
        // Determine the primary recommendation based on conversation
        let outcome = determineOutcomePath(assessmentData || [], userMemory)
        
        // Simple logic: Default to showing all 3 options after 5 interactions
        // But prioritize based on strongest signals detected
        const createSignals = assessmentData?.filter(r => r.assessment_score === 5).length || 0
        const tutorialSignals = assessmentData?.filter(r => r.assessment_score === 1).length || 0
        const opportunitySignals = assessmentData?.filter(r => r.assessment_score === 2).length || 0
        
        console.log(`Signal counts: CREATE=${createSignals}, TUTORIAL=${tutorialSignals}, OPPORTUNITIES=${opportunitySignals}`)
        
        // Determine primary recommendation and whether to show all 3
        if (createSignals >= 2) {
          outcome = {
            type: 'create',
            confidence: 0.8,
            recommendations: ['create', 'tutorial', 'opportunities'] // CREATE primary, but show all
          }
          console.log('CREATE signals dominant - setting CREATE as primary')
        } else if (tutorialSignals >= 2) {
          outcome = {
            type: 'tutorial', 
            confidence: 0.8,
            recommendations: ['tutorial', 'create', 'opportunities'] // TUTORIAL primary, but show all
          }
          console.log('TUTORIAL signals dominant - setting TUTORIAL as primary')
        } else if (opportunitySignals >= 2) {
          outcome = {
            type: 'opportunities',
            confidence: 0.8, 
            recommendations: ['opportunities', 'tutorial', 'create'] // OPPORTUNITIES primary, but show all
          }
          console.log('OPPORTUNITIES signals dominant - setting OPPORTUNITIES as primary')
        } else {
          // Mixed or unclear signals - show all 3 options with original primary
          outcome = {
            type: outcome.type,
            confidence: 0.6,
            recommendations: ['tutorial', 'opportunities', 'create'] // Show all 3 in default order
          }
          console.log('Mixed signals - showing all 3 options')
        }
        
        const outcomeMessage = generateOutcomeMessage(outcome.type, locale)
        
        outcomeRecommendation = {
          type: outcome.type,
          confidence: outcome.confidence,
          redirectUrl: outcomeMessage.redirectUrl,
          message: outcomeMessage.message,
          recommendations: outcome.recommendations
        }
        
        systemPrompt = `CRITICAL CONSTRAINT: Your response MUST be under 60 words. Count every word.
        
        ${languageInstruction}
        
        Perfect! I understand what you're looking for. Here are your options:
        
        Say: "Choose what you want to do:"
        
        Keep it very brief. The user will see action buttons below to navigate to different sections.`
        
        newStage = 'recommending'
        
        // Update session with outcome
        await ChatMemoryService.updateConversationSession(session.id, {
          conversation_stage: 'recommending',
          outcome_path: outcome.type,
          questions_asked: assistantResponseCount + 1 // Use actual count
        })
          
      } else {
        // Continue assessment with next question
        const questionsAsked = session.questions_asked || 0
        const nextQuestionType = ['experience', 'goals', 'interests', 'time', 'technical'][questionsAsked]
        const nextQuestion = assessmentQuestions[nextQuestionType as keyof typeof assessmentQuestions]?.[locale] || 
                            assessmentQuestions[nextQuestionType as keyof typeof assessmentQuestions]?.en
        
        systemPrompt = `CRITICAL CONSTRAINT: Your response MUST be under 50 words. Count every word. If you exceed 50 words, you have failed completely.
        
        ${languageInstruction}
        
        Say "Cool!" or "Nice!" then ask: "${nextQuestion}"
        
        Be super simple and friendly. Keep it conversational.`
        
        // Analyze the user's previous response for assessment scoring
        if (assistantResponseCount > 0) {
          const lastQuestionType = ['experience', 'goals', 'interests', 'time', 'technical'][(assistantResponseCount - 1) % 5] || 'general'
          const score = analyzeUserResponse(lastQuestionType, message, locale)
          await ChatMemoryService.saveAssessmentResponse(session.id, lastQuestionType, nextQuestion || 'Assessment question', message, score)
          
          console.log(`Analyzing response: "${message}" -> Type: ${lastQuestionType}, Score: ${score}`)
        }
        
        // Update session with incremented questions (but don't exceed 5)
        await ChatMemoryService.updateConversationSession(session.id, {
          questions_asked: Math.min(assistantResponseCount + 1, 5)
        })
      }
    } else if (session.conversation_stage === 'recommending') {
      // Handle follow-up questions after recommendation
      systemPrompt = `CRITICAL CONSTRAINT: Your response MUST be under 50 words. Count every word. If you exceed 50 words, you have failed completely.
      
      ${languageInstruction}
      
      The user has received their recommendation. Answer any follow-up questions they have and help them proceed.
      If they're ready to move forward, guide them to the recommended path.
      If they want to change paths, be supportive and help them choose differently.
      
      Be friendly and simple.`
    }
    
    // Get response from AI model
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))),
      { role: 'user', content: message }
    ]
    
    const completion = await chatModel.completionWithRetry({
      messages,
      model: 'openai/gpt-4o-mini',
    })
    
    assistantResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
    
    // Save assistant response
    await ChatMemoryService.saveConversationMessage(session.id, 'assistant', assistantResponse, messageOrder + 1)
    
    // Update user memory
    if (newStage === 'recommending' && outcomeRecommendation) {
      await ChatMemoryService.updateUserMemoryAfterOutcome(
        walletAddress,
        outcomeRecommendation.type,
        {
          last_outcome: outcomeRecommendation.type,
          last_confidence: outcomeRecommendation.confidence
        }
      )
    }
    
    // Prepare response - return the correct count after this response
    const finalResponseCount = assistantResponseCount + 1
    const responseObj: ApiResponse = {
      response: assistantResponse,
      conversationStage: newStage,
      questionsAsked: finalResponseCount,
      outcomeRecommendation
    }
    
    const headers: HeadersInit = {}
    
    if (rateLimitInfo) {
      headers['X-RateLimit-Limit'] = rateLimitInfo.limit.toString()
      headers['X-RateLimit-Remaining'] = rateLimitInfo.remaining.toString()
      headers['X-RateLimit-Reset'] = rateLimitInfo.reset.toString()
      
      responseObj.rateLimitInfo = {
        remaining: rateLimitInfo.remaining,
        limit: rateLimitInfo.limit,
        reset: rateLimitInfo.reset
      }
    }
    
    return NextResponse.json(responseObj, { headers })
    
  } catch (error) {
    console.error('Error in intelligent chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process intelligent chat request' },
      { status: 500 }
    )
  }
}