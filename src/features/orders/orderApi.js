import { api } from "@/app/api";



export const orderApi = api.injectEndpoints({
    endpoints:(builder)=>({
        createOrder:builder.mutation({
            query:(payload)=>({
                url:'/orders',
                method:'POST',
                body:payload,
                credentials:'include'
            })
        })
    })
})
export const {useCreateOrderMutation}=orderApi