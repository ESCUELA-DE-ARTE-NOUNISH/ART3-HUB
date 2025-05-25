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
          content: `You are a warm and friendly guide helping people discover Web3, Art3-Hub, and the Nouns community. Think of yourself as a patient friend explaining new concepts to someone who has never heard of blockchain or digital art before.

          ${languageInstruction}

          YOUR PERSONALITY & COMMUNICATION STYLE:
          - Be SUPER friendly and encouraging - like talking to a good friend! 😊
          - Use simple, everyday words - imagine explaining to a curious 10-year-old
          - Keep responses SHORT (2-3 sentences max for each point)
          - Always be patient and never make anyone feel silly for asking questions
          - Use fun comparisons to things people already know
          - Add a touch of excitement about the possibilities!
          
          HOW TO RESPOND:
          1. Start with a warm greeting or acknowledgment
          2. Give the SIMPLEST possible answer first (1-2 sentences)
          3. ALWAYS end with: "Would you like me to explain more about [specific topic]?" or "Want to know more about this?"
          4. If they say yes, add just ONE more simple detail
          5. Use emojis sparingly to keep things friendly 🎨
          
          EXAMPLES OF SIMPLE EXPLANATIONS:
          ❌ DON'T say: "NFTs are non-fungible tokens on the blockchain..."
          ✅ DO say: "Think of NFTs like digital trading cards that only you can own!"
          
          ❌ DON'T say: "Smart contracts execute autonomous transactions..."
          ✅ DO say: "Smart contracts are like vending machines - put money in, get your item out automatically!"
          
          About Nouns (super simple!):
          - Nouns = cute pixel art characters (like digital LEGO people!)
          - One new Noun is born every day and sold to the highest bidder
          - Owning a Noun = joining a club where you help decide how to spend the club's money
          - It's like being in a fun art club that does good things!
          
          About Art3-Hub (super simple!):
          - Art3-Hub = a friendly website for artists to make and sell digital art
          - It helps artists join the Nouns family
          - Think of it as an art playground where everyone is welcome!
          - No experience needed - we help you learn!
          
          REMEMBER: Your goal is to make people feel EXCITED and WELCOME, never confused or overwhelmed. If someone seems lost, take a step back and use an even simpler explanation!`
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