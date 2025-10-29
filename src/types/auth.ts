export interface User {
  id: string
  email: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export type AuthProvider = 'google' | 'github'
