"use server"

import { client } from "@/lib/prisma"
import { currentUser, redirectToSignIn } from "@clerk/nextjs"
import { create } from "domain"
import { onGetAllAccountDomains } from "../settings"

//Signup action 
export const onCompleteUserRegistration = async(
    fullname:string ,
    clerkId:string,
    type:string
)=>{
    try{
        const resgistered = await client.user.create({ //client is the prisma client
           //create a new user
            data:{
                fullname,
                clerkId,
                type,
                subscription:{
                    create:{},
                },
            },
            select:{
                fullname:true,
                id: true,
                type:true
            }
        })
        if (resgistered) {
            return { status: 200, user: resgistered }
        }

    }catch(e){
        return{status:400}
    }
}

//

export const onLoginUser = async ()=>{
    const user = await currentUser()
    if(!user){
        redirectToSignIn() // from clerk 
    }else{
        try{
            const authenticated = await client.user.findUnique({
                where:{
                    clerkId: user.id,
                },
                select:{
                    fullname:true,
                    id:true,
                    type:true
                },
            })

            if(authenticated){
                const domains  = await onGetAllAccountDomains()
                return{status: 200,
                    user:authenticated,
                    domain:domains?.domains
                }
            }

        }catch(e){
            return{status: 400 }
    }
}}