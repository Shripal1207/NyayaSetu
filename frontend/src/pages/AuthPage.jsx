import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirebase } from '../context/FirebaseContext'
import UserTypeSelection from '../components/auth/UserTypeSelection'
import SignInForm from '../components/auth/SignInForm'
import SignUpForm from '../components/auth/SignUpForm'
import ProfileSetup from '../components/auth/ProfileSetup'
import Loader from '../components/ui/Loader'

const AuthPage = () => {
  const [authStep, setAuthStep] = useState('userType')
  const [userType, setUserType] = useState(null)
  const [tempUser, setTempUser] = useState(null)
  const { currentUser, loading } = useFirebase()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (currentUser && !tempUser) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [currentUser, tempUser, navigate, location])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <Loader size="lg" />
      </div>
    )
  }

  const handleUserTypeSelect = (type) => {
    setUserType(type)
    setAuthStep('signup')
  }

  const handleSignUpSuccess = (user) => {
    setTempUser(user)
    setAuthStep('profileSetup')
  }

  const handleProfileComplete = () => {
    const from = location.state?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {authStep === 'userType' && (
            <UserTypeSelection
              key="userType"
              onSelectType={handleUserTypeSelect}
              onSwitchToSignIn={() => setAuthStep('signin')}
            />
          )}

          {authStep === 'signin' && (
            <SignInForm
              key="signin"
              onSwitchToSignUp={() => setAuthStep('userType')}
            />
          )}

          {authStep === 'signup' && (
            <SignUpForm
              key="signup"
              userType={userType}
              onSignUpSuccess={handleSignUpSuccess}
              onSwitchToSignIn={() => setAuthStep('signin')}
            />
          )}

          {authStep === 'profileSetup' && tempUser && (
            <ProfileSetup
              key="profileSetup"
              user={tempUser}
              userType={userType}
              onComplete={handleProfileComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AuthPage
