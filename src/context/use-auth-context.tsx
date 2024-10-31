'use client'
//context file for sharing current step & setCurrentStep values of the auth workflow across components
import React, { useState } from 'react'

type InitialValuesProps={
    currentStep : number
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}
// default values of the context
const InitialValues  : InitialValuesProps={
    currentStep:1 ,
    setCurrentStep: ()=>undefined,
}


//React’s createContext: manages and shares the state of currentStep across components
//authContext is the container that holds the context which components will use to access currentSteps 
//& setCurrentStep func
const authContext = React.createContext(InitialValues)


//it is a special comp created from authContext. it makes the values of the current step 
//& SetCurrentstep func accessible to children comps wrapped within it
const {Provider}= authContext

export const AuthContextProvider=({children}:{
    children:React.ReactNode
})=>{
    //useState to create and manage currentStep and setCurrentStep
    const [currentStep , setCurrentStep]= useState<number>(
        InitialValues.currentStep
    )
    //The state values are loaded into "values" obj
    const values={currentStep, setCurrentStep}
    //make the currentStep and setCurrentStep accessible to every comp wrapped in "AuthContextProvider"
    return < Provider value={values}>{children}</Provider>
}

//AuthContextHook is a custom hook that simplifies access to the authContext data
//this hook ENCAPSULATES ALL CONTEXT LOGIC =>  can be used in any component to access or update currentStep without 
//directly interacting with the Provider component.
export const useAuthContextHook=()=>{
    //retrieve curretn context values
    const state = React.useContext(authContext);
    return state;
}