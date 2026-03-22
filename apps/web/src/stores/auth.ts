import { create } from 'zustand'
import type { User } from '../api/auth'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    set({ token, user })
  },
  setUser: (user) => {
    set({ user })
  },
  clearAuth: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  },
}))
