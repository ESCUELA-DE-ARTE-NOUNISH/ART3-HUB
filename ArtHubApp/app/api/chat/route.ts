import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Define types
type RateLimitInfo = {
  success: boolean
  limit: number
  reset: number
  remaining: number
}

interface ApiResponse {
  response: string
  rateLimitInfo?: {
    remaining: number
    limit: number
    reset: number
  }
}

// In-memory message storage - in a production app, use a persistent database
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatSession {
  messages: Message[]
  lastUpdated: number
}

// Language mapping for system instructions
const languageInstructions: Record<string, string> = {
  en: "Respond in English.",
  es: "Responde en español.",
  fr: "Réponds en français.",
  pt: "Responda em português."
}

// Simple in-memory store for chat sessions
const chatSessions: Record<string, ChatSession> = {}

// Set up rate limiting with Upstash Redis
let ratelimit: Ratelimit | undefined

try {
  // Initialize Redis client with Upstash credentials
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  })
  
  // Create rate limiter: 5 requests per 60 seconds per user
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "60 s"),
    analytics: true,
    prefix: "app:chat:", // Prefix for Redis keys
  })
  console.log("✅ Rate limiting enabled with Upstash Redis")
} catch (error) {
  console.warn("⚠️ Rate limiting not configured:", (error as Error).message)
  // App will continue without rate limiting
}

// Initialize the chat model using OpenRouter through OpenAI compatible API
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENROUTER_API_KEY || '',
  modelName: 'openai/gpt-4o-mini', // OpenRouter model identifier
  temperature: 0.7, 
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1', // OpenRouter API endpoint
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'http://localhost:3000', // Your app's URL
      'X-Title': 'Art Hub Chat App', // Your app's name
    },
  },
})

export async function POST(request: NextRequest) {
  try {
    const { message, userId, locale = 'en' } = await request.json() as { 
      message: string, 
      userId: string,
      locale?: string 
    }
    
    // Get client IP as fallback identifier if userId is not provided
    const identifier = userId || request.headers.get("x-forwarded-for") || "anonymous"
    
    // Apply rate limiting
    let rateLimitInfo: RateLimitInfo | undefined
    
    if (ratelimit) {
      rateLimitInfo = await ratelimit.limit(identifier)
      
      // If rate limit exceeded, return 429 Too Many Requests
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
          { 
            status: 429, 
            headers: { 
              'X-RateLimit-Limit': rateLimitInfo.limit.toString(), 
              'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(), 
              'X-RateLimit-Reset': rateLimitInfo.reset.toString() 
            } 
          }
        )
      }
      
      // Log remaining requests for debugging
      console.log(`Rate limit remaining for ${identifier}: ${rateLimitInfo.remaining}`)
    }
    
    // Get language instruction based on locale, defaulting to English
    const languageInstruction = languageInstructions[locale] || languageInstructions.en
    
    // Initialize or retrieve chat session
    if (!chatSessions[userId]) {
      chatSessions[userId] = {
        messages: [{
          role: 'system',
          content: `You are a friendly Web3 guide for beginners who are new to the Art3-Hub platform and Nouns community.

          ${languageInstruction}

          IMPORTANT GUIDELINES:
          - Keep your responses SHORT and SIMPLE - use plain language a 10-year-old could understand
          - Avoid technical jargon - always explain terms in the simplest way possible
          - Use friendly, conversational language
          - Break information into small, digestible chunks
          - NEVER overwhelm users with too much information at once
          - If explaining something complex, focus on just 1-2 key points
          - Ask if the user wants more details before expanding on a topic
          - Use examples and analogies that relate to everyday life
          
          About Nouns (in simple terms):
          - Nouns are colorful, pixelated character images (like digital collectibles)
          - One new Noun is created and sold daily through an online auction
          - When you own a Noun, you get to vote on how the community's money is used
          - Think of it like being part of a digital art club where members decide what projects to fund
          
          About Art3-Hub (in simple terms):
          - Art3-Hub is a website that helps artists create and sell digital art in the Nouns community
          - It connects artists with opportunities in the Nouns world
          - It's a friendly place to learn about digital art and collecting
          - The platform makes it easy for beginners to get started in the Nouns universe
          
          Remember, your MAIN JOB is to make Web3 concepts feel SIMPLE and APPROACHABLE for complete beginners.
          After providing a simple explanation, you can ask: "Would you like me to explain more about this?"`
        }],
        lastUpdated: Date.now()
      }
    } else {
      // If session exists but locale changed, update the system message
      const systemMessage = chatSessions[userId].messages[0]
      if (systemMessage.role === 'system' && !systemMessage.content.includes(languageInstruction)) {
        // Update the system message with the new language instruction
        const updatedContent = systemMessage.content.replace(
          new RegExp("^(You are a friendly Web3 guide.*?)(?:Respond in \\w+\\.|Responde en español\\.|Réponds en français\\.|Responda em português\\.)?([\\s\\S]*IMPORTANT GUIDELINES)"),
          `$1${languageInstruction}$2`
        )
        chatSessions[userId].messages[0].content = updatedContent
      }
    }
    
    // Add user message to the session
    chatSessions[userId].messages.push({
      role: 'user',
      content: message
    })
    
    // Update the last updated timestamp
    chatSessions[userId].lastUpdated = Date.now()
    
    // Prepare messages for the model
    const messagesToSend = chatSessions[userId].messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    // Get response from the model
    const completion = await chatModel.completionWithRetry({
      messages: messagesToSend,
      model: 'openai/gpt-4o-mini',
    })
    
    // Extract the assistant's response
    const assistantResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response."
    
    // Add assistant response to session
    chatSessions[userId].messages.push({
      role: 'assistant',
      content: assistantResponse
    })
    
    // Keep chat history at a reasonable length (optional)
    if (chatSessions[userId].messages.length > 20) {
      // Keep system message and last 19 messages
      const systemMessage = chatSessions[userId].messages[0]
      chatSessions[userId].messages = [
        systemMessage,
        ...chatSessions[userId].messages.slice(-19)
      ]
    }
    
    // Return successful response with rate limit headers if applicable
    const responseObj: ApiResponse = { response: assistantResponse }
    const headers: HeadersInit = {}
    
    if (rateLimitInfo) {
      headers['X-RateLimit-Limit'] = rateLimitInfo.limit.toString()
      headers['X-RateLimit-Remaining'] = rateLimitInfo.remaining.toString()
      headers['X-RateLimit-Reset'] = rateLimitInfo.reset.toString()
      
      // Add rate limit info to response for client-side handling
      responseObj.rateLimitInfo = {
        remaining: rateLimitInfo.remaining,
        limit: rateLimitInfo.limit,
        reset: rateLimitInfo.reset
      }
    }
    
    return NextResponse.json(responseObj, { headers })
    
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
} 