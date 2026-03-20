import { useEffect } from 'react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'

export function useBootstrap() {
  const { token, user, setAuth } = useAuthStore()

  useEffect(() => {
    if (!token || user) return
    authApi
      .profile()
      .then((res) => setAuth(token, res.data.data))
      .catch(() => useAuthStore.getState().clearAuth())
  }, [token, user, setAuth])
}
