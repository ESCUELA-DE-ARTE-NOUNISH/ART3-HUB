"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Header from "@/components/header"
import { Send, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Message = {
  role: "user" | "assistant"
  content: string
}

type RateLimitInfo = {
  remaining: number
  limit: number
  reset: number
}

export default function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Web3 guide. Ask me anything about NFTs, wallets, or blockchain technology.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  
  // Generate a temporary userId for the session if not already in localStorage
  const [userId] = useState(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('chatUserId')
      if (storedId) return storedId
      const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem('chatUserId', newId)
      return newId
    }
    return `user-${Date.now()}`
  })
  
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
          setError(`Rate limit exceeded. Please try again in ${Math.ceil((data.rateLimitInfo?.reset || 60) / 1000)} seconds.`)
        } else {
          setError(data.error || 'Something went wrong. Please try again.')
        }
      } else {
        // Add AI response to messages
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      }
    } catch (error) {
      console.error("Error generating response:", error)
      setError("Failed to connect to the AI service. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pb-16 flex flex-col h-screen">
      <Header title="AI Education Agent" />

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
            {rateLimitInfo.remaining} requests remaining (resets in {Math.ceil((rateLimitInfo.reset || 60) / 1000)} seconds)
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about NFTs..."
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
