import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api'
import { MapPin, Search, Filter, X, Phone, Mail, Star, Briefcase, Video, MessageSquare } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { Card, CardContent } from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import { useFirebase } from '../context/FirebaseContext'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_MAP_API_KEY
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem'
}

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209
}

const libraries = ['places']

const LawyerSearchPage = () => {
  const { currentUser } = useFirebase()
  const navigate = useNavigate()
  const [userLocation, setUserLocation] = useState(defaultCenter)
  const [searchQuery, setSearchQuery] = useState('')
  const [radius, setRadius] = useState('10') // Changed to string to support 'all'
  const [lawyers, setLawyers] = useState([])
  const [filteredLawyers, setFilteredLawyers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLawyer, setSelectedLawyer] = useState(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [filters, setFilters] = useState({
    practiceArea: '',
    minExperience: '',
    maxFees: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const searchInputRef = useRef(null)
  const mapRef = useRef(null)

  // Load Google Maps API using the hook (prevents multiple loads)
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  })

  const radiusOptions = [
    { value: '5', label: 'Within 5 km' },
    { value: '10', label: 'Within 10 km' },
    { value: '25', label: 'Within 25 km' },
    { value: '50', label: 'Within 50 km' },
    { value: '100', label: 'Within 100 km' },
    { value: 'all', label: 'All India' }
  ]

  const practiceAreaOptions = [
    { value: '', label: 'All Practice Areas' },
    { value: 'Civil Law', label: 'Civil Law' },
    { value: 'Criminal Law', label: 'Criminal Law' },
    { value: 'Corporate Law', label: 'Corporate Law' },
    { value: 'Family Law', label: 'Family Law' },
    { value: 'Property Law', label: 'Property Law' },
    { value: 'Labour Law', label: 'Labour Law' },
    { value: 'Intellectual Property', label: 'Intellectual Property' },
    { value: 'Tax Law', label: 'Tax Law' }
  ]

  useEffect(() => {
    getUserLocation()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [lawyers, filters])

  const getUserLocation = () => {
    setLoading(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          searchLawyers({ lat: latitude, lng: longitude }, radius)
        },
        (error) => {
          console.error('Location error:', error)
          setToast({ show: true, message: 'Using default location', type: 'info' })
          searchLawyers(defaultCenter, radius)
        }
      )
    } else {
      searchLawyers(defaultCenter, radius)
    }
  }

  const searchLawyers = async (location, searchRadius) => {
    setLoading(true)
    try {
      let lawyersData = []
      let response
      let data

      if (searchRadius === 'all') {
        // Fetch ALL verified lawyers
        console.log('Fetching all verified lawyers (All India selected)...')
        response = await fetch(`${API_URL}/api/users/lawyers/all`)
        data = await response.json()
        if (response.ok && data.lawyers) {
          lawyersData = data.lawyers
        }
      } else {
        // 1. Try to fetch nearby verified lawyers
        response = await fetch(`${API_URL}/api/users/lawyers/nearby?latitude=${location.lat}&longitude=${location.lng}&radius=${searchRadius}`)
        data = await response.json()

        if (response.ok && data.lawyers && data.lawyers.length > 0) {
          lawyersData = data.lawyers
        } else {
          // 2. Fallback: Fetch ALL verified lawyers if no nearby ones found
          console.log('No nearby lawyers found, fetching all verified lawyers...')
          response = await fetch(`${API_URL}/api/users/lawyers/all`)
          data = await response.json()
          if (response.ok && data.lawyers) {
            lawyersData = data.lawyers
            setToast({ show: true, message: 'Showing all verified advocates (none found nearby)', type: 'info' })
          }
        }
      }

      if (lawyersData.length > 0) {
        // Map backend data to frontend format
        const mappedLawyers = lawyersData.map(lawyer => {
          // Get coordinates safely
          const lat = lawyer.coordinates?.coordinates?.[1] || defaultCenter.lat
          const lng = lawyer.coordinates?.coordinates?.[0] || defaultCenter.lng

          return {
            ...lawyer,
            id: lawyer._id,
            latitude: lat,
            longitude: lng,
            distance: calculateDistance(location.lat, location.lng, lat, lng).toFixed(1),
            rating: lawyer.rating || 'N/A',
            verified: lawyer.verificationStatus === 'verified'
          }
        })
        setLawyers(mappedLawyers)
      } else {
        setLawyers([])
      }
    } catch (error) {
      console.error('Error searching lawyers:', error)
      setToast({ show: true, message: 'Error searching for lawyers', type: 'error' })
      setLawyers([])
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const applyFilters = () => {
    let filtered = [...lawyers]

    if (filters.practiceArea) {
      filtered = filtered.filter(lawyer =>
        lawyer.practiceAreas && lawyer.practiceAreas.includes(filters.practiceArea)
      )
    }

    if (filters.minExperience) {
      filtered = filtered.filter(lawyer =>
        (lawyer.yearsOfExperience || 0) >= parseInt(filters.minExperience)
      )
    }

    if (filters.maxFees) {
      filtered = filtered.filter(lawyer =>
        (lawyer.consultationFees || 0) <= parseInt(filters.maxFees)
      )
    }

    // Sort by distance
    filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lawyer =>
        lawyer.name.toLowerCase().includes(query) ||
        (lawyer.practiceAreas && lawyer.practiceAreas.some(area => area.toLowerCase().includes(query)))
      )
    }

    setFilteredLawyers(filtered)
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const resetFilters = () => {
    setFilters({
      practiceArea: '',
      minExperience: '',
      maxFees: ''
    })
    setSearchQuery('')
  }

  const handleContactLawyer = (lawyer) => {
    setSelectedLawyer(lawyer)
    setShowContactModal(true)
  }

  const handleMessageLawyer = async () => {
    if (!currentUser) {
      setToast({ show: true, message: 'Please login to message advocates', type: 'error' })
      return
    }

    try {
      // Start conversation
      const response = await fetch(`${API_URL}/api/messages/start-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid
        },
        body: JSON.stringify({ otherUserId: selectedLawyer._id || selectedLawyer.id })
      })

      const data = await response.json()

      if (response.ok) {
        // Navigate to consultations with conversation state
        navigate('/consultations', {
          state: { conversation: data.conversation }
        })
      } else {
        setToast({ show: true, message: data.error || 'Failed to start conversation', type: 'error' })
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      setToast({ show: true, message: 'Failed to start conversation', type: 'error' })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters();
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              NyayBandhu - Find Advocates
            </h1>
            <p className="text-neutral-600">
              Your legal companion | न्यायबंधु - Connect with verified professionals
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Search & Filters */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSearch} className="relative mb-6">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search lawyers by name or specialization..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400" />
                  </form>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filters
                    </h3>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Search Radius
                      </label>
                      <Select
                        value={radius.toString()}
                        onChange={(e) => {
                          setRadius(e.target.value);
                          searchLawyers(userLocation, e.target.value);
                        }}
                        options={radiusOptions}
                      />
                    </div>

                    <Select
                      label="Practice Area"
                      name="practiceArea"
                      value={filters.practiceArea}
                      onChange={(e) => handleFilterChange('practiceArea', e.target.value)}
                      options={practiceAreaOptions}
                    />

                    <Input
                      label="Minimum Experience (Years)"
                      name="minExperience"
                      type="number"
                      value={filters.minExperience}
                      onChange={(e) => handleFilterChange('minExperience', e.target.value)}
                      placeholder="e.g., 5"
                    />

                    <Input
                      label="Maximum Fees (₹)"
                      name="maxFees"
                      type="number"
                      value={filters.maxFees}
                      onChange={(e) => handleFilterChange('maxFees', e.target.value)}
                      placeholder="e.g., 2000"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Map View */}
              <Card className="overflow-hidden">
                {loadError && (
                  <div className="h-[400px] flex items-center justify-center bg-neutral-100 text-neutral-500">
                    Map cannot be loaded right now
                  </div>
                )}
                {!isLoaded && !loadError && (
                  <div className="h-[400px] flex items-center justify-center bg-neutral-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                )}
                {isLoaded && !loadError && (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={userLocation}
                    zoom={12}
                    onLoad={map => (mapRef.current = map)}
                  >
                    {/* User Location */}
                    <Marker
                      position={userLocation}
                      icon={{
                        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                      }}
                    />

                    {/* Search Radius */}
                    {radius !== 'all' && (
                      <Circle
                        center={userLocation}
                        radius={parseInt(radius) * 1000}
                        options={{
                          fillColor: '#2563EB',
                          fillOpacity: 0.1,
                          strokeColor: '#2563EB',
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                        }}
                      />
                    )}

                    {/* Lawyers */}
                    {filteredLawyers.map(lawyer => (
                      <Marker
                        key={lawyer.id}
                        position={{ lat: lawyer.latitude, lng: lawyer.longitude }}
                        onClick={() => handleContactLawyer(lawyer)}
                      />
                    ))}
                  </GoogleMap>
                )}
              </Card>
            </div>

            {/* Right Column - Lawyer List */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-neutral-500">Searching for verified advocates nearby...</p>
                </div>
              ) : filteredLawyers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      No advocates found
                    </h3>
                    <p className="text-neutral-600 mb-6">
                      Try adjusting your filters or increasing the search radius
                    </p>
                    <Button onClick={resetFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {filteredLawyers.map(lawyer => (
                    <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                            <img
                              src={lawyer.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${lawyer.id}`}
                              alt={lawyer.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                                  {lawyer.name}
                                  {/* Verified Badge - Only showing verified lawyers now */}
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified
                                  </span>
                                </h3>
                                <div className="flex items-center gap-2 text-neutral-600 text-sm mt-1">
                                  <Briefcase className="w-4 h-4" />
                                  <span>{lawyer.yearsOfExperience || 0} Years Experience</span>
                                  <span>•</span>
                                  <MapPin className="w-4 h-4" />
                                  <span>{lawyer.distance} km away</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary-600">
                                  ₹{lawyer.consultationFees || 'N/A'}
                                </p>
                                <p className="text-xs text-neutral-500">per consultation</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {lawyer.practiceAreas && lawyer.practiceAreas.map((area, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 text-xs font-medium"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleContactLawyer(lawyer)}
                                className="flex-1"
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Contact Now
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => navigate(`/lawyer/${lawyer.id}`)}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={selectedLawyer ? `Contact ${selectedLawyer.name}` : 'Contact Advocate'}
      >
        <div className="space-y-6">
          <div className="bg-primary-50 p-4 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary-600 font-bold text-xl">
              {selectedLawyer?.name?.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-neutral-900">{selectedLawyer?.name}</h4>
              <p className="text-sm text-neutral-600">Verified Advocate</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                window.open(`tel:${selectedLawyer?.phone}`)
              }}
            >
              <Phone className="w-5 h-5 mr-3 text-neutral-500" />
              Call {selectedLawyer?.phone || 'Number not available'}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={() => {
                window.open(`mailto:${selectedLawyer?.email}`)
              }}
            >
              <Mail className="w-5 h-5 mr-3 text-neutral-500" />
              Email {selectedLawyer?.email}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={handleMessageLawyer}
            >
              <MessageSquare className="w-5 h-5 mr-3 text-neutral-500" />
              Message {selectedLawyer?.name}
            </Button>

            <Button
              variant="primary"
              className="w-full h-12"
              onClick={() => {
                setShowContactModal(false)
                navigate(`/book/${selectedLawyer?.id}`)
              }}
            >
              <Video className="w-5 h-5 mr-3" />
              Book Video Consultation
            </Button>
          </div>
        </div>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div >
  )
}

export default LawyerSearchPage
