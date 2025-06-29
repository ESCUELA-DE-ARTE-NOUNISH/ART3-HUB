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
        return 3 // Create path
      }
      return 2
    
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
      return 3
  }
}

function determineOutcomePath(assessmentResponses: AssessmentResponse[], userMemory: UserMemory | null): { type: 'tutorial' | 'opportunities' | 'create', confidence: number } {
  let tutorialScore = 2 // Default bias toward tutorial for beginners
  let opportunitiesScore = 1
  let createScore = 1
  
  // Analyze assessment responses
  assessmentResponses.forEach(response => {
    if (response.question_type === 'experience') {
      if (response.assessment_score <= 2) tutorialScore += 3
      else if (response.assessment_score >= 4) createScore += 2
    }
    
    if (response.question_type === 'goals') {
      if (response.assessment_score === 1) tutorialScore += 4
      else if (response.assessment_score === 2) opportunitiesScore += 4
      else if (response.assessment_score === 3) createScore += 4
    }
    
    if (response.question_type === 'time') {
      if (response.assessment_score <= 2) tutorialScore += 1
      else opportunitiesScore += 1
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
  
  // Determine winner and confidence
  const maxScore = Math.max(tutorialScore, opportunitiesScore, createScore)
  const totalScore = tutorialScore + opportunitiesScore + createScore
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.7 // Default confidence
  
  console.log(`Outcome scores: tutorial=${tutorialScore}, opportunities=${opportunitiesScore}, create=${createScore}`)
  
  if (tutorialScore === maxScore) return { type: 'tutorial', confidence }
  else if (opportunitiesScore === maxScore) return { type: 'opportunities', confidence }
  else return { type: 'create', confidence }
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
      // Welcome and start assessment
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
      
    } else if (session.conversation_stage === 'assessing') {
      // Continue assessment
      const assessmentData = await ChatMemoryService.getAssessmentResponses(session.id)
      
      // Check if this will be the 5th agent response (after this response, we'll have 5 total)
      if (assistantResponseCount >= 4) {
        // Time to make recommendation
        const outcome = determineOutcomePath(assessmentData || [], userMemory)
        const outcomeMessage = generateOutcomeMessage(outcome.type, locale)
        
        outcomeRecommendation = {
          type: outcome.type,
          confidence: outcome.confidence,
          redirectUrl: outcomeMessage.redirectUrl,
          message: outcomeMessage.message
        }
        
        systemPrompt = `CRITICAL CONSTRAINT: Your response MUST be under 150 words. Count every word. If you exceed 150 words, you have failed completely.
        
        ${languageInstruction}
        
        Say: "${outcomeMessage.message}"
        
        Then say: "Choose what you want to do:" 
        
        Keep it friendly and encouraging. Don't mention confidence or technical stuff.`
        
        newStage = 'recommending'
        
        // Update session with outcome
        await ChatMemoryService.updateConversationSession(session.id, {
          conversation_stage: 'recommending',
          outcome_path: outcome.type,
          questions_asked: 5
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
        if (assistantResponseCount > 0 && assistantResponseCount <= 5) {
          const lastQuestionType = ['experience', 'goals', 'interests', 'time', 'technical'][(assistantResponseCount - 1) % 5]
          const score = analyzeUserResponse(lastQuestionType, message, locale)
          await ChatMemoryService.saveAssessmentResponse(session.id, lastQuestionType, nextQuestion || 'Assessment question', message, score)
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