'use client'
import { useState } from "react";
import { useToast } from "../use-toast";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { UserLoginProps, UserLoginSchema, } from "@/schemas/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";


//custom sign in hook 
//anything related to CLERK login is in here 

export const useSignInForm=()=>{
    const {toast} = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const {signIn,isLoaded,setActive}= useSignIn()
    const router = useRouter()



    //useForm hook to manage form fields
    const methods = useForm<UserLoginProps>({
        //using ZOD for validation to validate the user form field data with the adequate schema conditions
        resolver: zodResolver(UserLoginSchema),
    
        mode:'onChange'
    });


    const onHandleSubmit = methods.handleSubmit(
        async (values: UserLoginProps) => {
          if (!isLoaded) return
    
          try {
            setLoading(true)
            const authenticated = await signIn.create({
              identifier: values.email,
              password: values.password,
            })
    
            if (authenticated.status === 'complete') {
              await setActive({ session: authenticated.createdSessionId })
              toast({
                title: 'Success',
                description: 'Welcome back!',
              })
              router.push('/dashboard')
            }
          } catch (error: any) {
            setLoading(false)
            if (error.errors[0].code === 'form_password_incorrect')
              toast({
                title: 'Error',
                description: 'email/password is incorrect try again',
              })
          }
        } )
      return {
        methods,
        onHandleSubmit,
        loading,
      }
}


