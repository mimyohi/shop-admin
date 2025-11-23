"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/store/admin-store'

export default function Home() {
  const router = useRouter()
  const adminUser = useAdminStore((state) => state.adminUser)
  const hasHydrated = useAdminStore((state) => state.hasHydrated)

  useEffect(() => {
    if (hasHydrated) {
      if (adminUser) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [adminUser, hasHydrated, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}
