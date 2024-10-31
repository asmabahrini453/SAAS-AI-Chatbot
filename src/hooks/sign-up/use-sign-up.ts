'use client'
import { useState } from "react";
import { useToast } from "../use-toast";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { UserRegistrationProps, UserRegistrationSchema } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onCompleteUserRegistration } from "@/actions/auth";


//custom sign up hook 
//anything related to CLERK AUTHENTICATION is in here 

export const useSignUpForm=()=>{
    const {toast} = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const {signUp,isLoaded,setActive}= useSignUp()
    const router = useRouter()
    //useForm hook to manage form fields
    const methods = useForm<UserRegistrationProps>({
        //using ZOD for validation to validate the user form field data with the adequate schema conditions
        resolver: zodResolver(UserRegistrationSchema),
        defaultValues:{
            type:'owner',//who is using the plateform by default,

        },
        mode:'onChange'
    });
//generate an OTP : ONE-TIME-PASSWORD
    const onGenerateOTP = async (
        email: string,
        password: string,
        onNext: React.Dispatch<React.SetStateAction<number>>
      ) => {
        if (!isLoaded) return
    
        try {
          await signUp.create({
            emailAddress: email,
            password: password,
          })
    
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
    
          onNext((prev) => prev + 1) //to move to the next step (page)
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.errors[0].longMessage,
          })
        }
      }
      //SUBMISSION
      const onHandleSubmit = methods.handleSubmit( //handleSubmit func from useForm hook
        async (values: UserRegistrationProps) => {
          if (!isLoaded) return
    
          try {
            setLoading(true)
            const completeSignUp = await signUp.attemptEmailAddressVerification({
              code: values.otp,
            })
    
            if (completeSignUp.status !== 'complete') {
              return { message: 'Something went wrong!' }
            }
    
            if (completeSignUp.status == 'complete') {
              if (!signUp.createdUserId) return
    
              const registered = await onCompleteUserRegistration(
                values.fullname,
                signUp.createdUserId,
                values.type
              )
    
              if (registered?.status == 200 && registered.user) {
                await setActive({
                    //create session
                  session: completeSignUp.createdSessionId,
                })
    
                setLoading(false)
                router.push('/dashboard')
              }
    
              if (registered?.status == 400) {
                toast({
                  title: 'Error',
                  description: 'Something went wrong!',
                })
              }
            }
          } catch (error: any) {
            toast({
              title: 'Error',
              description: error.errors[0].longMessage,
            })
          }
        }
      )
      return {
        methods,
        onHandleSubmit,
        onGenerateOTP,
        loading,
      }
}


