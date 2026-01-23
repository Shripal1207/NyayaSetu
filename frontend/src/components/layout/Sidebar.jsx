import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Home, MessageSquare, FileText, Users, Video, BookOpen,
    Shield, Settings, LogOut, Menu, X, ChevronRight,
    UserCheck, LayoutDashboard, Scale, Bell, User, CalendarDays
} from 'lucide-react'
import { useFirebase } from '../../context/FirebaseContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const Sidebar = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { currentUser, logout } = useFirebase()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [notificationCount, setNotificationCount] = useState(0)

    // Fetch notification counts (unread messages + upcoming consultations starting soon)
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!currentUser?.uid) return

            try {
                // Fetch unread message count
                const msgResponse = await fetch(`${API_URL}/api/messages/conversations`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': currentUser.uid
                    }
                })
                let unreadMessages = 0
                if (msgResponse.ok) {
                    const msgData = await msgResponse.json()
                    unreadMessages = (msgData.conversations || []).reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
                }

                // Fetch upcoming consultations count (within next hour)
                const consultResponse = await fetch(`${API_URL}/api/consultations/my`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': currentUser.uid
                    }
                })
                let upcomingCount = 0
                if (consultResponse.ok) {
                    const consultData = await consultResponse.json()
                    const now = new Date()
                    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
                    upcomingCount = (consultData.upcoming || []).filter(c => {
                        const scheduledTime = new Date(c.scheduledAt)
                        return scheduledTime <= oneHourLater && scheduledTime >= now
                    }).length
                }

                setNotificationCount(unreadMessages + upcomingCount)
            } catch {
                // Silently fail - notifications are not critical
                // This prevents console spam when API is temporarily unavailable
            }
        }

        fetchNotifications()
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [currentUser])

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/auth')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    // Define navigation items based on user type
    const getNavItems = () => {
        const commonItems = [
            { name: 'Home', path: '/', icon: Home },
        ]

        const userItems = [
            { name: 'NyaySetu', path: '/chat', icon: MessageSquare, description: 'AI Legal Assistant' },
            { name: 'NyayMarma', path: '/analyze', icon: FileText, description: 'Document Analyzer' },
            { name: 'NyayBandhu', path: '/lawyers', icon: Users, description: 'Find Lawyers' },
            { name: 'Consultations', path: '/consultations', icon: Video, description: 'Messages & Video Calls', badge: notificationCount },
            { name: 'Legal Dictionary', path: '/dictionary', icon: BookOpen },
        ]

        const lawyerItems = [
            { name: 'NyaySetu', path: '/chat', icon: MessageSquare, description: 'AI Legal Assistant' },
            { name: 'NyayMarma', path: '/analyze', icon: FileText, description: 'Document Analyzer' },
            { name: 'Manage Meetings', path: '/manage-meetings', icon: CalendarDays, description: 'Schedule & Track' },
            { name: 'Consultations', path: '/consultations', icon: Video, description: 'Messages & Video Calls', badge: notificationCount },
            { name: 'Verification', path: '/verification', icon: UserCheck, description: 'Verify Credentials' },
            { name: 'Legal Dictionary', path: '/dictionary', icon: BookOpen },
        ]

        const adminItems = [
            { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, description: 'Admin Panel' },
            { name: 'NyaySetu', path: '/chat', icon: MessageSquare },
            { name: 'NyayMarma', path: '/analyze', icon: FileText },
            { name: 'NyayBandhu', path: '/lawyers', icon: Users },
            { name: 'Consultations', path: '/consultations', icon: Video, description: 'Messages & Video Calls', badge: notificationCount },
            { name: 'Legal Dictionary', path: '/dictionary', icon: BookOpen },
        ]

        // Determine user type
        const userType = currentUser?.userType || 'client'

        if (userType === 'admin') {
            return [...commonItems, ...adminItems]
        } else if (userType === 'lawyer') {
            return [...commonItems, ...lawyerItems]
        } else {
            return [...commonItems, ...userItems]
        }
    }

    const navItems = getNavItems()

    const isActivePath = (path) => location.pathname === path

    const NavItem = ({ item }) => {
        const Icon = item.icon
        const isActive = isActivePath(item.path)

        return (
            <Link
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
            >
                <div className="relative">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-primary-600'}`} />
                    {item.badge > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                            {item.badge > 9 ? '9+' : item.badge}
                        </span>
                    )}
                </div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex-1 min-w-0"
                        >
                            <p className={`font-medium truncate ${isActive ? 'text-white' : ''}`}>{item.name}</p>
                            {item.description && !isCollapsed && (
                                <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-neutral-400'}`}>
                                    {item.description}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                {isActive && !isCollapsed && (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                )}
            </Link>
        )
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-neutral-200">
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
                        <Scale className="w-6 h-6 text-white" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                            >
                                <h1 className="font-display font-bold text-xl text-neutral-900">LegalNexus</h1>
                                <p className="text-xs text-neutral-500">Justice Made Accessible</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* User Type Badge */}
            {currentUser && !isCollapsed && (
                <div className="px-4 py-3">
                    <div className={`px-3 py-2 rounded-lg text-center text-sm font-medium ${currentUser.userType === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : currentUser.userType === 'lawyer'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                        {currentUser.userType === 'admin' ? 'Admin' :
                            currentUser.userType === 'lawyer' ? 'Advocate' : 'Client'}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-neutral-200 space-y-1">
                {currentUser ? (
                    <>
                        <Link
                            to="/profile"
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActivePath('/profile')
                                ? 'bg-primary-600 text-white'
                                : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{currentUser.displayName || 'User'}</p>
                                    <p className="text-xs truncate opacity-70">{currentUser.email}</p>
                                </div>
                            )}
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="font-medium">Sign Out</span>}
                        </button>
                    </>
                ) : (
                    <Link
                        to="/auth"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all"
                    >
                        <User className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium">Sign In</span>}
                    </Link>
                )}
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center p-3 border-t border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
            >
                <ChevronRight className={`w-5 h-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>
        </div>
    )

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display font-bold text-lg">LegalNexus</span>
                </Link>
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 hover:bg-neutral-100 rounded-lg"
                >
                    {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl"
                        >
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 280 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-neutral-200 z-40"
            >
                <SidebarContent />
            </motion.aside>
        </>
    )
}

export default Sidebar
