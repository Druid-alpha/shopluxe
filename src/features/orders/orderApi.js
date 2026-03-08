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
        getAllOrders: builder.query({
            query: () => '/orders',
            providesTags: ['Order'],
            credentials: 'include'
        }),
        getOrder: builder.query({
            query: (id) => `/orders/${id}`,
            providesTags: (result, error, id) => [{ type: 'Order', id }]
        }),
        generateOrderInvoice: builder.mutation({
            query: (id) => ({
                url: `/orders/${id}/invoice`,
                method: 'POST',
                credentials: 'include'
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Order', id }]
        }),
        updateOrderStatus: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/orders/${id}/status`,
                method: 'PATCH',
                body: body,
                credentials: 'include'
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Order', id }, 'Order']
        }),
        deleteOrder: builder.mutation({
            query: (id) => ({
                url: `/orders/${id}`,
                method: 'DELETE',
                credentials: 'include'
            }),
            invalidatesTags: ['Order']
        })
    })
})

export const {
    useCreateOrderMutation,
    useGetOrderQuery,
    useGenerateOrderInvoiceMutation,
    useGetMyOrdersQuery,
    useGetAllOrdersQuery,
    useUpdateOrderStatusMutation,
    useDeleteOrderMutation
} = orderApi
