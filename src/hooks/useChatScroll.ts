"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
}

interface UseChatScrollProps {
  messages: Message[]
  currentUserId?: string
}

export function useChatScroll({ messages, currentUserId }: UseChatScrollProps) {
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [isUserAtBottom, setIsUserAtBottom] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousMessageCount = useRef(0)

  // Scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
        inline: "nearest",
      })
    }
  }, [])

  // Check if user is at bottom
  const checkIfAtBottom = useCallback(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return true

    const { scrollTop, scrollHeight, clientHeight } = chatContainer
    return scrollTop + clientHeight >= scrollHeight - 20 // 20px threshold
  }, [])

  // Handle scroll events
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    const handleScroll = () => {
      const isAtBottom = checkIfAtBottom()
      setIsUserAtBottom(isAtBottom)

      if (isAtBottom) {
        setHasNewMessage(false)
      }
    }

    chatContainer.addEventListener("scroll", handleScroll)
    return () => chatContainer.removeEventListener("scroll", handleScroll)
  }, [checkIfAtBottom])

  // Handle new messages
  useEffect(() => {
    const currentMessageCount = messages.length

    if (currentMessageCount > previousMessageCount.current && currentMessageCount > 0) {
      const lastMessage = messages[currentMessageCount - 1]
      const isOwnMessage = lastMessage.userId === currentUserId
      const wasAtBottom = isUserAtBottom

      if (isOwnMessage || wasAtBottom) {
        // Auto scroll for own messages or if user was at bottom
        setTimeout(() => scrollToBottom(), 100)
      } else {
        // Show new message indicator for others' messages when not at bottom
        setHasNewMessage(true)
      }
    }

    previousMessageCount.current = currentMessageCount
  }, [messages, currentUserId, isUserAtBottom, scrollToBottom])

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100)
    }
  }, []) // Only run once on mount

  const handleNewMessageClick = useCallback(() => {
    scrollToBottom()
    setHasNewMessage(false)
  }, [scrollToBottom])

  return {
    chatContainerRef,
    messagesEndRef,
    hasNewMessage,
    isUserAtBottom,
    scrollToBottom,
    handleNewMessageClick,
  }
}
