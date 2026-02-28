import { api } from "@/app/api";



export const orderApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createOrder: builder.mutation({
            query: (payload) => ({
                url: '/orders',
                method: 'POST',
                body: payload,
                credentials: 'include'
            }),
            invalidatesTags: ['Order']
        }),
        getMyOrders: builder.query({
            query: () => '/orders/my',
            providesTags: ['Order']
        }),
        getOrder: builder.query({
            query: (id) => `/orders/${id}`,
            providesTags: (result, error, id) => [{ type: 'Order', id }]
        })
    })
})

export const {
    useCreateOrderMutation,
    useGetOrderQuery,
    useGetMyOrdersQuery
} = orderApi