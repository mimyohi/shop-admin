"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminStore } from "@/store/admin-store"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const adminUser = useAdminStore((state) => state.adminUser)
  const hasHydrated = useAdminStore((state) => state.hasHydrated)
  const [isClient, setIsClient] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (hasHydrated && !adminUser && !isRedirecting) {
      setIsRedirecting(true)
      router.push("/login")
    }
  }, [adminUser, hasHydrated, router, isRedirecting])

  // Wait for hydration to complete
  if (!isClient || !hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 경우 리다이렉트 중이거나 완료될 때까지 대기
  if (!adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
