"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Header from "@/components/header"
import { Send } from "lucide-react"
import { Card } from "@/components/ui/card"

type Message = {
  role: "user" | "assistant"
  content: string
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // This is a simulation of AI response - in a real app, you would use the AI SDK
      // const { text } = await generateText({
      //   model: openai("gpt-4o"),
      //   prompt: input,
      //   system: "You are a helpful Web3 education assistant for artists. Provide clear, simple explanations about NFTs, wallets, and blockchain technology."
      // });

      // Simulated response for demo purposes
      const responses = [
        "NFTs (Non-Fungible Tokens) are unique digital assets that represent ownership of a specific item or piece of content on the blockchain. Unlike cryptocurrencies such as Bitcoin, each NFT has a distinct value and cannot be exchanged on a like-for-like basis.",
        "A crypto wallet is a digital tool that allows you to store and manage your cryptocurrencies and NFTs. Think of it like a digital bank account for your blockchain assets. For artists, this is where your minted NFTs and any earnings from sales will be stored.",
        "Minting an NFT means creating a new token on the blockchain that represents your artwork. When you mint an NFT, you're essentially publishing your work on the blockchain, making it verifiably unique and owned.",
        "Royalties in the NFT space allow artists to earn a percentage of all future sales of their work. This is one of the most revolutionary aspects for artists - you can continue earning from your art even after the initial sale!",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: randomResponse }])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error generating response:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
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
        </div>
      </div>

      <div className="p-4 border-t bg-white">
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
