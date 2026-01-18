export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 8
}

export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/
  return re.test(phone)
}

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0
}

export const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: 'None' }
  
  let strength = 0
  
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++
  
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  
  return {
    strength,
    label: labels[Math.min(strength - 1, 4)] || 'Weak'
  }
}
