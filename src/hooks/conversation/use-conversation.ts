
import { onGetChatMessages, onGetDomainChatRooms, onOwnerSendMessage, onRealTimeChat, onViewUnReadMessages } from '@/actions/conversation'
import { useChatContext } from '@/context/user-chat-context'
import { getMonthName, pusherClient } from '@/lib/utils'
import { ChatBotMessageSchema, ConversationSearchSchema } from '@/schemas/conversation.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

  //this hook manages chat-related data
  export const useConversation = () => {
    //form validation of the conversationSearchScheama => to handle the search for conversations
    const { register, watch } = useForm({
      resolver: zodResolver(ConversationSearchSchema),
      mode: 'onChange',
    })
    //retrieve setChats & setChatRooms from the context to update their state
    const { setLoading: loadMessages, setChats, setChatRoom } = useChatContext()
    //state to store chatRooms data : each obj contains a chatroom details & the client email
    const [chatRooms, setChatRooms] = useState<
      {
        chatRoom: {
          id: string
          createdAt: Date
          message: {
            message: string
            createdAt: Date
            seen: boolean
          }[]
        }[]
        email: string | null //email of the client 
      }[]
    >([])

    //setting the loading state of the chat rooms
    const [loading, setLoading] = useState<boolean>(false)
    //useEffect trigger the search func for chat rooms if we change the forms domain
    //it 'watches'  those changes via the 'watch' listener
    useEffect(() => {
       // `watch` listens for changes in form input values (kima change of domain)
      const search = watch(async (value) => {
        setLoading(true) // Set loading state to true during data fetch
        try {
           // Fetch chat rooms for the selected domain
          const rooms = await onGetDomainChatRooms(value.domain)
          if (rooms) {
            setLoading(false)
            // Update chat rooms with the fetched data
            setChatRooms(rooms.customer)
          }
        } catch (error) {
          console.log(error)
        }
      })
        // Cleanup function to unsubscribe from 'watch' listener when component unmounts
      return () => search.unsubscribe()
    }, [watch])
  
     // Function retrieves and displays messages for the specific chat room
    const onGetActiveChatMessages = async (id: string) => {
      try {
        loadMessages(true) // Set loading to true for message fetching
        const messages = await onGetChatMessages(id)
        if (messages) {
          setChatRoom(id) // Update the active chatroom ID
          loadMessages(false)
          setChats(messages[0].message)// Update chats with the fetched messages
        }
      } catch (error) {
        console.log(error)
      }
    }
    // Return all data & funcs that other components will use
    return {
      register,// Allows components to use form registration for input fields
      chatRooms,// List of chat rooms to display in the UI
      loading,
      onGetActiveChatMessages, // Function to fetch active chat messages for a room
    }
  }
  
  export const useChatTime = (createdAt: Date, roomId: string) => {
    const { chatRoom } = useChatContext()
    const [messageSentAt, setMessageSentAt] = useState<string>()
    //urgent: means if someone send a msg and the chatbot can't handle the response so the owner must respond
    //so their msg will be showed in urgent
    const [urgent, setUrgent] = useState<boolean>(false)
  
    const onSetMessageRecievedDate = () => {
      const dt = new Date(createdAt)
      const current = new Date()
      const currentDate = current.getDate()
      const hr = dt.getHours()
      const min = dt.getMinutes()
      const date = dt.getDate()
      const month = dt.getMonth()
      const difference = currentDate - date
  
      if (difference <= 0) {
        setMessageSentAt(`${hr}:${min}${hr > 12 ? 'PM' : 'AM'}`)
        if (current.getHours() - dt.getHours() < 2) {
          setUrgent(true)
        }
      } else {
        setMessageSentAt(`${date} ${getMonthName(month)}`)
      }
    }
  
    const onSeenChat = async () => {
      if (chatRoom == roomId && urgent) {
        await onViewUnReadMessages(roomId)
        setUrgent(false)
      }
    }
  
    useEffect(() => {
      onSeenChat()
    }, [chatRoom])
  
    useEffect(() => {
      onSetMessageRecievedDate()
    }, [])
  
    return { messageSentAt, urgent, onSeenChat }
  }

  
  
  export const useChatWindow = () => {
    const { chats, loading, setChats, chatRoom } = useChatContext()
    const messageWindowRef = useRef<HTMLDivElement | null>(null)
    const { register, handleSubmit, reset } = useForm({
      resolver: zodResolver(ChatBotMessageSchema),
      mode: 'onChange',
    })
    const onScrollToBottom = () => {
      messageWindowRef.current?.scroll({
        top: messageWindowRef.current.scrollHeight,
        left: 0,
        behavior: 'smooth',
      })
    }
  
    useEffect(() => {
      onScrollToBottom()
    }, [chats, messageWindowRef])
  
    // useEffect(() => {
    //   if (chatRoom) {
    //     pusherClient.subscribe(chatRoom)
    //     pusherClient.bind('realtime-mode', (data: any) => {
    //       setChats((prev) => [...prev, data.chat])
    //     })
  
    //     return () => {
    //       pusherClient.unbind('realtime-mode')
    //       pusherClient.unsubscribe(chatRoom)
    //     }
    //   }
    // }, [chatRoom])
  
    const onHandleSentMessage = handleSubmit(async (values) => {
      try {
        reset()
        const message = await onOwnerSendMessage(
          chatRoom!,
          values.content,
          'assistant'
        )
        //WIP: Remove this line
        if (message) {
          //remove this
          // setChats((prev) => [...prev, message.message[0]])
  
          // await onRealTimeChat(
          //   chatRoom!,
          //   message.message[0].message,
          //   message.message[0].id,
          //   'assistant'
          // )
        }
      } catch (error) {
        console.log(error)
      }
    })
  
    return {
      messageWindowRef,
      register,
      onHandleSentMessage,
      chats,
      loading,
      chatRoom,
    }
  }