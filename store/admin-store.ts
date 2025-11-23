import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AdminUser } from '@/lib/auth'

interface AdminState {
  adminUser: AdminUser | null
  hasHydrated: boolean
  setAdminUser: (user: AdminUser | null) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      adminUser: null,
      hasHydrated: false,
      setAdminUser: (user) => set({ adminUser: user }),
      logout: () => set({ adminUser: null }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'admin-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
