//custom hook that give us access to the selected theme

import {
    onChatBotImageUpdate,
    onCreateFilterQuestions,
    onCreateHelpDeskQuestion,
    onCreateNewDomainProduct,
    onDeleteUserDomain,
    onGetAllFilterQuestions,
    onGetAllHelpDeskQuestions,
    onUpdateDomain,
    onUpdatePassword,
    onUpdateWelcomeMessage,
  } from '@/actions/settings'
  import {
    ChangePasswordProps,
    ChangePasswordSchema,
  } from '@/schemas/auth.schema'
  import {
    AddProductProps,
    AddProductSchema,
    DomainSettingsProps,
    DomainSettingsSchema,
    FilterQuestionsProps,
    FilterQuestionsSchema,
    HelpDeskQuestionsProps,
    HelpDeskQuestionsSchema,
  } from '@/schemas/settings.schema'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { UploadClient } from '@uploadcare/upload-client'
  import { useTheme } from 'next-themes'
  import { useRouter } from 'next/navigation'
  import { useEffect, useState } from 'react'
  import { useForm } from 'react-hook-form'
import { useToast } from '../use-toast'


  //to upload files
  const upload = new UploadClient({
    publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
  })
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  export const useThemeMode = () => {
    const { setTheme, theme } = useTheme() //from next theme
    return {
      setTheme,
      theme,
    }
  }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

  //hook to change password
  export const useChangePassword = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm<ChangePasswordProps>({
      resolver: zodResolver(ChangePasswordSchema),
      mode: 'onChange',
    })
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
  
    const onChangePassword = handleSubmit(async (values) => {
      try {
        setLoading(true)
        const updated = await onUpdatePassword(values.password)
        if (updated) {
          reset()
          setLoading(false)
          toast({ title: 'Success', description: updated.message })
        }
      } catch (error) {
        console.log(error)
      }
    })
    return {
      register,
      errors,
      onChangePassword,
      loading,
    }
  }
  
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

  export const useSettings = (id: string) => {
    const {
      register,  // Function to register form fields
      handleSubmit, // Function to handle form submission
      formState: { errors }, // Object to store form validation errors
      reset,// Function to reset form fields
    } = useForm<DomainSettingsProps>({
      resolver: zodResolver(DomainSettingsSchema),
    })
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<boolean>(false)
  
     // Function to handle form submission and update settings
    const onUpdateSettings = handleSubmit(async (values) => {
      setLoading(true)
       // Update domain if domain field is provided
      if (values.domain) {
        const domain = await onUpdateDomain(id, values.domain)
        if (domain) {
          toast({
            title: 'Success',
            description: domain.message,
          })
        }
      }

      // Upload an image if provided in form
      if (values.image[0]) {
        // Upload the file
        const uploaded = await upload.uploadFile(values.image[0])
        // Update image for chatbot
        const image = await onChatBotImageUpdate(id, uploaded.uuid)
        if (image) {
          toast({
            title: image.status == 200 ? 'Success' : 'Error',
            description: image.message,
          })
          setLoading(false)
        }
      }

       // Update welcome message if provided
      if (values.welcomeMessage) {
        const message = await onUpdateWelcomeMessage(values.welcomeMessage, id)
        if (message) {
          toast({
            title: 'Success',
            description: message.message,
          })
        }
      }

    reset()           // Reset form fields
    router.refresh()  // Refresh the current page to show updated data
    setLoading(false)
    })

  // Function to handle deletion of a domain
    const onDeleteDomain = async () => {
      setDeleting(true)
      const deleted = await onDeleteUserDomain(id)
      if (deleted) {
        toast({
          title: 'Success',
          description: deleted.message,
        })
        setDeleting(false) // Set deleting state to false
        router.refresh()
      }
    }
    // Return all functions and states needed by the comp
    return {
      register,
      onUpdateSettings,
      errors,
      loading,
      onDeleteDomain,
      deleting,// Loading state for deletion
    }
  }


  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  export const useHelpDesk = (id: string) => {
    const {
      register,
      formState: { errors },
      handleSubmit,
      reset,
    } = useForm<HelpDeskQuestionsProps>({
      resolver: zodResolver(HelpDeskQuestionsSchema),
    })
    const { toast } = useToast()
  
    const [loading, setLoading] = useState<boolean>(false)
    const [isQuestions, setIsQuestions] = useState<
      { id: string; question: string; answer: string }[]
    >([])

    //submission handler
    const onSubmitQuestion = handleSubmit(async (values) => {
      setLoading(true)
      const question = await onCreateHelpDeskQuestion(
        id,
        values.question,
        values.answer
      )
      if (question) {
        setIsQuestions(question.questions!)
        toast({
          title: question.status == 200 ? 'Success' : 'Error',
          description: question.message,
        })
        setLoading(false)
        reset()
      }
    })
  //get all help questions
    const onGetQuestions = async () => {
      setLoading(true)
      const questions = await onGetAllHelpDeskQuestions(id)
      if (questions) {
        setIsQuestions(questions.questions)
        setLoading(false)
      }
    }
  
    useEffect(() => {
      onGetQuestions()
    }, [])
  
    return {
      register,
      onSubmitQuestion,
      errors,
      isQuestions,
      loading,
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  
  export const useFilterQuestions = (id: string) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm<FilterQuestionsProps>({
      resolver: zodResolver(FilterQuestionsSchema),
    })
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const [isQuestions, setIsQuestions] = useState<
      { id: string; question: string }[]
    >([])
  
    const onAddFilterQuestions = handleSubmit(async (values) => {
      setLoading(true)
      const questions = await onCreateFilterQuestions(id, values.question)
      if (questions) {
        setIsQuestions(questions.questions!)
        toast({
          title: questions.status == 200 ? 'Success' : 'Error',
          description: questions.message,
        })
        reset()
        setLoading(false)
      }
    })
  
    const onGetQuestions = async () => {
      setLoading(true)
      const questions = await onGetAllFilterQuestions(id)
      if (questions) {
        setIsQuestions(questions.questions)
        setLoading(false)
      }
    }
  
    useEffect(() => {
      onGetQuestions()
    }, [])
  
    return {
      loading,
      onAddFilterQuestions,
      register,
      errors,
      isQuestions,
    }
  }
  ////////////////////////////////////////////////////////////

  export const useProducts = (domainId: string) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const {
      register,
      reset,
      formState: { errors },
      handleSubmit,
    } = useForm<AddProductProps>({
      resolver: zodResolver(AddProductSchema),
    })
  
    const onCreateNewProduct = handleSubmit(async (values) => {
      try {
        setLoading(true)
        //uploading the product from the uploadcare 
        const uploaded = await upload.uploadFile(values.image[0])
       //create it
        const product = await onCreateNewDomainProduct(
          domainId,
          values.name,
          uploaded.uuid,
          values.price
        )
        if (product) {
          reset()
          toast({
            title: 'Success',
            description: product.message,
          })
          setLoading(false)
        }
      } catch (error) {
        console.log(error)
      }
    })
  
    return { onCreateNewProduct, register, errors, loading }
  }