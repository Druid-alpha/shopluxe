import { Navigate } from 'react-router-dom'
import { useGetProfileQuery } from '@/features/auth/authApi'

export default function ProtectedRoute({ children, roles }) {
  const { data, isLoading, isError } = useGetProfileQuery()

  if (isLoading) return null

  // Not logged in
  if (!isLoading && (isError || !data?.user)) {
  return <Navigate to="/login" replace />
}

  // Role restriction
  if (roles && !roles.includes(data.user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
