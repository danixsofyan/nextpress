import { RoleGate } from '@/components/admin/role-gate'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGate min="editor">{children}</RoleGate>
}
