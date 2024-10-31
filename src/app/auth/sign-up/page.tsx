'use client'
import ButtonHandlers from '@/components/forms/sign-up/button-handlers'
//this comp will serve as the main container for your sign-up form.
import SignUpFormProvider from '@/components/forms/sign-up/form-provider'
import HighLightBar from '@/components/forms/sign-up/highlight-bar'
import RegisterationFormStep from '@/components/forms/sign-up/registeration-step'
import React from 'react'

type Props = {}

const SignUp = (props: Props) => {
  return (
    <div className="flex-1 py-36 md:px-16 w-full">
      <div className='flex flex-col h-full gap-3 '>
      {/* Wraps the entire form to manage the form state and handle submissions. */}
        <SignUpFormProvider>
          <div className='flex flex-col gap-3'>
          {/* manages form fields and collects user information step-by-step. */}
            <RegisterationFormStep/>
            {/* Handles form navigation => moving between steps. */}
            <ButtonHandlers/>
            {/* display current step like a progress bar */}
            <HighLightBar/>
          </div>
        </SignUpFormProvider>

      </div>
    </div>
  )
}

export default SignUp