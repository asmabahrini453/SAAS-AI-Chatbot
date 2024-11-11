import { postToParent, pusherClient } from '@/lib/utils'
import {
  ChatBotMessageProps,
  ChatBotMessageSchema,
} from '@/schemas/conversation.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { UploadClient } from '@uploadcare/upload-client'

import { useForm } from 'react-hook-form'
import { onAiChatBotAssistant, onGetCurrentChatBot } from '@/actions/bot'

// dynamically Initialize the UploadClient for handling file uploads
const upload = new UploadClient({
  publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
})

export const useChatBot = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatBotMessageProps>({
    resolver: zodResolver(ChatBotMessageSchema),
  })
  
  // State that holds the current chatbot details
  const [currentBot, setCurrentBot] = useState<{
    name: string
    chatBot: {
      id: string
      icon: string | null
      welcomeMessage: string | null
      background: string | null
      textColor: string | null
      helpdesk: boolean
    } | null
    helpdesk: {
      id: string
      question: string
      answer: string
      domainId: string | null
    }[]
  } | undefined>()

  // Reference for the chat message window for smooth scrolling
  const messageWindowRef = useRef<HTMLDivElement | null>(null)

  // State to manage chatbot visibility
  const [botOpened, setBotOpened] = useState<boolean>(false)
  const onOpenChatBot = () => setBotOpened((prev) => !prev)

  // State to track loading and the list of chat messages
  const [loading, setLoading] = useState<boolean>(true)
  const [onChats, setOnChats] = useState<
    { role: 'assistant' | 'user'; content: string; link?: string }[]
  >([])

  // State to keep track if AI is typing
  const [onAiTyping, setOnAiTyping] = useState<boolean>(false)

  // State to store the bot id
  const [currentBotId, setCurrentBotId] = useState<string>()

  // State to store real-time chat settings
  const [onRealTime, setOnRealTime] = useState<{
    chatroom: string
    mode: boolean
  } | undefined>(undefined)

  // Function to scroll the chat window to the bottom when new msgs arrive
  const onScrollToBottom = () => {
    messageWindowRef.current?.scroll({
      top: messageWindowRef.current.scrollHeight,
      left: 0,
      behavior: 'smooth',
    })
  }

  // Scroll to bottom whenever new chat msgs are added
  useEffect(() => {
    onScrollToBottom()
  }, [onChats])

  // Adjust iframe size based on chatbot visibility
  useEffect(() => {
    postToParent(
      JSON.stringify({
        width: botOpened ? 550 : 80,
        height: botOpened ? 800 : 80,
      })
    )
  }, [botOpened])

  // To limit fetching the chatbot data once per session
  let limitRequest = 0
  useEffect(() => {
    const onMessageEvent = (e: MessageEvent) => {
      const botid = e.data
      if (limitRequest < 1 && typeof botid === 'string') {
        onGetDomainChatBot(botid)
        limitRequest++
      }
    }

    window.addEventListener('message', onMessageEvent)
    return () => window.removeEventListener('message', onMessageEvent)
  }, [])

  // Function to get chatbot details by domain id and initialize chat messages
  const onGetDomainChatBot = async (id: string) => {
    setCurrentBotId(id)
    const chatbot = await onGetCurrentChatBot(id)
    if (chatbot) {
      setOnChats((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: chatbot.chatBot?.welcomeMessage!,
        },
      ])
      setCurrentBot(chatbot)
      setLoading(false)
    }
  }

  // Handler for form submission to send messages or images
  const onStartChatting = handleSubmit(async (values) => {
    // If an image is provided, upload it and send the uploaded URL as a message
    if (values.image && values.image.length > 0) {
      const uploaded = await upload.uploadFile(values.image[0])
      if (!onRealTime?.mode) {
        setOnChats((prev: any) => [
          ...prev,
          {
            role: 'user',
            content: uploaded.uuid,
          },
        ])
      }
      setOnAiTyping(true)
      const response = await onAiChatBotAssistant(
        currentBotId!,
        onChats,
        'user',
        values.content!
      )
      console.log('Response:', response);
      if (response) {
        setOnAiTyping(false)
        if (response.live) {
          setOnRealTime((prev) => ({
            ...prev,
            chatroom: response.chatRoom,
            mode: response.live,
          }))
        } else {
          setOnChats((prev: any) => [...prev, response.response])
        }
      }
    }

    // Handle text messages
    if (values.content) {
      if (!onRealTime?.mode) {
        setOnChats((prev: any) => [
          ...prev,
          {
            role: 'user',
            content: values.content,
          },
        ])
      }

      setOnAiTyping(true)

      const response = await onAiChatBotAssistant(
        currentBotId!,
        onChats,
        'user',
        values.content
      )

      if (response) {
        setOnAiTyping(false)
        if (response.live) {
          setOnRealTime((prev) => ({
            ...prev,
            chatroom: response.chatRoom,
            mode: response.live,
          }))
        } else {
          setOnChats((prev: any) => [...prev, response.response])
        }
      }
    }
    reset()
  })

  return {
    botOpened,
    onOpenChatBot,
    onStartChatting,
    onChats,
    register,
    onAiTyping,
    messageWindowRef,
    currentBot,
    loading,
    setOnChats,
    onRealTime,
    errors,
  }
}

/////////////////////////////////////////////////////////////////:
export const useRealTime = (
  chatRoom: string,
  setChats: React.Dispatch<
    React.SetStateAction<
      {
        role: 'user' | 'assistant'
        content: string
        link?: string | undefined
      }[]
    >
  >
) => {
  const counterRef = useRef(1)

  useEffect(() => {
    pusherClient.subscribe(chatRoom)
    pusherClient.bind('realtime-mode', (data: any) => {
      console.log('✅', data)
      if (counterRef.current !== 1) {
        setChats((prev: any) => [
          ...prev,
          {
            role: data.chat.role,
            content: data.chat.message,
          },
        ])
      }
      counterRef.current += 1
    })
    return () => {
      pusherClient.unbind('realtime-mode')
      pusherClient.unsubscribe(chatRoom)
    }
  }, [])
}