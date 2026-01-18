import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, Edit2, Save, X,
  Camera, Upload, Shield, CheckCircle, Clock, AlertTriangle
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Toast from '../components/ui/Toast'
import { useFirebase } from '../context/FirebaseContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const STATE_BAR_COUNCILS = [
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' },
  { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' },
  { value: 'CG', label: 'Chhattisgarh' },
  { value: 'DL', label: 'Delhi' },
  { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' },
  { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' },
  { value: 'NL', label: 'Nagaland' },
  { value: 'OD', label: 'Odisha' },
  { value: 'PB', label: 'Punjab' },
  { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TS', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UK', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' },
  { value: 'BCI', label: 'Bar Council of India' }
]

const ProfilePage = () => {
  const { currentUser, updateUserProfile } = useFirebase()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState(null)
  const [recentChats, setRecentChats] = useState([])
  const [recentDocuments, setRecentDocuments] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const [verificationStatus, setVerificationStatus] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const photoInputRef = useRef(null)
  const idCardInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    location: ''
  })

  // Advocate verification form
  const [verificationForm, setVerificationForm] = useState({
    stateCode: '',
    enrollmentNumber: '',
    enrollmentYear: '',
    idCardImage: null,
    idCardPreview: null
  })

  useEffect(() => {
    if (currentUser) {
      fetchUserData()
      fetchRecentActivity()
      if (currentUser.userType === 'lawyer') {
        fetchVerificationStatus()
      }
    }
  }, [currentUser])

  const fetchUserData = async () => {
    try {
      // Use data from currentUser (comes from JWT auth)
      setUserData(currentUser)
      setFormData({
        name: currentUser.displayName || currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        age: currentUser.age || '',
        gender: currentUser.gender || '',
        location: currentUser.location || ''
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
      setFormData({
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: '',
        age: '',
        gender: '',
        location: ''
      })
    }
  }

  const fetchRecentActivity = async () => {
    // Recent activity now comes from backend or is stored locally
    // For now, we just set empty arrays as this feature can be enhanced later
    try {
      setRecentChats([])
      setRecentDocuments([])
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/verification/status/${currentUser.uid}`)
      const data = await response.json()
      setVerificationStatus(data)
    } catch (error) {
      console.error('Error fetching verification status:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setToast({ show: true, message: 'Only JPG, PNG, and WebP images are allowed', type: 'error' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ show: true, message: 'Image size must be less than 2MB', type: 'error' })
      return
    }

    setUploadingPhoto(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const base64Image = event.target.result

          // Upload to Cloudinary via backend API
          const response = await fetch(`${API_URL}/api/auth/upload-photo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': currentUser.uid
            },
            body: JSON.stringify({ image: base64Image })
          })

          const data = await response.json()

          if (response.ok) {
            // Update Firestore with new photo URL
            await updateDoc(doc(db, 'users', currentUser.uid), {
              photoURL: data.photoURL,
              updatedAt: serverTimestamp()
            })

            setUserData(prev => ({ ...prev, photoURL: data.photoURL }))
            setToast({ show: true, message: 'Profile photo updated!', type: 'success' })
          } else {
            setToast({ show: true, message: data.error || 'Failed to upload photo', type: 'error' })
          }
        } catch (error) {
          console.error('Error uploading photo:', error)
          setToast({ show: true, message: 'Failed to upload photo', type: 'error' })
        } finally {
          setUploadingPhoto(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error reading file:', error)
      setToast({ show: true, message: 'Failed to read file', type: 'error' })
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateUserProfile(currentUser.uid, {
        displayName: formData.name,
        name: formData.name,
        phone: formData.phone,
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender,
        location: formData.location
      })

      setUserData(prev => ({ ...prev, ...formData, displayName: formData.name }))
      setIsEditing(false)
      setToast({ show: true, message: 'Profile updated successfully!', type: 'success' })
    } catch (error) {
      console.error('Update error:', error)
      setToast({ show: true, message: 'Failed to update profile', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: userData?.displayName || userData?.name || currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: userData?.phone || '',
      age: userData?.age || '',
      gender: userData?.gender || '',
      location: userData?.location || ''
    })
    setIsEditing(false)
  }

  // Advocate Verification Handlers
  const handleVerificationChange = (field, value) => {
    setVerificationForm(prev => ({ ...prev, [field]: value }))
  }

  const handleIdCardSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setToast({ show: true, message: 'Only JPG, PNG, and WebP images are allowed', type: 'error' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ show: true, message: 'Image size must be less than 5MB', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setVerificationForm(prev => ({
        ...prev,
        idCardImage: file,
        idCardPreview: e.target.result
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleVerificationSubmit = async () => {
    if (!verificationForm.stateCode || !verificationForm.enrollmentNumber || !verificationForm.enrollmentYear) {
      setToast({ show: true, message: 'Please fill all required fields', type: 'error' })
      return
    }

    if (!verificationForm.idCardImage) {
      setToast({ show: true, message: 'Please upload your Bar Council ID card', type: 'error' })
      return
    }

    setIsLoading(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('barCouncilNumber', `${verificationForm.stateCode}/${verificationForm.enrollmentNumber}/${verificationForm.enrollmentYear}`)
      formDataObj.append('barCouncilState', verificationForm.stateCode)
      formDataObj.append('idCardImage', verificationForm.idCardImage)

      const response = await fetch(`${API_URL}/api/verification/submit`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.uid
        },
        body: formDataObj
      })

      const data = await response.json()

      if (response.ok) {
        setToast({ show: true, message: 'Verification submitted successfully!', type: 'success' })
        fetchVerificationStatus()
      } else {
        setToast({ show: true, message: data.error || 'Submission failed', type: 'error' })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setToast({ show: true, message: 'Failed to submit verification', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]

  const truncateText = (text, maxLength = 100) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const getVerificationBadge = () => {
    if (!verificationStatus) return null

    const status = verificationStatus.verificationStatus
    if (status === 'verified') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Verified Advocate</span>
        </div>
      )
    } else if (status === 'pending') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Verification Pending</span>
        </div>
      )
    } else if (status === 'rejected') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Verification Rejected</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              My Profile
            </h1>
            <p className="text-neutral-600">
              Manage your personal information and view your activity
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {/* Profile Photo with Upload */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary-100">
                        <img
                          src={userData?.photoURL || currentUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.uid}`}
                          alt={formData.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg"
                        >
                          {uploadingPhoto ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Camera className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                    <h2 className="text-2xl font-semibold text-neutral-900 mb-1">
                      {formData.name || 'User'}
                    </h2>
                    <p className="text-neutral-600">{formData.email}</p>

                    {/* Verification Badge for Advocates */}
                    {currentUser?.userType === 'lawyer' && (
                      <div className="mt-3">
                        {getVerificationBadge()}
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3 text-neutral-700">
                          <Mail className="w-5 h-5 text-primary-600" />
                          <span className="text-sm">{formData.email}</span>
                        </div>

                        <div className="flex items-center gap-3 text-neutral-700">
                          <Phone className="w-5 h-5 text-primary-600" />
                          <span className="text-sm">{formData.phone || 'Not provided'}</span>
                        </div>

                        <div className="flex items-center gap-3 text-neutral-700">
                          <Calendar className="w-5 h-5 text-primary-600" />
                          <span className="text-sm">{formData.age ? `${formData.age} years old` : 'Age not set'}</span>
                        </div>

                        <div className="flex items-center gap-3 text-neutral-700">
                          <User className="w-5 h-5 text-primary-600" />
                          <span className="text-sm capitalize">{formData.gender || 'Not specified'}</span>
                        </div>

                        <div className="flex items-center gap-3 text-neutral-700">
                          <MapPin className="w-5 h-5 text-primary-600" />
                          <span className="text-sm">{formData.location || 'Location not set'}</span>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsEditing(true)}
                        className="w-full"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        name="name"
                        label="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        leftIcon={<User className="w-5 h-5" />}
                      />

                      <Input
                        name="email"
                        label="Email"
                        value={formData.email}
                        disabled
                        leftIcon={<Mail className="w-5 h-5" />}
                        helperText="Email cannot be changed"
                      />

                      <Input
                        name="phone"
                        label="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        leftIcon={<Phone className="w-5 h-5" />}
                      />

                      <Input
                        name="age"
                        type="number"
                        label="Age"
                        value={formData.age}
                        onChange={handleChange}
                        leftIcon={<Calendar className="w-5 h-5" />}
                      />

                      <Select
                        name="gender"
                        label="Gender"
                        value={formData.gender}
                        onChange={handleChange}
                        options={genderOptions}
                      />

                      <Input
                        name="location"
                        label="Location"
                        value={formData.location}
                        onChange={handleChange}
                        leftIcon={<MapPin className="w-5 h-5" />}
                      />

                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSave}
                          isLoading={isLoading}
                          className="flex-1"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advocate Verification Section */}
              {currentUser?.userType === 'lawyer' && (!verificationStatus || verificationStatus.verificationStatus === 'rejected') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary-600" />
                      Advocate Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-neutral-600">
                      Verify your credentials to appear as a verified advocate and enable consultations.
                    </p>

                    {verificationStatus?.verificationStatus === 'rejected' && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        <p className="font-medium">Previous submission was rejected</p>
                        {verificationStatus.rejectionReason && (
                          <p className="mt-1">Reason: {verificationStatus.rejectionReason}</p>
                        )}
                      </div>
                    )}

                    <Select
                      label="State Bar Council"
                      value={verificationForm.stateCode}
                      onChange={(e) => handleVerificationChange('stateCode', e.target.value)}
                      options={STATE_BAR_COUNCILS}
                      placeholder="Select State"
                    />

                    <Input
                      label="Enrollment Number"
                      placeholder="e.g., 12345"
                      value={verificationForm.enrollmentNumber}
                      onChange={(e) => handleVerificationChange('enrollmentNumber', e.target.value)}
                    />

                    <Input
                      label="Year of Enrollment"
                      type="number"
                      placeholder="e.g., 2015"
                      value={verificationForm.enrollmentYear}
                      onChange={(e) => handleVerificationChange('enrollmentYear', e.target.value)}
                    />

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Bar Council ID Card
                      </label>
                      <div
                        onClick={() => idCardInputRef.current?.click()}
                        className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                      >
                        {verificationForm.idCardPreview ? (
                          <img
                            src={verificationForm.idCardPreview}
                            alt="ID Card Preview"
                            className="max-h-40 mx-auto rounded-lg"
                          />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                            <p className="text-sm text-neutral-600">Click to upload ID card</p>
                            <p className="text-xs text-neutral-400 mt-1">JPG, PNG or WebP (max 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        ref={idCardInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleIdCardSelect}
                        className="hidden"
                      />
                    </div>

                    <Button
                      variant="primary"
                      onClick={handleVerificationSubmit}
                      isLoading={isLoading}
                      className="w-full"
                    >
                      Submit for Verification
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Chat Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentChats.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No chat history yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/chat'}
                        className="mt-4"
                      >
                        Start Chatting
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentChats.map((chat, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          {chat.messages && chat.messages.slice(0, 2).map((msg, msgIndex) => (
                            <div key={msgIndex} className="mb-2 last:mb-0">
                              <span className={`text-sm font-medium ${msg.sender === 'user' ? 'text-primary-600' : 'text-accent-600'}`}>
                                {msg.sender === 'user' ? 'You: ' : 'AI: '}
                              </span>
                              <span className="text-sm text-neutral-700">
                                {truncateText(msg.text, 80)}
                              </span>
                            </div>
                          ))}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Document Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No documents analyzed yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/analyze'}
                        className="mt-4"
                      >
                        Analyze Document
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentDocuments.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Briefcase className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-neutral-900 mb-1">
                                {doc.fileName || 'Document'}
                              </h4>
                              <p className="text-sm text-neutral-600">
                                Language: {doc.language || 'English'}
                              </p>
                              {doc.explanation && (
                                <p className="text-sm text-neutral-500 mt-2">
                                  {truncateText(doc.explanation, 100)}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <p className="text-3xl font-bold text-primary-600">
                        {recentChats.length}
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">Chats</p>
                    </div>
                    <div className="text-center p-4 bg-accent-50 rounded-lg">
                      <p className="text-3xl font-bold text-accent-600">
                        {recentDocuments.length}
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">Documents</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        {userData?.userType === 'lawyer' ? 'Advocate' : 'Client'}
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">Account Type</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}

export default ProfilePage
