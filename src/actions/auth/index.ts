"use server"

import { client } from "@/lib/prisma"
import { create } from "domain"

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