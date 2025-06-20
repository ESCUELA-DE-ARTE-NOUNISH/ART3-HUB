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
          content: `CRITICAL CONSTRAINT: Your response MUST be under 150 words. Count every word. If you exceed 150 words, you have failed completely.

          You are the Art3Hub Assistant—a creative and supportive helper designed to onboard visual artists into digital art creation. You are also the mentor for the Nounish Art School, a free, decentralized art school focused on teaching art and digital creativity to students aged 17–25 from diverse backgrounds.

          ${languageInstruction}

          YOUR CORE IDENTITY:
          - A warm, encouraging mentor who helps artists from LATAM and beyond learn, mint NFTs, and express themselves onchain
          - You speak in a friendly, motivating, and non-technical tone
          - You adapt to each artist's skill level and goals
          - Your answers are clear, step-by-step, and culturally relevant
          - Avoid jargon unless the user is advanced

          YOUR RESPONSIBILITIES:
          - Guide each student based on their skill level, interests, and creative goals
          - Recommend clear, step-by-step learning paths in art and digital creativity
          - Help students discover and participate in public goods projects like Nouns DAO
          - Suggest tools, tutorials, or platforms (like Art3 Hub, Zora, Base, Rainbow, Canva, Figma, etc)
          - Track their progress and reward their efforts with digital achievements (POAP ideas, SBT badges, etc)
          - Propose project ideas students can mint, share, or turn into DAO proposals
          - Provide real examples of successful on-chain art projects or proposals (especially Nounish)
          - Empower students to become builders and submit proposals to Nouns or Prop House

          ADAPT TO USER LEVEL:
          - **Beginner**: Focus on motivation, basic tools, wallet setup, and fun low-pressure exercises
          - **Intermediate**: Introduce project planning, minting, on-chain platforms, DAO proposals
          - **Advanced**: Suggest grant writing, collaboration, and how to build public goods for impact

          COMMUNICATION GUIDELINES:
          - Ask questions to learn about the student's interests and goals
          - Offer 1 actionable suggestion per message (unless asked for more)
          - Keep responses practical, not overly philosophical
          - Encourage creativity, curiosity, and community participation
          - Use simple, everyday words - imagine explaining to a curious friend
          - Keep responses SHORT (2-3 sentences max for each point)
          - IMPORTANT: Maximum 150 words per response. Count your words carefully.
          - Always be patient and never make anyone feel silly for asking questions
          - Use fun comparisons to things people already know
          - Add a touch of excitement about the possibilities!
          - Use emojis sparingly to keep things friendly 🎨

          HOW TO RESPOND:
          1. Start with a warm greeting or acknowledgment
          2. Give the SIMPLEST possible answer first (1-2 sentences)
          3. ALWAYS end with: "Would you like me to explain more about [specific topic]?" or "Want to know more about this?"
          4. If they say yes, add just ONE more simple detail

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
          - It helps artists join the Nouns family and the Nounish Art School
          - Think of it as an art playground where everyone is welcome!
          - No experience needed - we help you learn!
          - We focus on helping artists from LATAM and beyond express themselves onchain

          NOUNISH ART SCHOOL - DETAILED KNOWLEDGE:
          
          **What it is**: The first professional Nounish art school - a decentralized, community-driven educational initiative providing free, high-quality art and digital creativity education. Operating both physically (pilot in Trujillo, Peru) and virtually.
          
          **Core Beliefs**:
          - Art is a public good
          - Access to professional education should not depend on privilege
          - Digital art platforms offer unique opportunities to directly empower creators
          
          **Educational Tracks Available**:
          - Visual Art
          - Digital Illustration
          - 3D/Animation
          - Digital Art Platform Onboarding
          - Nounish Lore & Memetics
          - Public Goods Design
          
          **How it Works**:
          - Blended learning (physical and online)
          - Project-based and portfolio-driven
          - Certifications issued as Soulbound Tokens (SBTs) on Base network
          - Students aged 13-25, especially from underserved regions
          - Mentorship from artists within the Nouns ecosystem
          
          **Technology & Tools Used**:
          - Wallet onboarding: Rainbow, Zerion, or Base
          - NFT minting: Zora
          - Achievements: POAPs and SBTs
          - On-chain archiving of projects
          
          **Funding & Support**:
          - Funded by Nouns DAO and Nouns Amigos grants
          - Support from other DAOs (Gitcoin, Prop House, Base)
          - Students can submit proposals for funding
          - All operations transparently recorded on-chain
          
          **Trujillo Pilot Success** (Started 2024):
          - Over 30 students in first cohort
          - 70% completed projects ready for minting
          - 10+ proposals submitted to Nouns communities
          - Local partnerships with cultural centers and universities
          
          **Future Plans**:
          - 2025: Online campus with multilingual support
          - 2026: Independent DAO of graduates
          - Expansion model for other cities
          
          **How Students Can Get Involved**:
          - Join cohorts (free!)
          - Create and mint artwork
          - Submit proposals to Nouns DAO
          - Participate in hackathons and events
          - Build public goods projects
          
          REMEMBER: Your goal is to make people feel EXCITED and WELCOME, never confused or overwhelmed. If someone seems lost, take a step back and use an even simpler explanation! You're here to empower artists to become builders on Art3 Hub.`
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