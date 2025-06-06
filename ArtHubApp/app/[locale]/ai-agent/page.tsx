"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useParams } from "next/navigation"
import { defaultLocale } from "@/config/i18n"

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

export default function AIAgent() {
  const params = useParams()
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
    const storedId = localStorage.getItem('chatUserId')
    if (storedId) {
      setUserId(storedId)
    } else {
      const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem('chatUserId', newId)
      setUserId(newId)
    }
  }, [])
  
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
    <div className="pb-16 flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-center mt-10">{headerTitle[currentLocale] || headerTitle[defaultLocale]}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`p-3 max-w-[85%] ${
                message.role === "user" ? "ml-auto bg-[#FF69B4] text-white" : "mr-auto bg-[#9ACD32] text-white"
              }`}
            >
              {message.content}
            </Card>
          ))}
          {isLoading && (
            <Card className="p-3 max-w-[85%] mr-auto bg-[#9ACD32] text-white">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </Card>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div ref={messagesEndRef}></div>
        </div>
      </div>

      <div className="p-4 border-t bg-white">
        {rateLimitInfo && rateLimitInfo.remaining < rateLimitInfo.limit && (
          <div className="text-xs text-gray-500 mb-2">
            {rateLimitInfo.remaining} {currentLocale === 'en' ? 'requests remaining' : currentLocale === 'es' ? 'solicitudes restantes' : currentLocale === 'fr' ? 'requêtes restantes' : 'solicitações restantes'} ({currentLocale === 'en' ? 'resets in' : currentLocale === 'es' ? 'se reinicia en' : currentLocale === 'fr' ? 'réinitialise dans' : 'redefine em'} {Math.ceil((rateLimitInfo.reset || 60) / 1000)} {currentLocale === 'en' ? 'seconds' : currentLocale === 'es' ? 'segundos' : currentLocale === 'fr' ? 'secondes' : 'segundos'})
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText[currentLocale] || placeholderText[defaultLocale]}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="bg-[#9ACD32] hover:bg-[#7CFC00]" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
} 