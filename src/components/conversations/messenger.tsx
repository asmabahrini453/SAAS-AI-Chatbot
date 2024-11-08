'use client'
import React from 'react'
import { Loader } from '../loader'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { PaperclipIcon } from 'lucide-react'
import { useChatWindow } from '@/hooks/conversation/use-conversation'
import Bubble from '../chatbot/bubble'
//the main chat interface where users can see the chat messages and send new messages.
type Props = {}

const Messenger = (props: Props) => {
  const {
    messageWindowRef,// Reference for auto-scrolling chat window
    chats, // Array of chat msgs
    loading,
    chatRoom,// Active chat room
    onHandleSentMessage, // Function to handle sending messages
    register,// form registration
  } = useChatWindow() //handles chat msgs:fetching them, displaying them, sending msgs

  return (
    <div className="flex-1 flex flex-col h-0 relative">
       {/* Chat window */}
      <div className="flex-1 h-0 w-full flex flex-col">
        <Loader loading={loading}>
          <div
            ref={messageWindowRef} //auto scroll to bottom on new msg
            className="w-full flex-1 h-0 flex flex-col gap-3 pl-5 py-5 chat-window overflow-y-auto"
          >
            {/* Render chat mesgs */}
            {chats.length ? (
              chats.map((chat) => (
                <Bubble
                  key={chat.id} // Unique key for each chat msg
                  message={{
                    role: chat.role!,
                    content: chat.message,
                  }}
                  createdAt={chat.createdAt}
                />
              ))
            ) : (
              <div>No Chat Selected</div>
            )}
          </div>
        </Loader>
      </div>
      {/* Msg input form */}
      <form
        onSubmit={onHandleSentMessage}
        className="flex px-3 pt-3 pb-10 flex-col backdrop-blur-sm bg-muted w-full"
      >
        <div className="flex justify-between">
           {/* Text input for msg content */}
          <Input
            {...register('content')}
            placeholder="Type your message..."
            className="focus-visible:ring-0 flex-1 p-0 focus-visible:ring-offset-0 bg-muted rounded-none outline-none border-none"
          />
          <Button
            type="submit"
            className="mt-3 px-7"
            disabled={!chatRoom}
          >
            Send
          </Button>
        </div>
        <span>
          {/* Icon for file attachment */}
          <PaperclipIcon className='text-muted-foreground' />
        </span>
      </form>
    </div>
  )
}

export default Messenger