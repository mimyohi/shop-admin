"use client"

import { DashboardNav } from "@/components/dashboard-nav"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
