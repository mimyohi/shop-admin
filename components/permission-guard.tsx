"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdminStore } from "@/store/admin-store"

interface PermissionGuardProps {
  children: React.ReactNode
  requireMaster?: boolean
}

export function PermissionGuard({
  children,
  requireMaster = false
}: PermissionGuardProps) {
  const router = useRouter()
  const adminUser = useAdminStore((state) => state.adminUser)
  const hasHydrated = useAdminStore((state) => state.hasHydrated)

  useEffect(() => {
    if (hasHydrated && requireMaster && adminUser?.role !== "master") {
      // 권한이 없으면 주문 관리 페이지로 리다이렉트
      router.push("/dashboard/orders")
    }
  }, [adminUser, hasHydrated, requireMaster, router])

  // hydration이 완료되지 않았거나 권한 체크 중일 때 로딩 표시
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 권한이 없으면 null 반환 (리다이렉트 진행 중)
  if (requireMaster && adminUser?.role !== "master") {
    return null
  }

  return <>{children}</>
}
