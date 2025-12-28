import {create} from 'zustand'

export interface CurrentUser {
  id: number | null
  email: string | null
  role: number | null
}

interface AuthStore {
  isAuthenticated: boolean
  isLoading: boolean
  user: CurrentUser | null
  setAuth: (user: CurrentUser | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  setAuth: (user) => set({
    user,
    isAuthenticated: !!user,
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearAuth: () => set({ isAuthenticated: false, user: null }),
}))

export default useAuthStore

