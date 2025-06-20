"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, AlertCircle, Lightbulb, Briefcase, Palette, Video, ArrowRight, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { defaultLocale } from "@/config/i18n"
import { useSafePrivy } from "@/hooks/useSafePrivy"

type Message = {
  role: "user" | "assistant"
  content: string
}

type RateLimitInfo = {
  remaining: number
  limit: number
  reset: number
}

type OutcomeRecommendation = {
  type: 'tutorial' | 'opportunities' | 'create'
  confidence: number
  redirectUrl?: string
  message: string
}

// Super simple welcome messages
const welcomeMessages: Record<string, string> = {
  en: "Hi! 🎨 I'm here to help with your art. What's up?",
  es: "¡Hola! 🎨 Estoy aquí para ayudar con tu arte. ¿Qué tal?",
  fr: "Salut ! 🎨 Je suis là pour aider avec votre art. Quoi de neuf ?",
  pt: "Oi! 🎨 Estou aqui para ajudar com sua arte. E aí?"
}

// Simple stage descriptions
const stageDescriptions: Record<string, Record<string, string>> = {
  initial: {
    en: "Let's chat! 😊",
    es: "¡Hablemos! 😊",
    fr: "Parlons ! 😊",
    pt: "Vamos conversar! 😊"
  },
  assessing: {
    en: "Getting to know you... 💭",
    es: "Conociéndote... 💭",
    fr: "Je vous découvre... 💭",
    pt: "Te conhecendo... 💭"
  },
  recommending: {
    en: "Ready! Choose below 👇",
    es: "¡Listo! Elige abajo 👇",
    fr: "Prêt ! Choisissez ci-dessous 👇",
    pt: "Pronto! Escolha abaixo 👇"
  }
}

// Outcome cards content
const outcomeCards: Record<string, Record<string, { title: string, description: string, icon: React.ReactNode }>> = {
  tutorial: {
    en: { 
      title: "Start Learning", 
      description: "Watch our step-by-step tutorial video to get started with Art3 Hub",
      icon: <Video className="h-6 w-6" />
    },
    es: { 
      title: "Empezar a Aprender", 
      description: "Mira nuestro video tutorial paso a paso para comenzar con Art3 Hub",
      icon: <Video className="h-6 w-6" />
    },
    fr: { 
      title: "Commencer à Apprendre", 
      description: "Regardez notre vidéo tutoriel étape par étape pour commencer avec Art3 Hub",
      icon: <Video className="h-6 w-6" />
    },
    pt: { 
      title: "Começar a Aprender", 
      description: "Assista ao nosso vídeo tutorial passo a passo para começar com o Art3 Hub",
      icon: <Video className="h-6 w-6" />
    }
  },
  opportunities: {
    en: { 
      title: "Explore Opportunities", 
      description: "Discover art projects, collaborations, and ways to earn with your creativity",
      icon: <Briefcase className="h-6 w-6" />
    },
    es: { 
      title: "Explorar Oportunidades", 
      description: "Descubre proyectos de arte, colaboraciones y formas de ganar con tu creatividad",
      icon: <Briefcase className="h-6 w-6" />
    },
    fr: { 
      title: "Explorer les Opportunités", 
      description: "Découvrez des projets artistiques, des collaborations et des moyens de gagner avec votre créativité",
      icon: <Briefcase className="h-6 w-6" />
    },
    pt: { 
      title: "Explorar Oportunidades", 
      description: "Descubra projetos de arte, colaborações e maneiras de ganhar com sua criatividade",
      icon: <Briefcase className="h-6 w-6" />
    }
  },
  create: {
    en: { 
      title: "Create Your NFT", 
      description: "You're ready! Start creating and minting your first NFT right now",
      icon: <Palette className="h-6 w-6" />
    },
    es: { 
      title: "Crear tu NFT", 
      description: "¡Estás listo! Comienza a crear y acuñar tu primer NFT ahora mismo",
      icon: <Palette className="h-6 w-6" />
    },
    fr: { 
      title: "Créer votre NFT", 
      description: "Vous êtes prêt ! Commencez à créer et minter votre premier NFT maintenant",
      icon: <Palette className="h-6 w-6" />
    },
    pt: { 
      title: "Criar seu NFT", 
      description: "Você está pronto! Comece a criar e cunhar seu primeiro NFT agora",
      icon: <Palette className="h-6 w-6" />
    }
  }
}

