import { createContext, useContext, useState, useEffect } from 'react'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// Firebase config for Firestore only (chat history, documents)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MSG_SEND_ID,
  appId: import.meta.env.VITE_APP_ID,
}

// Initialize Firebase for Firestore only (used for chat/doc storage)
let db = null
try {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  enableIndexedDbPersistence(db).catch(() => { })
} catch (error) {
  console.warn('Firestore initialization skipped:', error.message)
}

export { db }

const AuthContext = createContext(null)

export const useFirebase = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useFirebase must be used within AuthProvider')
  }
  return context
}

export const FirebaseProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing token on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentUser({
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.name,
          photoURL: data.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`,
          userType: data.user.userType,
          mongoId: data.user.id,
          verified: data.user.verified,
          verificationStatus: data.user.verificationStatus,
          phone: data.user.phone,
          age: data.user.age,
          gender: data.user.gender,
          location: data.user.location,
          yearsOfExperience: data.user.yearsOfExperience,
          qualification: data.user.qualification,
          practiceAreas: data.user.practiceAreas,
          consultationFees: data.user.consultationFees,
          rating: data.user.rating
        })
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token')
      }
    } catch (err) {
      console.error('Auth check error:', err)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email, password, displayName = '', userType = 'user') => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: displayName, userType })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Store token
      localStorage.setItem('token', data.token)

      // Set user
      setCurrentUser({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name,
        photoURL: data.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`,
        userType: data.user.userType,
        mongoId: data.user.id
      })

      return { user: data.user }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signInWithEmail = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token
      localStorage.setItem('token', data.token)

      // Set user
      setCurrentUser({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name,
        photoURL: data.user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${data.user.name}`,
        userType: data.user.userType,
        mongoId: data.user.id,
        verified: data.user.verified,
        verificationStatus: data.user.verificationStatus,
        phone: data.user.phone,
        age: data.user.age,
        gender: data.user.gender,
        location: data.user.location
      })

      return { user: data.user }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem('token')
      setCurrentUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const updateUserProfile = async (userId, data) => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Update failed')
      }

      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        ...data,
        displayName: data.name || prev.displayName
      }))

      return result
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  // Helper to get auth token for API calls
  const getAuthToken = () => {
    return localStorage.getItem('token')
  }

  // Helper to get current user ID for API calls
  const getUserId = () => {
    return currentUser?.uid || currentUser?.mongoId
  }

  const value = {
    currentUser,
    loading,
    error,
    signUpWithEmail,
    signInWithEmail,
    logout,
    updateUserProfile,
    getAuthToken,
    getUserId,
    // Dummy functions for backward compatibility
    createUserDocument: async () => { }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
