import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { MapPin, User, Calendar, Users as UsersIcon, Phone, Briefcase, GraduationCap } from 'lucide-react'
import { useFirebase } from '../../context/FirebaseContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Toast from '../ui/Toast'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_MAP_API_KEY

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.75rem'
}

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209
}

const libraries = ['places']

const ProfileSetup = ({ user, userType, onComplete }) => {
  const { updateUserProfile } = useFirebase()
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const searchInputRef = useRef(null)
  const autocompleteRef = useRef(null)
  
  const [formData, setFormData] = useState({
    name: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`,
    age: '',
    gender: '',
    phone: '',
    location: '',
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    yearsOfExperience: '',
    qualification: '',
    practiceAreas: [],
    consultationFees: '',
    userType: userType || 'user'
  })

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          updateLocation(latitude, longitude)
        },
        (error) => {
          console.error('Error getting location:', error)
          updateLocation(defaultCenter.lat, defaultCenter.lng)
        }
      )
    }
  }

  const updateLocation = async (latitude, longitude) => {
    setFormData(prev => ({ ...prev, latitude, longitude }))
    await fetchLocationDetails(latitude, longitude)
  }

  const fetchLocationDetails = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()
      if (data.results && data.results.length > 0) {
        setFormData(prev => ({
          ...prev,
          location: data.results[0].formatted_address
        }))
      }
    } catch (error) {
      console.error('Error fetching location:', error)
    }
  }

  const initializeAutocomplete = (map) => {
    if (searchInputRef.current && !autocompleteRef.current && window.google) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { types: ['geocode'] }
      )

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace()
        if (place.geometry) {
          const location = place.geometry.location
          setFormData(prev => ({
            ...prev,
            latitude: location.lat(),
            longitude: location.lng(),
            location: place.formatted_address
          }))
        }
      })
    }
  }

  const handleMapClick = (e) => {
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    updateLocation(lat, lng)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePracticeAreaChange = (e) => {
    const options = e.target.options
    const selected = []
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value)
      }
    }
    setFormData(prev => ({ ...prev, practiceAreas: selected }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const profileData = {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        location: formData.location,
        coordinates: {
          latitude: formData.latitude,
          longitude: formData.longitude
        },
        photoURL: formData.photoURL,
        userType: formData.userType
      }

      if (userType === 'lawyer') {
        profileData.yearsOfExperience = Number(formData.yearsOfExperience)
        profileData.qualification = formData.qualification
        profileData.practiceAreas = formData.practiceAreas
        profileData.consultationFees = Number(formData.consultationFees)
      }

      await updateUserProfile(user.uid, profileData)
      
      setToast({ show: true, message: 'Profile created successfully!', type: 'success' })
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (error) {
      console.error('Profile setup error:', error)
      setToast({ show: true, message: 'Failed to create profile. Please try again.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]

  const practiceAreaOptions = [
    'Civil Law',
    'Criminal Law',
    'Corporate Law',
    'Family Law',
    'Property Law',
    'Labour Law',
    'Tax Law',
    'Intellectual Property'
  ]

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-primary-100">
              <img
                src={formData.photoURL}
                alt={formData.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-neutral-600">
              Help us personalize your experience
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
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                name="age"
                type="number"
                label="Age"
                placeholder="25"
                value={formData.age}
                onChange={handleChange}
                leftIcon={<Calendar className="w-5 h-5" />}
                required
              />

              <Select
                name="gender"
                label="Gender"
                value={formData.gender}
                onChange={handleChange}
                options={genderOptions}
                placeholder="Select gender"
                required
              />
            </div>

            <Input
              name="phone"
              type="tel"
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              leftIcon={<Phone className="w-5 h-5" />}
              helperText="We'll never share your number"
              required
            />

            {userType === 'lawyer' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="yearsOfExperience"
                    type="number"
                    label="Years of Experience"
                    placeholder="5"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    leftIcon={<Briefcase className="w-5 h-5" />}
                    required
                  />

                  <Input
                    name="consultationFees"
                    type="number"
                    label="Consultation Fees (₹/hr)"
                    placeholder="1000"
                    value={formData.consultationFees}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Input
                  name="qualification"
                  type="text"
                  label="Qualification"
                  placeholder="LLB, LLM"
                  value={formData.qualification}
                  onChange={handleChange}
                  leftIcon={<GraduationCap className="w-5 h-5" />}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Practice Areas <span className="text-red-500">*</span>
                  </label>
                  <select
                    multiple
                    onChange={handlePracticeAreaChange}
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    size={4}
                    required
                  >
                    {practiceAreaOptions.map(area => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Hold Ctrl/Cmd to select multiple areas
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              
              <div className="mb-3">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for your location"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <LoadScript
                googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                libraries={libraries}
                onLoad={() => initializeAutocomplete()}
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={{ lat: formData.latitude, lng: formData.longitude }}
                  zoom={12}
                  onClick={handleMapClick}
                >
                  <Marker
                    position={{ lat: formData.latitude, lng: formData.longitude }}
                  />
                </GoogleMap>
              </LoadScript>

              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-neutral-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {formData.location || 'Fetching location...'}
                </p>
                <button
                  type="button"
                  onClick={getUserLocation}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Use current location
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Complete Setup
            </Button>
          </form>
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

export default ProfileSetup
