export interface UserResponse {
  id: string
  pseudo: string
  icon: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: UserResponse
}