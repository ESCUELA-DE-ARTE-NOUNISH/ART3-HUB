"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import Header from "@/components/header"

type Message = {
  role: "user" | "assistant"
  content: string
}

type RateLimitInfo = {
  remaining: number
  limit: number
  reset: number
}

// Welcome messages in different languages
const welcomeMessages: Record<string, string> = {
  en: "Hi! I'm your Web3 guide. Ask me anything about NFTs, wallets, or blockchain technology.",
  es: "¡Hola! Soy tu guía de Web3. Pregúntame cualquier cosa sobre NFTs, billeteras o tecnología blockchain.",
  fr: "Bonjour ! Je suis votre guide Web3. Posez-moi n'importe quelle question sur les NFT, les portefeuilles ou la technologie blockchain.",
  pt: "Olá! Eu sou seu guia Web3. Pergunte-me qualquer coisa sobre NFTs, carteiras ou tecnologia blockchain."
}

// Error messages in different languages
const errorMessages: Record<string, {
  rateLimit: string,
  connectionFailed: string,
  generic: string
}> = {
  en: {
    rateLimit: "Rate limit exceeded. Please try again in",
    connectionFailed: "Failed to connect to the AI service. Please try again later.",
    generic: "Something went wrong. Please try again."
  },
  es: {
    rateLimit: "Límite de consultas excedido. Por favor, inténtelo de nuevo en",
    connectionFailed: "No se pudo conectar al servicio de IA. Por favor, inténtelo más tarde.",
    generic: "Algo salió mal. Por favor, inténtelo de nuevo."
  },
  fr: {
    rateLimit: "Limite de requêtes dépassée. Veuillez réessayer dans",
    connectionFailed: "Échec de la connexion au service d'IA. Veuillez réessayer plus tard.",
    generic: "Quelque chose s'est mal passé. Veuillez réessayer."
  },
  pt: {
    rateLimit: "Limite de taxa excedido. Por favor, tente novamente em",
    connectionFailed: "Falha na conexão com o serviço de IA. Por favor, tente novamente mais tarde.",
    generic: "Algo deu errado. Por favor, tente novamente."
  }
}

// Placeholder text in different languages
const placeholderText: Record<string, string> = {
  en: "Ask a question about NFTs...",
  es: "Haz una pregunta sobre NFTs...",
  fr: "Posez une question sur les NFT...",
  pt: "Faça uma pergunta sobre NFTs..."
}

// Header title in different languages
const headerTitle: Record<string, string> = {
  en: "Education Agent",
  es: "Agente Educativo",
  fr: "Agent Éducatif",
  pt: "Agente Educativo"
}

function AIAgentContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentLocale = (params?.locale as string) || defaultLocale
  
  // Store messages with locale key to prevent cross-locale contamination
  const [conversationHistory, setConversationHistory] = useState<Record<string, Message[]>>({})
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const [userId, setUserId] = useState<string>("")
  
  // Get messages for current locale
  const messages = useMemo(() => {
    if (!conversationHistory[currentLocale]) {
      // Initialize with welcome message for this locale
      const welcomeMessage = welcomeMessages[currentLocale] || welcomeMessages[defaultLocale]
      return [{
        role: "assistant" as const,
        content: welcomeMessage
      }]
    }
    return conversationHistory[currentLocale]
  }, [currentLocale, conversationHistory])
  
  // Update conversation history
  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setConversationHistory(prev => ({
      ...prev,
      [currentLocale]: typeof updater === 'function' 
        ? updater(prev[currentLocale] || [])
        : updater
    }))
  }
  
  // Initialize userId on client side only to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('chatUserId')
      if (storedId) {
        setUserId(storedId)
      } else {
        const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        localStorage.setItem('chatUserId', newId)
        setUserId(newId)
      }
    }
  }, [])

  // Handle initial query parameter from landing page
  useEffect(() => {
    const query = searchParams.get('q')
    if (query && userId && !isLoading) {
      // Set the input and auto-submit the query
      setInput(query)
      
      // Auto-submit after a brief delay to ensure everything is initialized
      const timer = setTimeout(() => {
        const userMessage = { role: "user" as const, content: query }
        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        setError(null)

        // Clear the URL parameter
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('q')
          router.replace(url.pathname + url.search, { scroll: false })
        }

        // Submit to AI
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: query,
            userId: userId,
            locale: currentLocale,
          }),
        })
        .then(async (response) => {
          const data = await response.json()
          
          // Handle rate limit response headers
          if (data.rateLimitInfo) {
            setRateLimitInfo(data.rateLimitInfo)
          }
          
          // Handle error responses
          if (!response.ok) {
            if (response.status === 429) {
              const rateLimitMessage = errorMessages[currentLocale]?.rateLimit || errorMessages[defaultLocale].rateLimit
              setError(`${rateLimitMessage} ${Math.ceil((data.rateLimitInfo?.reset || 60) / 1000)} ${currentLocale === 'en' ? 'seconds' : currentLocale === 'es' ? 'segundos' : currentLocale === 'fr' ? 'secondes' : 'segundos'}.`)
            } else {
              setError(data.error || (errorMessages[currentLocale]?.generic || errorMessages[defaultLocale].generic))
            }
          } else {
            // Add AI response to messages
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
          }
        })
        .catch((error) => {
          console.error("Error generating response:", error)
          setError(errorMessages[currentLocale]?.connectionFailed || errorMessages[defaultLocale].connectionFailed)
        })
        .finally(() => {
          setIsLoading(false)
        })
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [searchParams, userId, currentLocale, isLoading, router])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userId: userId,
          locale: currentLocale,
        }),
      })

      const data = await response.json()
      
      // Handle rate limit response headers
      if (data.rateLimitInfo) {
        setRateLimitInfo(data.rateLimitInfo)
      }
      
      // Handle error responses
      if (!response.ok) {
        if (response.status === 429) {
          const rateLimitMessage = errorMessages[currentLocale]?.rateLimit || errorMessages[defaultLocale].rateLimit
          setError(`${rateLimitMessage} ${Math.ceil((data.rateLimitInfo?.reset || 60) / 1000)} ${currentLocale === 'en' ? 'seconds' : currentLocale === 'es' ? 'segundos' : currentLocale === 'fr' ? 'secondes' : 'segundos'}.`)
        } else {
          setError(data.error || (errorMessages[currentLocale]?.generic || errorMessages[defaultLocale].generic))
        }
      } else {
        // Add AI response to messages
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      }
    } catch (error) {
      console.error("Error generating response:", error)
      setError(errorMessages[currentLocale]?.connectionFailed || errorMessages[defaultLocale].connectionFailed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title={headerTitle[currentLocale] || headerTitle[defaultLocale]}
        showBack={true}
        backUrl={`/${currentLocale}`}
      />

      {/* Conversation area - takes remaining space between header and input area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0 pb-2">
        <div className="space-y-2 sm:space-y-3 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`p-2.5 sm:p-4 max-w-[90%] sm:max-w-[80%] rounded-2xl ${
                message.role === "user" ? "ml-auto bg-[#FF69B4] text-white shadow-lg" : "mr-auto bg-[#9ACD32] text-white shadow-lg"
              }`}
            >
              <div className="text-sm sm:text-base leading-relaxed break-words">
                {message.content}
              </div>
            </Card>
          ))}
          {isLoading && (
            <Card className="p-2.5 sm:p-4 max-w-[90%] sm:max-w-[80%] mr-auto bg-[#9ACD32] text-white shadow-lg rounded-2xl">
              <div className="flex space-x-2 items-center">
                <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                <span className="text-sm ml-2 opacity-80">Thinking...</span>
              </div>
            </Card>
          )}
          {error && (
            <Alert variant="destructive" className="mt-3 mx-1 sm:mx-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* Fixed input area positioned just above bottom navigation */}
      <div className="fixed bottom-16 left-0 right-0 p-3 sm:p-4 border-t bg-white/95 backdrop-blur-sm">
        {rateLimitInfo && rateLimitInfo.remaining < rateLimitInfo.limit && (
          <div className="text-xs text-gray-500 mb-2 px-1">
            {rateLimitInfo.remaining} {currentLocale === 'en' ? 'requests remaining' : currentLocale === 'es' ? 'solicitudes restantes' : currentLocale === 'fr' ? 'requêtes restantes' : 'solicitações restantes'} ({currentLocale === 'en' ? 'resets in' : currentLocale === 'es' ? 'se reinicia en' : currentLocale === 'fr' ? 'réinitialise dans' : 'redefine em'} {Math.ceil((rateLimitInfo.reset || 60) / 1000)} {currentLocale === 'en' ? 'seconds' : currentLocale === 'es' ? 'segundos' : currentLocale === 'fr' ? 'secondes' : 'segundos'})
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText[currentLocale] || placeholderText[defaultLocale]}
            className="flex-1 text-sm sm:text-base min-h-[44px]"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="bg-[#FF69B4] hover:bg-[#FF1493] min-w-[44px] min-h-[44px]" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center p-8">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>
    </div>
  )
}

export default function AIAgent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AIAgentContent />
    </Suspense>
  )
} 