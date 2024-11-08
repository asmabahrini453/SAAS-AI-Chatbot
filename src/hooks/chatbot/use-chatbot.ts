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
  //state that holds the current chatbot details
  const [currentBot, setCurrentBot] = useState<
    | {
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
      }
    | undefined
  >()

  // Reference for the chat message window for smooth scrolling
  const messageWindowRef = useRef<HTMLDivElement | null>(null)

   // State to manage chatbot visibility
    //open chatbot
  const [botOpened, setBotOpened] = useState<boolean>(false)
    //toggle to close it
  const onOpenChatBot = () => setBotOpened((prev) => !prev)

// State to track loading and the list of chat messages
  const [loading, setLoading] = useState<boolean>(true)
  //store the role & link
  const [onChats, setOnChats] = useState<
    { role: 'assistant' | 'user'; content: string; link?: string }[]
  >([])

//state to keep track if AI is typing
  const [onAiTyping, setOnAiTyping] = useState<boolean>(false)

  //state to store the bot id
  const [currentBotId, setCurrentBotId] = useState<string>()
//state to store real-time chat settings
  const [onRealTime, setOnRealTime] = useState<
    { chatroom: string; mode: boolean } | undefined
  >(undefined)

// Func to scroll the chat window to the bottom when new msgs arrive
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
  }, [onChats, messageWindowRef])


    // Adjust iframe size based on chatbot visibility
  useEffect(() => {
    //send the msg to the parent iframe
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
    //when a msg is sent from a
    // parent window(iframe)that contains the bot id,
     // the msg event is triggered so we listen for it
    window.addEventListener('message', (e) => { 
      console.log(e.data)
      //the event listener retrieves the data sent by the msg event which is the chatbot id and we assign it to botid
      const botid = e.data
      if (limitRequest < 1 && typeof botid == 'string') {
        // fetching the chatbot data based on the domain id only once per session when the msg is received
        onGetDomainChatBot(botid)
        limitRequest++
      }
    })
  }, [])

  // func to get chatbot details by  domain id and initialize chat messages
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
  
  // Handler for form submission to send msgs or images
  const onStartChatting = handleSubmit(async (values) => {
    // If an image is provided, upload it and send the uploaded URL as a msg
    if (values.image.length) {
      console.log('IMAGE fROM ', values.image[0])
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
        uploaded.uuid
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

 
}