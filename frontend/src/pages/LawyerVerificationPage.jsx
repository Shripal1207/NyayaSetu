import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Shield } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Toast from '../components/ui/Toast'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
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

const LawyerVerificationPage = () => {
    const { currentUser } = useFirebase()
    const [verificationStatus, setVerificationStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        stateCode: '',
        enrollmentNumber: '',
        enrollmentYear: '',
        idCardImage: null,
        idCardPreview: null
    })

    useEffect(() => {
        if (currentUser?.uid) {
            fetchVerificationStatus()
        }
    }, [currentUser])

    const fetchVerificationStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/api/verification/status/${currentUser.uid}`)
            const data = await response.json()

            if (response.ok && data.verificationStatus) {
                setVerificationStatus(data)
            } else {
                // User not found or error - set default unverified status
                setVerificationStatus({ verificationStatus: 'unverified' })
            }
        } catch (error) {
            console.error('Error fetching verification status:', error)
            setVerificationStatus({ verificationStatus: 'unverified' })
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            setToast({ show: true, message: 'Only JPG, PNG, and WebP images are allowed', type: 'error' })
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setToast({ show: true, message: 'Image size must be less than 5MB', type: 'error' })
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                idCardImage: reader.result,
                idCardPreview: reader.result
            }))
        }
        reader.readAsDataURL(file)
    }

    const validateForm = () => {
        if (!formData.stateCode) {
            setToast({ show: true, message: 'Please select your State Bar Council', type: 'error' })
            return false
        }
        if (!formData.enrollmentNumber || formData.enrollmentNumber.length < 4) {
            setToast({ show: true, message: 'Please enter a valid enrollment number', type: 'error' })
            return false
        }
        if (!formData.enrollmentYear || formData.enrollmentYear.length !== 4) {
            setToast({ show: true, message: 'Please enter a valid enrollment year (YYYY)', type: 'error' })
            return false
        }
        if (!formData.idCardImage) {
            setToast({ show: true, message: 'Please upload your Bar Council ID card', type: 'error' })
            return false
        }
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) return

        setSubmitting(true)

        const barCouncilNumber = `${formData.stateCode}/${formData.enrollmentNumber.padStart(5, '0')}/${formData.enrollmentYear}`

        try {
            const response = await fetch(`${API_URL}/api/verification/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    barCouncilNumber,
                    barCouncilState: formData.stateCode,
                    idCardImage: formData.idCardImage
                })
            })

            const data = await response.json()

            if (response.ok) {
                setToast({ show: true, message: 'Verification submitted successfully!', type: 'success' })
                fetchVerificationStatus()
            } else {
                setToast({ show: true, message: data.error || 'Failed to submit verification', type: 'error' })
            }
        } catch (error) {
            console.error('Submit error:', error)
            setToast({ show: true, message: 'Failed to submit verification', type: 'error' })
        } finally {
            setSubmitting(false)
        }
    }

    const renderStatusBadge = () => {
        const status = verificationStatus?.verificationStatus

        const badges = {
            unverified: { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50', label: 'Not Verified' },
            pending: { icon: Clock, color: 'text-blue-600 bg-blue-50', label: 'Pending Review' },
            verified: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Verified' },
            rejected: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Rejected' }
        }

        const badge = badges[status] || badges.unverified
        const Icon = badge.icon

        return (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${badge.color}`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{badge.label}</span>
            </div>
        )
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

    return (
        <div className="min-h-screen bg-neutral-50">
            <div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                            Lawyer Verification
                        </h1>
                        <p className="text-neutral-600">
                            Verify your Bar Council credentials to become a verified lawyer on NyayBandhu
                        </p>
                    </div>

                    {/* Current Status Card */}
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Verification Status</CardTitle>
                                {renderStatusBadge()}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {verificationStatus?.verificationStatus === 'verified' && (
                                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                                    <Shield className="w-12 h-12 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-green-900">You are a verified lawyer!</p>
                                        <p className="text-green-700 text-sm">
                                            Bar Council: {verificationStatus.barCouncilNumber}
                                        </p>
                                        <p className="text-green-600 text-xs mt-1">
                                            Verified on {new Date(verificationStatus.reviewedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {verificationStatus?.verificationStatus === 'pending' && (
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                    <Clock className="w-12 h-12 text-blue-600" />
                                    <div>
                                        <p className="font-semibold text-blue-900">Verification under review</p>
                                        <p className="text-blue-700 text-sm">
                                            Bar Council: {verificationStatus.barCouncilNumber}
                                        </p>
                                        <p className="text-blue-600 text-xs mt-1">
                                            Submitted on {new Date(verificationStatus.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {verificationStatus?.verificationStatus === 'rejected' && (
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-4 mb-3">
                                        <XCircle className="w-12 h-12 text-red-600" />
                                        <div>
                                            <p className="font-semibold text-red-900">Verification rejected</p>
                                            <p className="text-red-700 text-sm">
                                                Your previous submission was not approved
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-red-100 rounded text-sm text-red-800">
                                        <strong>Reason:</strong> {verificationStatus.rejectionReason}
                                    </div>
                                    <p className="text-red-600 text-xs mt-2">
                                        You can submit a new verification request below.
                                    </p>
                                </div>
                            )}

                            {(!verificationStatus?.verificationStatus || verificationStatus?.verificationStatus === 'unverified') && (
                                <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                                    <AlertTriangle className="w-12 h-12 text-yellow-600" />
                                    <div>
                                        <p className="font-semibold text-yellow-900">Not yet verified</p>
                                        <p className="text-yellow-700 text-sm">
                                            Submit your Bar Council credentials below to get verified
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Verification Form */}
                    {(verificationStatus?.verificationStatus !== 'verified' &&
                        verificationStatus?.verificationStatus !== 'pending') && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Submit Verification</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <Select
                                                label="State Bar Council"
                                                value={formData.stateCode}
                                                onChange={(e) => handleInputChange('stateCode', e.target.value)}
                                                options={[{ value: '', label: 'Select State' }, ...STATE_BAR_COUNCILS]}
                                                required
                                            />
                                            <Input
                                                label="Enrollment Number"
                                                placeholder="e.g., 03207"
                                                value={formData.enrollmentNumber}
                                                onChange={(e) => handleInputChange('enrollmentNumber', e.target.value.replace(/\D/g, ''))}
                                                maxLength={6}
                                                required
                                            />
                                            <Input
                                                label="Enrollment Year"
                                                placeholder="e.g., 2015"
                                                value={formData.enrollmentYear}
                                                onChange={(e) => handleInputChange('enrollmentYear', e.target.value.replace(/\D/g, ''))}
                                                maxLength={4}
                                                required
                                            />
                                        </div>

                                        {formData.stateCode && formData.enrollmentNumber && formData.enrollmentYear && (
                                            <div className="p-3 bg-primary-50 rounded-lg">
                                                <p className="text-sm text-primary-800">
                                                    <strong>Bar Council Number:</strong>{' '}
                                                    {formData.stateCode}/{formData.enrollmentNumber.padStart(5, '0')}/{formData.enrollmentYear}
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                                Bar Council ID Card <span className="text-red-500">*</span>
                                            </label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
                                            >
                                                {formData.idCardPreview ? (
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setFormData(prev => ({ ...prev, idCardImage: null, idCardPreview: null }))
                                                                if (fileInputRef.current) fileInputRef.current.value = ''
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors z-10"
                                                            title="Remove photo"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                        <img
                                                            src={formData.idCardPreview}
                                                            alt="ID Card Preview"
                                                            className="max-h-48 mx-auto rounded-lg"
                                                            onClick={() => fileInputRef.current?.click()} // Keep click-to-change behavior on image
                                                        />
                                                        <p className="text-sm text-neutral-600 mt-2">Click image to change</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                                                        <p className="text-neutral-700 font-medium">Click to upload ID card</p>
                                                        <p className="text-sm text-neutral-500 mt-1">
                                                            JPG, PNG or WebP (Max 5MB)
                                                        </p>
                                                    </>
                                                )}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-4 bg-neutral-100 rounded-lg">
                                            <FileText className="w-5 h-5 text-neutral-600 mt-0.5" />
                                            <div className="text-sm text-neutral-600">
                                                <p className="font-medium mb-1">Verification Note:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Your ID card will be stored securely</li>
                                                    <li>Verification is instant upon submission</li>
                                                    <li>You will immediately appear as a verified consultant on NyayBandhu</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            isLoading={submitting}
                                            className="w-full"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Verification'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
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

export default LawyerVerificationPage
