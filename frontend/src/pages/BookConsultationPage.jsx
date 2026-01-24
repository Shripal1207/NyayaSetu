import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Calendar, Clock, User, Star, MapPin, Phone, Mail,
    ChevronLeft, ChevronRight, Check, AlertCircle
} from 'lucide-react'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { useFirebase } from '../context/FirebaseContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const BookConsultationPage = () => {
    const { lawyerId } = useParams()
    const navigate = useNavigate()
    const { currentUser } = useFirebase()

    const [lawyer, setLawyer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [slots, setSlots] = useState([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [selectedDuration, setSelectedDuration] = useState(30)
    const [notes, setNotes] = useState('')
    const [booking, setBooking] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
    const [isManualTime, setIsManualTime] = useState(false)
    const [manualTime, setManualTime] = useState('')

    const durations = [
        { value: 15, label: '15 min', price: '¼ of hourly' },
        { value: 30, label: '30 min', price: '½ of hourly' },
        { value: 45, label: '45 min', price: '¾ of hourly' },
        { value: 60, label: '60 min', price: 'Full hourly' }
    ]

    useEffect(() => {
        fetchLawyer()
    }, [lawyerId])

    useEffect(() => {
        if (lawyer) {
            fetchSlots()
        }
    }, [lawyer, selectedDate])

    const fetchLawyer = async () => {
        try {
            const response = await fetch(`${API_URL}/api/users/by-id/${lawyerId}`)
            if (response.ok) {
                const data = await response.json()
                setLawyer(data)
            }
        } catch (error) {
            console.error('Error fetching lawyer:', error)
            setToast({ show: true, message: 'Failed to load lawyer details', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const fetchSlots = async () => {
        try {
            const dateStr = selectedDate.toISOString().split('T')[0]
            const response = await fetch(`${API_URL}/api/consultations/slots/${lawyerId}?date=${dateStr}`)
            if (response.ok) {
                const data = await response.json()
                setSlots(data.slots || [])
            }
        } catch (error) {
            console.error('Error fetching slots:', error)
        }
    }

    const calculateFee = () => {
        if (!lawyer?.consultationFees) return 0
        return Math.round((lawyer.consultationFees / 60) * selectedDuration)
    }

    const handleBooking = async () => {
        if (!selectedSlot) {
            setToast({ show: true, message: 'Please select a time slot', type: 'error' })
            return
        }

        setBooking(true)

        try {
            const response = await fetch(`${API_URL}/api/consultations/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser?.uid
                },
                body: JSON.stringify({
                    lawyerId: lawyer._id,
                    scheduledAt: selectedSlot,
                    duration: selectedDuration,
                    clientNotes: notes
                })
            })

            const data = await response.json()

            if (response.ok) {
                setToast({ show: true, message: 'Consultation booked successfully!', type: 'success' })
                setTimeout(() => {
                    navigate('/consultations')
                }, 1500)
            } else {
                setToast({ show: true, message: data.error || 'Booking failed', type: 'error' })
            }
        } catch (error) {
            console.error('Booking error:', error)
            setToast({ show: true, message: 'Failed to book consultation', type: 'error' })
        } finally {
            setBooking(false)
        }
    }

    const changeDate = (days) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + days)
        setSelectedDate(newDate)
        setSelectedSlot(null)
    }

    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </div>
        )
    }

    if (!lawyer) {
        return (
            <div className="min-h-screen bg-neutral-50">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Lawyer Not Found</h2>
                    <p className="text-neutral-600 mb-6">This lawyer profile doesn't exist or has been removed.</p>
                    <Button onClick={() => navigate('/lawyers')}>Find Other Lawyers</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                            Book Video Consultation
                        </h1>
                        <p className="text-neutral-600">
                            Schedule a video call with your lawyer
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Lawyer Info */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-24">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
                                            {lawyer.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-neutral-900">{lawyer.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                {lawyer.rating || 'New'}
                                                <span>•</span>
                                                <span>{lawyer.yearsOfExperience || 0} years</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        {lawyer.practiceAreas?.length > 0 && (
                                            <div>
                                                <p className="text-neutral-500 mb-1">Practice Areas</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {lawyer.practiceAreas.map((area, i) => (
                                                        <span key={i} className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs">
                                                            {area}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {lawyer.location && (
                                            <div className="flex items-center gap-2 text-neutral-600">
                                                <MapPin className="w-4 h-4" />
                                                {lawyer.location}
                                            </div>
                                        )}

                                        <div className="pt-3 border-t">
                                            <p className="text-neutral-500 mb-1">Consultation Fee</p>
                                            <p className="text-2xl font-bold text-primary-600">
                                                ₹{lawyer.consultationFees || 1000}/hr
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Booking Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Date Selection */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Select Date</CardTitle>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => changeDate(-1)}
                                                disabled={selectedDate <= new Date()}
                                                className="p-2 hover:bg-neutral-100 rounded-lg disabled:opacity-50"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => changeDate(1)}
                                                className="p-2 hover:bg-neutral-100 rounded-lg"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary-600" />
                                        {formatDate(selectedDate)}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Time Slots */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Select Time</CardTitle>
                                        <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isManualTime}
                                                onChange={(e) => {
                                                    setIsManualTime(e.target.checked)
                                                    setSelectedSlot(null)
                                                    setManualTime('')
                                                }}
                                                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            Manual Input
                                        </label>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isManualTime ? (
                                        <div className="flex flex-col items-center py-6 gap-4">
                                            <p className="text-sm text-neutral-500">
                                                Manually select a time for testing or flexible scheduling.
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-5 h-5 text-neutral-400" />
                                                <input
                                                    type="time"
                                                    value={manualTime}
                                                    onChange={(e) => {
                                                        const timeStr = e.target.value
                                                        setManualTime(timeStr)
                                                        if (timeStr) {
                                                            const [hours, minutes] = timeStr.split(':')
                                                            const newDate = new Date(selectedDate)
                                                            newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                                                            setSelectedSlot(newDate.toISOString())
                                                        } else {
                                                            setSelectedSlot(null)
                                                        }
                                                    }}
                                                    className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-lg"
                                                />
                                            </div>
                                            {selectedSlot && (
                                                <p className="text-sm text-primary-600 font-medium">
                                                    Selected: {new Date(selectedSlot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        slots.length === 0 ? (
                                            <p className="text-neutral-500 text-center py-8">
                                                No available slots for this date
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                                {slots.map((slot, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => slot.available && setSelectedSlot(slot.time)}
                                                        disabled={!slot.available}
                                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedSlot === slot.time
                                                            ? 'bg-primary-600 text-white'
                                                            : slot.available
                                                                ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                                                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed line-through'
                                                            }`}
                                                    >
                                                        {formatTime(slot.time)}
                                                    </button>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </CardContent>
                            </Card>

                            {/* Duration Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Duration</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {durations.map((duration) => (
                                            <button
                                                key={duration.value}
                                                onClick={() => setSelectedDuration(duration.value)}
                                                className={`p-4 rounded-lg border-2 transition-all ${selectedDuration === duration.value
                                                    ? 'border-primary-600 bg-primary-50'
                                                    : 'border-neutral-200 hover:border-neutral-300'
                                                    }`}
                                            >
                                                <p className="font-semibold text-neutral-900">{duration.label}</p>
                                                <p className="text-sm text-neutral-500">{duration.price}</p>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Additional Notes (Optional)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Briefly describe your legal issue or questions..."
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                        rows={4}
                                        maxLength={1000}
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">{notes.length}/1000 characters</p>
                                </CardContent>
                            </Card>

                            {/* Booking Summary */}
                            <Card className="bg-primary-50 border-primary-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-lg text-neutral-900">Booking Summary</h3>
                                        <p className="text-2xl font-bold text-primary-600">₹{calculateFee()}</p>
                                    </div>

                                    <div className="space-y-2 text-sm mb-6">
                                        <div className="flex justify-between">
                                            <span className="text-neutral-600">Lawyer</span>
                                            <span className="font-medium">{lawyer.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-600">Date</span>
                                            <span className="font-medium">{formatDate(selectedDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-600">Time</span>
                                            <span className="font-medium">
                                                {selectedSlot ? formatTime(selectedSlot) : 'Not selected'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-600">Duration</span>
                                            <span className="font-medium">{selectedDuration} minutes</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handleBooking}
                                        isLoading={booking}
                                        disabled={!selectedSlot || booking}
                                        className="w-full"
                                    >
                                        <Check className="w-5 h-5 mr-2" />
                                        Confirm Booking
                                    </Button>
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

export default BookConsultationPage
