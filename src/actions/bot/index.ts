'use server'

import { client } from '@/lib/prisma'
import { onRealTimeChat } from '../conversation'
import { clerkClient } from '@clerk/nextjs'
import { extractEmailsFromString, extractURLfromString } from '@/lib/utils'
import { onMailer } from '../mailer'
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Store conversation in the database
export const onStoreConversations = async (
  id: string,
  message: string,
  role: 'assistant' | 'user'
) => {
  await client.chatRoom.update({
    where: {
      id,
    },
    data: {
      message: {
        create: {
          message,
          role,
        },
      },
    },
  })
}

// Get chatbot details based on the current domain id
export const onGetCurrentChatBot = async (id: string) => {
  try {
    const chatbot = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        helpdesk: true,
        name: true,
        chatBot: {
          select: {
            id: true,
            welcomeMessage: true,
            icon: true,
            textColor: true,
            background: true,
            helpdesk: true,
          },
        },
      },
    })

    if (chatbot) {
      return chatbot
    }
  } catch (error) {
    console.log(error)
  }
}

let customerEmail: string | undefined

// Main function to handle chatbot assistant response
export const onAiChatBotAssistant = async (
  id: string,
  chat: { role: 'assistant' | 'user'; content: string }[],
  author: 'user',
  message: string
) => {
  try {
    const chatBotDomain = await client.domain.findUnique({
      where: { id },
      select: {
        name: true,
        filterQuestions: {
          where: { answered: null },
          select: { question: true },
        },
      },
    });

    if (chatBotDomain) {
      let customerEmail: string | undefined;

      const extractedEmail = extractEmailsFromString(message);
      if (extractedEmail) {
        customerEmail = extractedEmail[0];
      }

      // Check if the customer exists based on email
      if (customerEmail) {
        const checkCustomer = await client.domain.findUnique({
          where: { id },
          select: {
            User: { select: { clerkId: true } },
            customer: {
              where: { email: { startsWith: customerEmail } },
              select: {
                id: true,
                email: true,
                questions: true,
                chatRoom: { select: { id: true, live: true, mailed: true } },
              },
            },
          },
        });

        if (checkCustomer && !checkCustomer.customer.length) {
          const newCustomer = await client.domain.update({
            where: { id },
            data: {
              customer: {
                create: {
                  email: customerEmail,
                  questions: { create: chatBotDomain.filterQuestions },
                  chatRoom: { create: {} },
                },
              },
            },
          });

          // Send a welcome message
          if (newCustomer) {
            const response = {
              role: 'assistant',
              content: `Hi there! It's great to connect with you. Could you please provide your email address so I can assist you better?`,
            };
            return { response };
          }
        }

        // If chatroom is live, store conversation and send real-time response
        if (checkCustomer && checkCustomer.customer[0].chatRoom[0].live) {
          await onStoreConversations(checkCustomer.customer[0].chatRoom[0].id, message, author);
          onRealTimeChat(checkCustomer.customer[0].chatRoom[0].id, message, 'user', author);

          // Send email notification if needed
          if (!checkCustomer.customer[0].chatRoom[0].mailed) {
            const user = await clerkClient.users.getUser(checkCustomer.User?.clerkId!);
            onMailer(user.emailAddresses[0].emailAddress);

            const mailed = await client.chatRoom.update({
              where: { id: checkCustomer.customer[0].chatRoom[0].id },
              data: { mailed: true },
            });

            if (mailed) {
              return {
                live: true,
                chatRoom: checkCustomer.customer[0].chatRoom[0].id,
              };
            }
          }
          return {
            live: true,
            chatRoom: checkCustomer.customer[0].chatRoom[0].id,
          };
        }

        // Model prompt without instruction for behavior
        const inputs = `The customer has sent a message, and I need to ask them for their email address politely. 
        Please respond with a friendly and conversational tone, asking the customer to provide their email address so I can assist them further.`;

        const chatCompletion = await hf.textGeneration({
          model: "openai-community/gpt2-large",
          inputs,
          parameters: {
            max_new_tokens: 100,
            no_repeat_ngram_size: 3, // Prevent repetitive n-grams
          },
        });

        if (chatCompletion) {
          const response = {
            role: 'assistant',
            content: chatCompletion.generated_text.trim(), // Trim the response to avoid leading/trailing spaces
          };

          // Store the assistant's response in the database
          await onStoreConversations(checkCustomer!.customer[0].chatRoom[0].id, response.content, 'assistant');

          return { response };
        }
      }
    }

    // If no customer email, ask for it

    const greetingMessage = `Hi there! It's great to connect with you. Could you please provide your email address so I can assist you better?`;

    const chatCompletion = await hf.textGeneration({
        model: "openai-community/gpt2-large",
        inputs: greetingMessage,
        parameters: {
          max_new_tokens: 100,
          no_repeat_ngram_size: 3, // Prevent repetitive n-grams
        },
      });

    if (chatCompletion) {
      const response = {
        role: 'assistant',
        content: chatCompletion.generated_text.trim(), // Trim the response
      };

      return { response };
    }
  } catch (error) {
    console.error('Error in onAiChatBotAssistant:', error);
    return {
      response: {
        role: 'assistant',
        content: 'Something went wrong, please try again later.',
      },
    };
  }
};
