import { useState, useEffect } from 'react'

const SESSION_KEY = 'srt_converter_auth'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const login = (password: string) => {
    const correctPassword = import.meta.env.VITE_APP_PASSWORD
    if (password === correctPassword) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
    }
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
  }

  return { isAuthenticated, error, login, logout }
}