// Error messages in different languages
const errorMessages: Record<string, {
  rateLimit: string,
  connectionFailed: string,
  generic: string,
  walletRequired: string
}> = {
  en: {
    rateLimit: "Rate limit exceeded. Please try again in",
    connectionFailed: "Failed to connect to the AI service. Please try again later.",
    generic: "Something went wrong. Please try again.",
    walletRequired: "Please connect your wallet to use the intelligent assistant."
  },
  es: {
    rateLimit: "Límite de consultas excedido. Por favor, inténtelo de nuevo en",
    connectionFailed: "No se pudo conectar al servicio de IA. Por favor, inténtelo más tarde.",
    generic: "Algo salió mal. Por favor, inténtelo de nuevo.",
    walletRequired: "Por favor conecta tu billetera para usar el asistente inteligente."
  },
  fr: {
    rateLimit: "Limite de requêtes dépassée. Veuillez réessayer dans",
    connectionFailed: "Échec de la connexion au service IA. Veuillez réessayer plus tard.",
    generic: "Quelque chose s'est mal passé. Veuillez réessayer.",
    walletRequired: "Veuillez connecter votre portefeuille pour utiliser l'assistant intelligent."
  },
  pt: {
    rateLimit: "Limite de consultas excedido. Por favor, tente novamente em",
    connectionFailed: "Falha ao conectar ao serviço de IA. Por favor, tente novamente mais tarde.",
    generic: "Algo deu errado. Por favor, tente novamente.",
    walletRequired: "Por favor conecte sua carteira para usar o assistente inteligente."
  }
}

// Placeholder messages
const placeholderMessages: Record<string, string> = {
  en: "Ask me about your art journey...",
  es: "Pregúntame sobre tu viaje artístico...",
  fr: "Demandez-moi à propos de votre parcours artistique...",
  pt: "Pergunte-me sobre sua jornada artística..."
}

function IntelligentAIAgentContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = (params?.locale as string) || defaultLocale
  const { authenticated, user } = useSafePrivy()
  const walletAddress = user?.wallet?.address

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const [conversationStage, setConversationStage] = useState<string>('initial')
  const [agentResponses, setAgentResponses] = useState(0)
  const [outcomeRecommendation, setOutcomeRecommendation] = useState<OutcomeRecommendation | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle initial query parameter and welcome message
  useEffect(() => {
    const query = searchParams?.get('q')
    
    if (walletAddress && messages.length === 0) {
      if (query && query.trim()) {
        // If there's a query, send it directly without welcome message
        handleSendMessage(query.trim())
      } else {
        // Only show welcome message if no query
        setMessages([{
          role: "assistant",
          content: welcomeMessages[locale] || welcomeMessages.en
        }])
      }
    }
  }, [searchParams, walletAddress, locale])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend || isLoading) return

    if (!walletAddress) {
      setError(errorMessages[locale]?.walletRequired || errorMessages.en.walletRequired)
      return
    }

    setInputMessage("")
    setError(null)
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage: Message = { role: "user", content: textToSend }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch("/api/chat/intelligent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          walletAddress,
          locale
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          const resetTime = new Date(data.rateLimitInfo?.reset * 1000)
          const timeUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 1000)
          setError(`${errorMessages[locale]?.rateLimit || errorMessages.en.rateLimit} ${timeUntilReset} seconds`)
          setRateLimitInfo(data.rateLimitInfo)
        } else {
          setError(data.error || errorMessages[locale]?.connectionFailed || errorMessages.en.connectionFailed)
        }
        return
      }

      // Update state with response data
      setConversationStage(data.conversationStage)
      setAgentResponses(data.questionsAsked) // API still uses questionsAsked name but now contains agent response count
      setOutcomeRecommendation(data.outcomeRecommendation)
      setRateLimitInfo(data.rateLimitInfo)

      // Add assistant response
      const assistantMessage: Message = { role: "assistant", content: data.response }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error("Error sending message:", error)
      setError(errorMessages[locale]?.generic || errorMessages.en.generic)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }


  const formatTimeRemaining = (resetTimestamp: number) => {
    const resetTime = new Date(resetTimestamp * 1000)
    const timeUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / 1000)
    
    if (timeUntilReset <= 0) return "now"
    
    const minutes = Math.floor(timeUntilReset / 60)
    const seconds = timeUntilReset % 60
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  // Determine current stage based on message count
  const assistantMessageCount = messages.filter(msg => msg.role === 'assistant').length
  const userMessageCount = messages.filter(msg => msg.role === 'user').length
  
  const currentStage = assistantMessageCount >= 4 ? 'recommending' : 
                      userMessageCount > 0 ? 'assessing' : 'initial'
  
  const currentStageDescription = stageDescriptions[currentStage]?.[locale] || 
                                 stageDescriptions[currentStage]?.en || ""

  const progressPercentage = conversationStage === 'initial' ? 0 : 
                           conversationStage === 'assessing' ? Math.min((agentResponses / 5) * 80, 80) : 
                           100

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 overflow-hidden">
      <div className="absolute inset-x-0 top-12 bottom-20 px-4 py-4 flex flex-col">
        {/* Chat Interface - Fixed Height, No Page Scroll */}
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm shadow-xl rounded-xl border-0 min-h-0">
          {/* Chat Header - Fixed at Top */}
          <div className="p-4 border-b border-gray-100 bg-white/70 backdrop-blur-sm rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎨 Art Chat
              </h1>
              {walletAddress && (
                <span className="text-sm text-gray-600">{currentStageDescription}</span>
              )}
            </div>
            
            {/* Progress Indicator */}
            {/* {walletAddress && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {conversationStage === 'assessing' && (
                  <p className="text-xs text-gray-500 text-center">
                    Chat {agentResponses} of 5
                  </p>
                )}
              </div>
            )} */}

            {/* Wallet Connection Requirement */}
            {!walletAddress && (
              <div className="mt-3 p-3 text-center border border-purple-300 rounded-lg bg-purple-50">
                <Lightbulb className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                <h3 className="text-sm font-semibold mb-1">Connect Your Wallet</h3>
                <p className="text-gray-600 text-xs">
                  {errorMessages[locale]?.walletRequired || errorMessages.en.walletRequired}
                </p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert className="mt-3 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 text-sm">
                  {error}
                  {rateLimitInfo && rateLimitInfo.reset && (
                    <span className="block mt-1 text-xs">
                      Try again in {formatTimeRemaining(rateLimitInfo.reset)}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Chat Messages - Only This Scrolls */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 backdrop-blur-sm min-h-0">
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
                >
                  <div
                    className={`max-w-lg lg:max-w-xl px-5 py-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                    }`}
                  >
                    <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
                
                {/* Show action buttons only after exactly 5 assistant messages */}
                {message.role === "assistant" && 
                 messages.filter(msg => msg.role === 'assistant').length >= 4 && 
                 index === messages.length - 1 && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-lg lg:max-w-xl">
                      <p className="text-base text-gray-600 mb-4">Choose what you want to do:</p>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setShowVideoModal(true)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-base py-3 px-4 rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all"
                        >
                          <Video className="h-5 w-5" />
                          Watch Tutorial Video
                        </Button>
                        <Button 
                          onClick={() => router.push(`/${locale}/opportunities`)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white text-base py-3 px-4 rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all"
                        >
                          <Briefcase className="h-5 w-5" />
                          Find Opportunities
                        </Button>
                        <Button 
                          onClick={() => router.push(`/${locale}/create`)}
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white text-base py-3 px-4 rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all"
                        >
                          <Palette className="h-5 w-5" />
                          Create Art Now
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-800 shadow-sm max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Fixed at Bottom */}
          <div className="p-4 border-t border-gray-100 bg-white/70 backdrop-blur-sm rounded-b-xl flex-shrink-0">
            <div className="flex space-x-3">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholderMessages[locale] || placeholderMessages.en}
                disabled={isLoading || !walletAddress}
                className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500 py-3 text-base"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim() || !walletAddress}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Rate Limit Info */}
            {rateLimitInfo && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                {rateLimitInfo.remaining} of {rateLimitInfo.limit} requests remaining
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Tutorial Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              Art3 Hub Tutorial
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowVideoModal(false)}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            <video 
              controls 
              className="w-full h-full rounded-lg"
              src="/tutorials/art3hub-connect.mp4"
              poster="/images/video-thumbnail.png"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function IntelligentAIAgentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Intelligent Assistant...</p>
        </div>
      </div>
    }>
      <IntelligentAIAgentContent />
    </Suspense>
  )
}