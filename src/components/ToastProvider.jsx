

import React from 'react'
import { ToastProvider } from './ui/toast'

export default function GlobalToast({children}) {
  return (
    <ToastProvider>{children}</ToastProvider>
  )
}
