import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    User, Mail, Phone, MapPin, Star, Briefcase, GraduationCap,
    CheckCircle, Calendar, Video, MessageSquare, ArrowLeft, Shield, Clock
} from 'lucide-react'
import Button from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import Toast from '../components/ui/Toast'
import { useFirebase } from '../context/FirebaseContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const LawyerProfilePage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { currentUser } = useFirebase()
    const [lawyer, setLawyer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

    useEffect(() => {
        fetchLawyerDetails()
    }, [id])

    const fetchLawyerDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/users/by-id/${id}`)
            if (response.ok) {
                const data = await response.json()
                setLawyer(data)
            } else {
                setToast({ show: true, message: 'Lawyer not found', type: 'error' })
            }
        } catch (error) {
            console.error('Error fetching lawyer:', error)
            setToast({ show: true, message: 'Failed to load lawyer details', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleBookConsultation = () => {
        navigate(`/book-consultation/${id}`)
    }

    const handleStartChat = async () => {
        if (!currentUser) {
            setToast({ show: true, message: 'Please login to start a conversation', type: 'warning' })
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/messages/start-conversation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser.uid
                },
                body: JSON.stringify({ otherUserId: id })
            })

            const data = await response.json()

            if (response.ok) {
                navigate('/consultations', { state: { conversation: data.conversation } })
            } else {
                setToast({ show: true, message: data.error || 'Failed to start conversation', type: 'error' })
            }
        } catch (error) {
            console.error('Error starting conversation:', error)
            setToast({ show: true, message: 'Failed to start conversation', type: 'error' })
        }
    }

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LA'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!lawyer) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-semibold text-neutral-700 mb-4">Lawyer not found</h2>
                <Button onClick={() => navigate('/lawyers')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Search
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate('/lawyers')}
                    className="mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Search
                </Button>

                {/* Main Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                {/* Avatar */}
                                <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30">
                                    {lawyer.photoURL ? (
                                        <img src={lawyer.photoURL} alt={lawyer.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        getInitials(lawyer.name)
                                    )}
                                </div>

                                {/* Info */}
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                        <h1 className="text-3xl font-bold">{lawyer.name}</h1>
                                        {lawyer.verificationStatus === 'verified' && (
                                            <span className="flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90 mt-3">
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-4 h-4" />
                                            {lawyer.yearsOfExperience || 0} Years Experience
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400" />
                                            {lawyer.rating?.toFixed(1) || '0.0'} Rating
                                        </span>
                                        {lawyer.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {lawyer.location}
                                            </span>
                                        )}
                                    </div>

                                    {/* Consultation Fee */}
                                    <div className="mt-4 inline-block bg-white/20 rounded-lg px-4 py-2">
                                        <span className="text-2xl font-bold">₹{lawyer.consultationFees || '0'}</span>
                                        <span className="text-sm opacity-80"> / consultation</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-6">
                            {/* Practice Areas */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-primary-600" />
                                    Practice Areas
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {lawyer.practiceAreas?.length > 0 ? (
                                        lawyer.practiceAreas.map((area, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                                            >
                                                {area}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-neutral-500">No practice areas specified</span>
                                    )}
                                </div>
                            </div>

                            {/* Qualification */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5 text-primary-600" />
                                    Qualification
                                </h2>
                                <p className="text-neutral-700">
                                    {lawyer.qualification || 'Qualification details not available'}
                                </p>
                            </div>

                            {/* Bar Council Info */}
                            {lawyer.barCouncilNumber && (
                                <div className="mb-8">
                                    <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-primary-600" />
                                        Bar Council Registration
                                    </h2>
                                    <div className="bg-neutral-50 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-neutral-500">Registration Number</span>
                                                <p className="font-medium text-neutral-900">{lawyer.barCouncilNumber}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-neutral-500">State Bar Council</span>
                                                <p className="font-medium text-neutral-900">{lawyer.barCouncilState || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary-600" />
                                    Contact Information
                                </h2>
                                <div className="space-y-3">
                                    {lawyer.email && (
                                        <div className="flex items-center gap-3 text-neutral-700">
                                            <Mail className="w-4 h-4 text-neutral-400" />
                                            {lawyer.email}
                                        </div>
                                    )}
                                    {lawyer.phone && (
                                        <div className="flex items-center gap-3 text-neutral-700">
                                            <Phone className="w-4 h-4 text-neutral-400" />
                                            {lawyer.phone}
                                        </div>
                                    )}
                                    {lawyer.location && (
                                        <div className="flex items-center gap-3 text-neutral-700">
                                            <MapPin className="w-4 h-4 text-neutral-400" />
                                            {lawyer.location}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-200">
                                <Button
                                    onClick={handleBookConsultation}
                                    className="flex-1"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Book Video Consultation
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleStartChat}
                                    className="flex-1"
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Send Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

export default LawyerProfilePage
