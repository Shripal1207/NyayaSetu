import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Users, UserCheck, Clock, Shield, TrendingUp,
    Search, Filter, MoreVertical, Eye, Edit, Trash2,
    CheckCircle, XCircle, ChevronLeft, ChevronRight,
    LayoutDashboard, Scale, FileCheck, Settings
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Toast from '../components/ui/Toast'
import Modal from '../components/ui/Modal'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { useFirebase } from '../context/FirebaseContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const AdminDashboardPage = () => {
    const { currentUser } = useFirebase()
    const [activeTab, setActiveTab] = useState('dashboard')
    const [stats, setStats] = useState(null)
    const [users, setUsers] = useState([])
    const [lawyers, setLawyers] = useState([])
    const [pendingVerifications, setPendingVerifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('')
    const [userTypeFilter, setUserTypeFilter] = useState('')

    // Modals
    const [selectedUser, setSelectedUser] = useState(null)
    const [showUserModal, setShowUserModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showVerificationModal, setShowVerificationModal] = useState(false)
    const [selectedVerification, setSelectedVerification] = useState(null)
    const [rejectionReason, setRejectionReason] = useState('')

    useEffect(() => {
        if (currentUser?.uid) {
            fetchStats()
            fetchPendingVerifications()
        }
    }, [currentUser])

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers()
        } else if (activeTab === 'lawyers') {
            fetchLawyers()
        }
    }, [activeTab, currentPage, searchQuery, userTypeFilter])

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'x-user-id': currentUser?.uid
    })

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`, {
                headers: getHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: searchQuery,
                userType: userTypeFilter
            })
            const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
                headers: getHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setUsers(data.users)
                setTotalPages(data.pagination.pages)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const fetchLawyers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/lawyers`, {
                headers: getHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setLawyers(data.lawyers)
            }
        } catch (error) {
            console.error('Error fetching lawyers:', error)
        }
    }

    const fetchPendingVerifications = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/verifications`, {
                headers: getHeaders()
            })
            if (response.ok) {
                const data = await response.json()
                setPendingVerifications(data.verifications)
            }
        } catch (error) {
            console.error('Error fetching verifications:', error)
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return

        try {
            const response = await fetch(`${API_URL}/api/admin/users/${selectedUser._id}`, {
                method: 'DELETE',
                headers: getHeaders()
            })

            if (response.ok) {
                setToast({ show: true, message: 'User deleted successfully', type: 'success' })
                fetchUsers()
                fetchStats()
            } else {
                const data = await response.json()
                setToast({ show: true, message: data.error, type: 'error' })
            }
        } catch (error) {
            setToast({ show: true, message: 'Failed to delete user', type: 'error' })
        } finally {
            setShowDeleteModal(false)
            setSelectedUser(null)
        }
    }

    const handleApproveVerification = async (verification) => {
        try {
            const response = await fetch(`${API_URL}/api/verification/${verification._id}/approve`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ adminId: currentUser.uid })
            })

            if (response.ok) {
                setToast({ show: true, message: 'Verification approved!', type: 'success' })
                fetchPendingVerifications()
                fetchStats()
                fetchLawyers()
            }
        } catch (error) {
            setToast({ show: true, message: 'Failed to approve', type: 'error' })
        }
    }

    const handleRejectVerification = async () => {
        if (!selectedVerification || !rejectionReason.trim()) {
            setToast({ show: true, message: 'Please provide a rejection reason', type: 'error' })
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/verification/${selectedVerification._id}/reject`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({
                    adminId: currentUser.uid,
                    reason: rejectionReason
                })
            })

            if (response.ok) {
                setToast({ show: true, message: 'Verification rejected', type: 'success' })
                fetchPendingVerifications()
                fetchStats()
                setShowVerificationModal(false)
                setRejectionReason('')
            }
        } catch (error) {
            setToast({ show: true, message: 'Failed to reject', type: 'error' })
        }
    }

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-neutral-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-neutral-900">{value}</p>
                    {trend && (
                        <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                            <TrendingUp className="w-4 h-4" /> {trend}
                        </p>
                    )}
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
        </motion.div>
    )

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'lawyers', label: 'Lawyers', icon: Scale },
        { id: 'verifications', label: 'Verifications', icon: FileCheck, badge: pendingVerifications.length }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-100">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-100">
            <div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                            Admin Dashboard
                        </h1>
                        <p className="text-neutral-600">
                            Manage users, lawyers, and verification requests
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white text-neutral-700 hover:bg-neutral-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                    {tab.badge > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white text-primary-600' : 'bg-red-500 text-white'
                                            }`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && stats && (
                        <div className="space-y-8">
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Total Users"
                                    value={stats.totalUsers}
                                    icon={Users}
                                    color="bg-blue-500"
                                />
                                <StatCard
                                    title="Total Lawyers"
                                    value={stats.totalLawyers}
                                    icon={Scale}
                                    color="bg-purple-500"
                                />
                                <StatCard
                                    title="Verified Lawyers"
                                    value={stats.verifiedLawyers}
                                    icon={UserCheck}
                                    color="bg-green-500"
                                />
                                <StatCard
                                    title="Pending Verifications"
                                    value={stats.pendingVerifications}
                                    icon={Clock}
                                    color="bg-yellow-500"
                                />
                            </div>

                            {/* Recent Users */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Users</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {stats.recentUsers?.map((user) => (
                                            <div key={user._id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                                                        alt={user.name}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-neutral-900">{user.name}</p>
                                                        <p className="text-sm text-neutral-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.userType === 'admin' ? 'bg-red-100 text-red-700' :
                                                    user.userType === 'lawyer' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {user.userType}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <CardTitle>User Management</CardTitle>
                                    <div className="flex gap-3">
                                        <Input
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-64"
                                        />
                                        <Select
                                            value={userTypeFilter}
                                            onChange={(e) => setUserTypeFilter(e.target.value)}
                                            options={[
                                                { value: '', label: 'All Types' },
                                                { value: 'user', label: 'Users' },
                                                { value: 'lawyer', label: 'Lawyers' },
                                                { value: 'admin', label: 'Admins' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-neutral-200">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">User</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Email</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Type</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                                                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user._id} className="border-b border-neutral-100 hover:bg-neutral-50">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                                                                alt={user.name}
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                            <span className="font-medium">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-neutral-600">{user.email}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${user.userType === 'admin' ? 'bg-red-100 text-red-700' :
                                                            user.userType === 'lawyer' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {user.userType}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {user.verified ? (
                                                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                                                <CheckCircle className="w-4 h-4" /> Verified
                                                            </span>
                                                        ) : (
                                                            <span className="text-neutral-400 text-sm">Not verified</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user)
                                                                    setShowUserModal(true)
                                                                }}
                                                                className="p-1.5 hover:bg-neutral-100 rounded"
                                                            >
                                                                <Eye className="w-4 h-4 text-neutral-600" />
                                                            </button>
                                                            {user.userType !== 'admin' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedUser(user)
                                                                        setShowDeleteModal(true)
                                                                    }}
                                                                    className="p-1.5 hover:bg-red-50 rounded"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <p className="text-sm text-neutral-600">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lawyers Tab */}
                    {activeTab === 'lawyers' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Lawyer Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {lawyers.map((lawyer) => (
                                        <div key={lawyer._id} className="p-4 border border-neutral-200 rounded-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                                                    {lawyer.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-neutral-900">{lawyer.name}</p>
                                                    <p className="text-sm text-neutral-500">{lawyer.email}</p>
                                                </div>
                                                {lawyer.verificationStatus === 'verified' && (
                                                    <Shield className="w-5 h-5 text-green-600" />
                                                )}
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500">Bar Council:</span>
                                                    <span className="font-medium">{lawyer.barCouncilNumber || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500">Experience:</span>
                                                    <span className="font-medium">{lawyer.yearsOfExperience || 0} years</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-neutral-500">Status:</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${lawyer.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' :
                                                        lawyer.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-neutral-100 text-neutral-700'
                                                        }`}>
                                                        {lawyer.verificationStatus || 'unverified'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Verifications Tab */}
                    {activeTab === 'verifications' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Verifications ({pendingVerifications.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pendingVerifications.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                                        <p className="text-neutral-600">No pending verifications</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingVerifications.map((verification) => (
                                            <div key={verification._id} className="p-4 border border-neutral-200 rounded-xl flex flex-col md:flex-row gap-4">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={verification.barCouncilIdCardUrl}
                                                        alt="ID Card"
                                                        className="w-48 h-32 object-cover rounded-lg border cursor-pointer"
                                                        onClick={() => window.open(verification.barCouncilIdCardUrl, '_blank')}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-neutral-900">{verification.name}</h3>
                                                            <p className="text-sm text-neutral-500">{verification.email}</p>
                                                        </div>
                                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                                            Pending
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                                        <div>
                                                            <span className="text-neutral-500">Bar Council #:</span>
                                                            <span className="ml-2 font-medium">{verification.barCouncilNumber}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-neutral-500">State:</span>
                                                            <span className="ml-2 font-medium">{verification.barCouncilState}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-neutral-500">Submitted:</span>
                                                            <span className="ml-2">{new Date(verification.verificationSubmittedAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-neutral-500">Phone:</span>
                                                            <span className="ml-2">{verification.phone || 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleApproveVerification(verification)}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                setSelectedVerification(verification)
                                                                setShowVerificationModal(true)
                                                            }}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* User Details Modal */}
            <Modal
                isOpen={showUserModal}
                onClose={() => {
                    setShowUserModal(false)
                    setSelectedUser(null)
                }}
                title="User Details"
                size="md"
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={selectedUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`}
                                alt={selectedUser.name}
                                className="w-16 h-16 rounded-full"
                            />
                            <div>
                                <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                <p className="text-neutral-500">{selectedUser.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-neutral-50 rounded-lg">
                                <span className="text-neutral-500">Type:</span>
                                <span className="ml-2 font-medium">{selectedUser.userType}</span>
                            </div>
                            <div className="p-3 bg-neutral-50 rounded-lg">
                                <span className="text-neutral-500">Phone:</span>
                                <span className="ml-2 font-medium">{selectedUser.phone || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-neutral-50 rounded-lg">
                                <span className="text-neutral-500">Location:</span>
                                <span className="ml-2 font-medium">{selectedUser.location || 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-neutral-50 rounded-lg">
                                <span className="text-neutral-500">Joined:</span>
                                <span className="ml-2 font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setSelectedUser(null)
                }}
                title="Delete User"
                size="sm"
            >
                <div className="text-center">
                    <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-neutral-700 mb-6">
                        Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleDeleteUser}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Rejection Reason Modal */}
            <Modal
                isOpen={showVerificationModal}
                onClose={() => {
                    setShowVerificationModal(false)
                    setSelectedVerification(null)
                    setRejectionReason('')
                }}
                title="Reject Verification"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-neutral-600">
                        Please provide a reason for rejecting the verification for <strong>{selectedVerification?.name}</strong>.
                    </p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={4}
                    />
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setShowVerificationModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleRejectVerification}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            Reject Verification
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
        </div>
    )
}

export default AdminDashboardPage
