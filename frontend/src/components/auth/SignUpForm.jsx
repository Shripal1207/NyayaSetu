import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowLeft } from 'lucide-react'
import { useFirebase } from '../../context/FirebaseContext'
import { validateEmail, validatePassword, getPasswordStrength } from '../../utils/validators'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Toast from '../ui/Toast'

const SignUpForm = ({ userType, onSignUpSuccess, onSwitchToSignIn }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const { signUpWithEmail } = useFirebase()

  const passwordStrength = getPasswordStrength(formData.password)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const result = await signUpWithEmail(formData.email, formData.password, formData.name, userType)
      setToast({ show: true, message: 'Account created successfully!', type: 'success' })
      setTimeout(() => {
        onSignUpSuccess(result.user)
      }, 1000)
    } catch (error) {
      let message = 'Failed to create account. Please try again.'
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email is already registered'
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak'
      }
      setToast({ show: true, message, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const strengthColors = {
    0: 'bg-neutral-200',
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500',
    5: 'bg-green-600'
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <button
          onClick={onSwitchToSignIn}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Create your account
            </h2>
            <p className="text-neutral-600">
              Join as a <span className="font-semibold text-primary-600">{userType === 'lawyer' ? 'Advocate' : 'Client'}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              name="name"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            <Input
              name="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <div>
              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${i < passwordStrength.strength
                          ? strengthColors[passwordStrength.strength]
                          : 'bg-neutral-200'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-600">
                    Password strength: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <Input
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-primary-600 font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  )
}

export default SignUpForm
