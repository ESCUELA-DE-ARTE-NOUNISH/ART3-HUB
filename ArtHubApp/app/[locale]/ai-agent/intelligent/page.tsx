"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, AlertCircle, Lightbulb, Briefcase, Palette, Video, ArrowRight, X, MessageCircle, Brain, Sparkles, Clock, User, RotateCcw, Zap } from "lucide-react"
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
  recommendations: ('tutorial' | 'opportunities' | 'create')[]
}

type UserProfile = {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  totalSessions: number
  successfulOutcomes: number
  preferredPath?: string
  lastInteraction?: string
}

type ConversationInsights = {
  topicsMentioned: string[]
  sentimentScore: number
  engagementLevel: 'low' | 'medium' | 'high'
  suggestedFollowUps: string[]
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
  walletRequired: string,
  retryPrompt: string,
  networkError: string,
  timeout: string
}> = {
  en: {
    rateLimit: "Rate limit exceeded. Please try again in",
    connectionFailed: "Failed to connect to the AI service. Please try again later.",
    generic: "Something went wrong. Please try again.",
    walletRequired: "Please connect your wallet to use the intelligent assistant.",
    retryPrompt: "Click here to retry your last message",
    networkError: "Network connection issue. Check your internet and try again.",
    timeout: "Request timed out. The AI service might be busy."
  },
  es: {
    rateLimit: "Límite de consultas excedido. Por favor, inténtelo de nuevo en",
    connectionFailed: "No se pudo conectar al servicio de IA. Por favor, inténtelo más tarde.",
    generic: "Algo salió mal. Por favor, inténtelo de nuevo.",
    walletRequired: "Por favor conecta tu billetera para usar el asistente inteligente.",
    retryPrompt: "Haz clic aquí para reintentar tu último mensaje",
    networkError: "Problema de conexión de red. Verifica tu internet e inténtalo de nuevo.",
    timeout: "Tiempo de espera agotado. El servicio de IA podría estar ocupado."
  },
  fr: {
    rateLimit: "Limite de requêtes dépassée. Veuillez réessayer dans",
    connectionFailed: "Échec de la connexion au service IA. Veuillez réessayer plus tard.",
    generic: "Quelque chose s'est mal passé. Veuillez réessayer.",
    walletRequired: "Veuillez connecter votre portefeuille pour utiliser l'assistant intelligent.",
    retryPrompt: "Cliquez ici pour réessayer votre dernier message",
    networkError: "Problème de connexion réseau. Vérifiez votre internet et réessayez.",
    timeout: "Délai d'attente dépassé. Le service IA pourrait être occupé."
  },
  pt: {
    rateLimit: "Limite de consultas excedido. Por favor, tente novamente em",
    connectionFailed: "Falha ao conectar ao serviço de IA. Por favor, tente novamente mais tarde.",
    generic: "Algo deu errado. Por favor, tente novamente.",
    walletRequired: "Por favor conecte sua carteira para usar o assistente inteligente.",
    retryPrompt: "Clique aqui para tentar novamente sua última mensagem",
    networkError: "Problema de conexão de rede. Verifique sua internet e tente novamente.",
    timeout: "Tempo limite esgotado. O serviço de IA pode estar ocupado."
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [conversationInsights, setConversationInsights] = useState<ConversationInsights | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const initializationRef = useRef(false)
  
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

  // Load user profile and handle initial setup
  useEffect(() => {
    const loadUserProfile = async () => {
      if (walletAddress) {
        try {
          const response = await fetch('/api/chat/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
          })
          
          if (response.ok) {
            const profile = await response.json()
            setUserProfile(profile)
            
            // Generate personalized suggestions based on profile
            generateSuggestedQuestions(profile)
          }
        } catch (error) {
          console.error('Failed to load user profile:', error)
        }
      }
    }
    
    loadUserProfile()
  }, [walletAddress])

  // Handle initial query parameter and welcome message
  useEffect(() => {
    const query = searchParams?.get('q')
    
    if (walletAddress && messages.length === 0 && !initializationRef.current) {
      initializationRef.current = true
      setHasInitialized(true)
      
      if (query && query.trim()) {
        // If there's a query, send it directly without any welcome message
        // The API will handle the initial response appropriately
        handleSendMessage(query.trim())
      } else {
        // Show personalized welcome message based on user profile
        const personalizedWelcome = getPersonalizedWelcome()
        setMessages([{
          role: "assistant",
          content: personalizedWelcome
        }])
      }
    }
  }, [searchParams, walletAddress, messages.length])

  const generateSuggestedQuestions = (profile: UserProfile) => {
    const suggestions = []
    
    if (profile.totalSessions === 0) {
      suggestions.push(...[
        locale === 'es' ? "¿Cómo empiezo con NFTs?" : "How do I get started with NFTs?",
        locale === 'es' ? "¿Qué herramientas necesito?" : "What tools do I need?",
        locale === 'es' ? "¿Es gratis crear arte aquí?" : "Is it free to create art here?"
      ])
    } else {
      suggestions.push(...[
        locale === 'es' ? "¿Cómo mejoro mi arte?" : "How can I improve my art?",
        locale === 'es' ? "¿Dónde vendo mis NFTs?" : "Where can I sell my NFTs?",
        locale === 'es' ? "¿Hay colaboraciones disponibles?" : "Are there collaborations available?"
      ])
    }
    
    setSuggestedQuestions(suggestions.slice(0, 3))
  }
  
  const getPersonalizedWelcome = () => {
    if (!userProfile) {
      return welcomeMessages[locale] || welcomeMessages.en
    }
    
    const welcomeVariations = {
      en: {
        returning: `Welcome back! 🎨 I see you've had ${userProfile.totalSessions} sessions with me. What's on your mind today?`,
        new: "Hi! 🎨 I'm here to help with your art journey. What brings you here today?"
      },
      es: {
        returning: `¡Bienvenido de vuelta! 🎨 Veo que has tenido ${userProfile.totalSessions} sesiones conmigo. ¿Qué tienes en mente hoy?`,
        new: "¡Hola! 🎨 Estoy aquí para ayudar con tu viaje artístico. ¿Qué te trae aquí hoy?"
      },
      fr: {
        returning: `Bienvenue ! 🎨 Je vois que vous avez eu ${userProfile.totalSessions} sessions avec moi. À quoi pensez-vous aujourd'hui ?`,
        new: "Salut ! 🎨 Je suis là pour aider avec votre parcours artistique. Qu'est-ce qui vous amène ici aujourd'hui ?"
      },
      pt: {
        returning: `Bem-vindo de volta! 🎨 Vejo que você teve ${userProfile.totalSessions} sessões comigo. O que você tem em mente hoje?`,
        new: "Oi! 🎨 Estou aqui para ajudar com sua jornada artística. O que te traz aqui hoje?"
      }
    }
    
    const msgs = welcomeVariations[locale as keyof typeof welcomeVariations] || welcomeVariations.en
    return userProfile.totalSessions > 0 ? msgs.returning : msgs.new
  }

  const analyzeConversationInsights = (messages: Message[]) => {
    const userMessages = messages.filter(msg => msg.role === 'user')
    const topics = ['art', 'nft', 'create', 'learn', 'sell', 'collaborate', 'tutorial']
    const topicsMentioned = topics.filter(topic => 
      userMessages.some(msg => msg.content.toLowerCase().includes(topic))
    )
    
    const engagementLevel = userMessages.length > 3 ? 'high' : userMessages.length > 1 ? 'medium' : 'low'
    
    setConversationInsights({
      topicsMentioned,
      sentimentScore: 0.7, // Simplified - could use sentiment analysis API
      engagementLevel,
      suggestedFollowUps: generateFollowUpSuggestions(topicsMentioned)
    })
  }
  
  const generateFollowUpSuggestions = (topics: string[]): string[] => {
    const suggestions: Record<string, Record<string, string[]>> = {
      en: {
        art: ["What art style interests you most?", "Do you prefer digital or traditional art?"],
        nft: ["Have you minted an NFT before?", "What blockchain do you prefer?"],
        create: ["What's your creative process like?", "Do you need help with tools?"],
        learn: ["What would you like to learn first?", "Do you prefer video or text tutorials?"]
      },
      es: {
        art: ["¿Qué estilo de arte te interesa más?", "¿Prefieres arte digital o tradicional?"],
        nft: ["¿Has creado un NFT antes?", "¿Qué blockchain prefieres?"],
        create: ["¿Cómo es tu proceso creativo?", "¿Necesitas ayuda con herramientas?"],
        learn: ["¿Qué te gustaría aprender primero?", "¿Prefieres tutoriales en video o texto?"]
      }
    }
    
    const langSuggestions = suggestions[locale as keyof typeof suggestions] || suggestions.en
    const relevantSuggestions: string[] = []
    
    topics.forEach(topic => {
      if (langSuggestions[topic as keyof typeof langSuggestions]) {
        const topicSuggestions = langSuggestions[topic]
        if (topicSuggestions) relevantSuggestions.push(...topicSuggestions)
      }
    })
    
    return relevantSuggestions.slice(0, 2)
  }
  
  const resetConversation = async () => {
    try {
      // Clear local state
      setMessages([])
      setError(null)
      setConversationStage('initial')
      setAgentResponses(0)
      setOutcomeRecommendation(null)
      setConversationInsights(null)
      setLastFailedMessage(null)
      setRetryCount(0)
      setShowResetConfirm(false)
      setHasInitialized(false)
      initializationRef.current = false
      
      // Show fresh welcome message
      const personalizedWelcome = getPersonalizedWelcome()
      setMessages([{
        role: "assistant",
        content: personalizedWelcome
      }])
      
      // Generate new suggestions
      if (userProfile) {
        generateSuggestedQuestions(userProfile)
      }
    } catch (error) {
      console.error('Error resetting conversation:', error)
    }
  }

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
    setIsTyping(true)

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

      // Add assistant response with typing effect
      const assistantMessage: Message = { role: "assistant", content: data.response }
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages(prev => {
          const newMessages = [...prev, assistantMessage]
          // Analyze conversation for insights
          analyzeConversationInsights(newMessages)
          return newMessages
        })
        setIsTyping(false)
      }, 500)

    } catch (error) {
      console.error("Error sending message:", error)
      setLastFailedMessage(textToSend)
      setRetryCount(prev => prev + 1)
      
      // Determine error type
      let errorMessage = errorMessages[locale]?.generic || errorMessages.en.generic
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = errorMessages[locale]?.networkError || errorMessages.en.networkError
      } else if (error instanceof Error && error.message.includes('timeout')) {
        errorMessage = errorMessages[locale]?.timeout || errorMessages.en.timeout
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      setIsTyping(false)
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

  // Dynamic progress calculation based on current assessment stage
  const progressPercentage = conversationStage === 'initial' ? 0 : 
                           conversationStage === 'assessing' ? Math.min((agentResponses / 10) * 90, 90) : 
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
            
            {/* Enhanced Progress Indicator */}
            {walletAddress && conversationStage !== 'initial' && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Assessment Progress
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                {conversationStage === 'assessing' && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <MessageCircle className="h-3 w-3 text-purple-500" />
                    <p className="text-xs text-gray-500">
                      {agentResponses} interactions • Getting to know you better
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* User Profile Summary */}
            {userProfile && userProfile.totalSessions > 0 && (
              <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User className="h-3 w-3" />
                  <span>{userProfile.totalSessions} sessions</span>
                  {userProfile.preferredPath && (
                    <>
                      <span className="text-purple-400">•</span>
                      <span>Prefers {userProfile.preferredPath}</span>
                    </>
                  )}
                  {userProfile.lastInteraction && (
                    <>
                      <span className="text-purple-400">•</span>
                      <Clock className="h-3 w-3" />
                      <span>Last: {new Date(userProfile.lastInteraction).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            )}

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

            {/* Enhanced Error Alert */}
            {error && (
              <Alert className="mt-3 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700 text-sm">
                  <div className="flex flex-col gap-2">
                    <span>{error}</span>
                    {rateLimitInfo && rateLimitInfo.reset && (
                      <span className="text-xs opacity-80">
                        Try again in {formatTimeRemaining(rateLimitInfo.reset)}
                      </span>
                    )}
                    {lastFailedMessage && !rateLimitInfo && (
                      <button
                        onClick={() => {
                          setError(null)
                          setLastFailedMessage(null)
                          handleSendMessage(lastFailedMessage)
                        }}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors w-fit"
                      >
                        🔄 {errorMessages[locale]?.retryPrompt || errorMessages.en.retryPrompt}
                      </button>
                    )}
                    {retryCount > 2 && (
                      <div className="text-xs bg-yellow-100 text-yellow-800 p-2 rounded border border-yellow-200">
                        <p className="font-medium mb-1">💡 Having trouble? Try:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Check your internet connection</li>
                          <li>Refresh the page</li>
                          <li>Try a shorter message</li>
                          <li>Wait a few minutes and try again</li>
                        </ul>
                      </div>
                    )}
                  </div>
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
                
                {/* Show dynamic action buttons based on recommendations OR after 5+ messages */}
                {message.role === "assistant" && 
                 index === messages.length - 1 && 
                 (
                   (outcomeRecommendation && outcomeRecommendation.recommendations) || 
                   (messages.filter(msg => msg.role === 'assistant').length >= 5)
                 ) && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-lg lg:max-w-xl">
                      <p className="text-base text-gray-600 mb-4">
                        {(outcomeRecommendation?.recommendations?.length === 1)
                          ? "Here's what I recommend:" 
                          : "Choose what you want to do:"
                        }
                      </p>
                      <div className="space-y-3">
                        {(!outcomeRecommendation?.recommendations || outcomeRecommendation.recommendations.includes('tutorial')) && (
                          <Button 
                            onClick={() => setShowVideoModal(true)}
                            className={`w-full text-white text-base py-3 px-4 rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all ${
                              outcomeRecommendation?.type === 'tutorial' 
                                ? 'bg-blue-600 hover:bg-blue-700 ring-2 ring-blue-300' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                          >
                            <Video className="h-5 w-5" />
                            {outcomeCards.tutorial[locale]?.title || outcomeCards.tutorial.en.title}
                            {outcomeRecommendation?.type === 'tutorial' && 
                              <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            }
                          </Button>
                        )}
                        {(!outcomeRecommendation?.recommendations || outcomeRecommendation.recommendations.includes('opportunities')) && (
                          <Button 
                            onClick={() => router.push(`/${locale}/opportunities`)}
                            className={`w-full text-white text-base py-3 px-4 rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all ${
                              outcomeRecommendation?.type === 'opportunities' 
                                ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-300' 
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            <Briefcase className="h-5 w-5" />
                            {outcomeCards.opportunities[locale]?.title || outcomeCards.opportunities.en.title}
                            {outcomeRecommendation?.type === 'opportunities' && 
                              <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            }
                          </Button>
                        )}
                        {(!outcomeRecommendation?.recommendations || outcomeRecommendation.recommendations.includes('create')) && (
                          <Button 
                            onClick={() => router.push(`/${locale}/create`)}
                            className={`w-full text-white text-base py-3 px-4 rounded-lg flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all ${
                              outcomeRecommendation?.type === 'create' 
                                ? 'bg-purple-600 hover:bg-purple-700 ring-2 ring-purple-300' 
                                : 'bg-purple-500 hover:bg-purple-600'
                            }`}
                          >
                            <Palette className="h-5 w-5" />
                            {outcomeCards.create[locale]?.title || outcomeCards.create.en.title}
                            {outcomeRecommendation?.type === 'create' && 
                              <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            }
                          </Button>
                        )}
                      </div>
                      {outcomeRecommendation?.confidence && (
                        <div className="mt-3 text-xs text-gray-500 text-center">
                          Recommendation confidence: {Math.round(outcomeRecommendation.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {(isLoading || isTyping) && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-800 shadow-sm max-w-xs lg:max-w-md px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500 animate-pulse" />
                      <span className="text-sm text-gray-600">
                        {isTyping ? "Analyzing..." : "Thinking..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Suggested Questions */}
            {!isLoading && messages.length <= 2 && suggestedQuestions.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {locale === 'es' ? 'Preguntas sugeridas:' : 'Suggested questions:'}
                  </span>
                </div>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      className="w-full text-left p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-lg text-sm text-gray-700 transition-all duration-200 hover:shadow-md"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Conversation Insights */}
            {conversationInsights && conversationInsights.topicsMentioned.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">
                    {locale === 'es' ? 'Temas mencionados:' : 'Topics mentioned:'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {conversationInsights.topicsMentioned.map((topic, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      #{topic}
                    </span>
                  ))}
                </div>
                {conversationInsights.suggestedFollowUps.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {conversationInsights.suggestedFollowUps.map((followUp, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(followUp)}
                        className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        💡 {followUp}
                      </button>
                    ))}
                  </div>
                )}
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