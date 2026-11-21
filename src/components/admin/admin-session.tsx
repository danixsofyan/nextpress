'use client'

import { createContext, useContext } from 'react'

export type AdminUser = { id: string; name: string; email: string; role: string }

const AdminSessionContext = createContext<AdminUser | null>(null)

export function AdminSessionProvider({
  user,
  children,
}: {
  user: AdminUser | null
  children: React.ReactNode
}) {
  return <AdminSessionContext.Provider value={user}>{children}</AdminSessionContext.Provider>
}

export const useAdminUser = () => useContext(AdminSessionContext)
