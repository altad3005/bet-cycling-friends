import { api } from './client'

export interface User {
  id: string
  pseudo: string
  email: string
  icon: string
  initials: string
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

// Login & signup: { data: { user: User, token: string } }
export interface AuthResponse {
  data: {
    token: string
    user: User
  }
}

export const authApi = {
  signup: (pseudo: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/signup', {
      pseudo,
      email,
      password,
      passwordConfirmation: password,
    }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),

  // GET /account/profile: { data: { id, pseudo, ... } } (no user wrapper)
  profile: () => api.get<{ data: User }>('/account/profile'),

  updateProfile: (pseudo: string) =>
    api.put<{ data: User }>('/account/profile', { pseudo }),
}
