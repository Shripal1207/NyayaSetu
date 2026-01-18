import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Clock, User, Video, MessageSquare, ChevronLeft, ChevronRight,
    Plus, X, Check, AlertCircle, Bell, Filter, Trash2, Edit2
} from 'lucide-react'
import Button from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import { useFirebase } from '../context/FirebaseContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const ManageMeetingsPage = () => {
    const { currentUser } = useFirebase()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [consultations, setConsultations] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState('day')
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

    // Reminders state
    const [reminders, setReminders] = useState([])
    const [showReminderModal, setShowReminderModal] = useState(false)
    const [reminderForm, setReminderForm] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        priority: 'medium'
    })
    const [editingReminderId, setEditingReminderId] = useState(null)

    // Time slots for the day (9 AM to 6 PM)
    const timeSlots = []
    for (let hour = 9; hour <= 18; hour++) {
        timeSlots.push({ hour, label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}` })
        if (hour < 18) {
            timeSlots.push({ hour: hour + 0.5, label: `${hour > 12 ? hour - 12 : hour}:30 ${hour >= 12 ? 'PM' : 'AM'}` })
        }
    }

    // Load reminders from localStorage
    useEffect(() => {
        if (currentUser?.uid) {
            const savedReminders = localStorage.getItem(`reminders_${currentUser.uid}`)
            if (savedReminders) {
                setReminders(JSON.parse(savedReminders))
            }
        }
    }, [currentUser])

    // Save reminders to localStorage
    useEffect(() => {
        if (currentUser?.uid && reminders.length >= 0) {
            localStorage.setItem(`reminders_${currentUser.uid}`, JSON.stringify(reminders))
        }
    }, [reminders, currentUser])

    useEffect(() => {
        fetchConsultations()
    }, [selectedDate, currentUser])

    const fetchConsultations = async () => {
        if (!currentUser?.uid) return
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/consultations/my`, {
                headers: { 'x-user-id': currentUser.uid }
            })
            if (response.ok) {
                const data = await response.json()
                setConsultations([...(data.upcoming || []), ...(data.past || [])])
            }
        } catch (error) {
            console.error('Error fetching consultations:', error)
        } finally {
            setLoading(false)
        }
    }

    const getConsultationsForDate = (date) => {
        return consultations.filter(c => {
            const consultDate = new Date(c.scheduledAt)
            return consultDate.toDateString() === date.toDateString()
        })
    }

    const getRemindersForDate = (date) => {
        return reminders.filter(r => {
            const reminderDate = new Date(r.date)
            return reminderDate.toDateString() === date.toDateString()
        })
    }

    const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    const changeDate = (days) => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + days)
        setSelectedDate(newDate)
    }

    const getWeekDays = () => {
        const days = []
        const startOfWeek = new Date(selectedDate)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek)
            day.setDate(day.getDate() + i)
            days.push(day)
        }
        return days
    }

    const isToday = (date) => {
        return date.toDateString() === new Date().toDateString()
    }

    const isSelected = (date) => {
        return date.toDateString() === selectedDate.toDateString()
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 border-blue-500 text-blue-700'
            case 'ongoing': return 'bg-green-100 border-green-500 text-green-700'
            case 'completed': return 'bg-gray-100 border-gray-500 text-gray-700'
            case 'cancelled': return 'bg-red-100 border-red-500 text-red-700'
            default: return 'bg-neutral-100 border-neutral-500 text-neutral-700'
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 border-red-500 text-red-700'
            case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-700'
            case 'low': return 'bg-green-100 border-green-500 text-green-700'
            default: return 'bg-neutral-100 border-neutral-500 text-neutral-700'
        }
    }

    // Reminder handlers
    const handleCreateReminder = () => {
        if (!reminderForm.title.trim()) {
            setToast({ show: true, message: 'Please enter a reminder title', type: 'warning' })
            return
        }

        const newReminder = {
            id: editingReminderId || Date.now().toString(),
            ...reminderForm,
            createdAt: new Date().toISOString(),
            completed: false
        }

        if (editingReminderId) {
            setReminders(prev => prev.map(r => r.id === editingReminderId ? newReminder : r))
            setToast({ show: true, message: 'Reminder updated!', type: 'success' })
        } else {
            setReminders(prev => [...prev, newReminder])
            setToast({ show: true, message: 'Reminder created!', type: 'success' })
        }

        resetReminderForm()
        setShowReminderModal(false)
    }

    const handleEditReminder = (reminder) => {
        setReminderForm({
            title: reminder.title,
            description: reminder.description || '',
            date: reminder.date,
            time: reminder.time,
            priority: reminder.priority
        })
        setEditingReminderId(reminder.id)
        setShowReminderModal(true)
    }

    const handleDeleteReminder = (id) => {
        setReminders(prev => prev.filter(r => r.id !== id))
        setToast({ show: true, message: 'Reminder deleted', type: 'info' })
    }

    const handleToggleComplete = (id) => {
        setReminders(prev => prev.map(r =>
            r.id === id ? { ...r, completed: !r.completed } : r
        ))
    }

    const resetReminderForm = () => {
        setReminderForm({
            title: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            time: '09:00',
            priority: 'medium'
        })
        setEditingReminderId(null)
    }

    const todayConsultations = getConsultationsForDate(selectedDate)
    const todayReminders = getRemindersForDate(selectedDate)
    const upcomingToday = todayConsultations.filter(c =>
        c.status === 'scheduled' && new Date(c.scheduledAt) > new Date()
    )
    const pendingReminders = reminders.filter(r => !r.completed && new Date(r.date) >= new Date(new Date().toDateString()))

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                            Manage Meetings
                        </h1>
                        <p className="text-neutral-600">
                            Schedule, track, and manage your consultations & reminders
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedDate(new Date())}
                        >
                            Today
                        </Button>
                        <Button
                            onClick={() => {
                                resetReminderForm()
                                setShowReminderModal(true)
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Reminder
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        {upcomingToday.length}
                                    </p>
                                    <p className="text-sm text-neutral-500">Today's Meetings</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                    <Video className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        {consultations.filter(c => c.status === 'scheduled').length}
                                    </p>
                                    <p className="text-sm text-neutral-500">Upcoming Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        {consultations.filter(c => c.status === 'completed').length}
                                    </p>
                                    <p className="text-sm text-neutral-500">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                    <Bell className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        {pendingReminders.length}
                                    </p>
                                    <p className="text-sm text-neutral-500">Pending Reminders</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        {reminders.filter(r => r.priority === 'high' && !r.completed).length}
                                    </p>
                                    <p className="text-sm text-neutral-500">High Priority</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Week View Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">Week View</CardTitle>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => changeDate(-7)}
                                            className="p-1 hover:bg-neutral-100 rounded"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => changeDate(7)}
                                            className="p-1 hover:bg-neutral-100 rounded"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-2">
                                <div className="space-y-1">
                                    {getWeekDays().map((day, i) => {
                                        const dayConsultations = getConsultationsForDate(day)
                                        const dayReminders = getRemindersForDate(day)
                                        const totalItems = dayConsultations.length + dayReminders.length
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedDate(day)}
                                                className={`w-full p-3 rounded-lg text-left transition-all ${isSelected(day)
                                                    ? 'bg-primary-600 text-white'
                                                    : isToday(day)
                                                        ? 'bg-primary-50 text-primary-700'
                                                        : 'hover:bg-neutral-100'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className={`text-xs ${isSelected(day) ? 'text-white/70' : 'text-neutral-500'}`}>
                                                            {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                                                        </p>
                                                        <p className="font-semibold">
                                                            {day.getDate()}
                                                        </p>
                                                    </div>
                                                    {totalItems > 0 && (
                                                        <span className={`text-xs px-2 py-1 rounded-full ${isSelected(day)
                                                            ? 'bg-white/20'
                                                            : 'bg-primary-100 text-primary-700'
                                                            }`}>
                                                            {totalItems}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Reminders List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Upcoming Reminders</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
                                {pendingReminders.length === 0 ? (
                                    <p className="text-sm text-neutral-500 text-center py-4">
                                        No pending reminders
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {pendingReminders.slice(0, 5).map(reminder => (
                                            <div
                                                key={reminder.id}
                                                className={`p-2 rounded-lg border-l-4 ${getPriorityColor(reminder.priority)} text-sm cursor-pointer hover:opacity-80`}
                                                onClick={() => handleEditReminder(reminder)}
                                            >
                                                <p className="font-medium truncate">{reminder.title}</p>
                                                <p className="text-xs opacity-70">
                                                    {new Date(reminder.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • {reminder.time}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Day Schedule */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Day Header */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => changeDate(-1)}
                                            className="p-2 hover:bg-neutral-100 rounded-lg"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <CardTitle>{formatDate(selectedDate)}</CardTitle>
                                        <button
                                            onClick={() => changeDate(1)}
                                            className="p-2 hover:bg-neutral-100 rounded-lg"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {isToday(selectedDate) && (
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                            Today
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Reminders for the day */}
                                {todayReminders.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                                            <Bell className="w-4 h-4" />
                                            Reminders ({todayReminders.length})
                                        </h3>
                                        <div className="space-y-2">
                                            {todayReminders.map(reminder => (
                                                <motion.div
                                                    key={reminder.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-3 rounded-xl border-l-4 ${getPriorityColor(reminder.priority)} ${reminder.completed ? 'opacity-50' : ''}`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <button
                                                                onClick={() => handleToggleComplete(reminder.id)}
                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${reminder.completed
                                                                        ? 'bg-green-500 border-green-500 text-white'
                                                                        : 'border-neutral-300 hover:border-primary-500'
                                                                    }`}
                                                            >
                                                                {reminder.completed && <Check className="w-3 h-3" />}
                                                            </button>
                                                            <div>
                                                                <p className={`font-medium ${reminder.completed ? 'line-through' : ''}`}>
                                                                    {reminder.title}
                                                                </p>
                                                                {reminder.description && (
                                                                    <p className="text-sm text-neutral-600 mt-1">
                                                                        {reminder.description}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-neutral-500 mt-1">
                                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                                    {reminder.time} •
                                                                    <span className="capitalize ml-1">{reminder.priority} priority</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleEditReminder(reminder)}
                                                                className="p-1.5 hover:bg-white/50 rounded"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-neutral-500" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteReminder(reminder.id)}
                                                                className="p-1.5 hover:bg-white/50 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Consultations */}
                                <h3 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                                    <Video className="w-4 h-4" />
                                    Consultations ({todayConsultations.length})
                                </h3>
                                {todayConsultations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                        <p className="text-neutral-600">
                                            No consultations scheduled for this day
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {todayConsultations
                                            .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
                                            .map((consultation) => {
                                                const clientName = consultation.clientId?.name || 'Client'
                                                const scheduledTime = new Date(consultation.scheduledAt)
                                                const now = new Date()
                                                const isStartingSoon = scheduledTime > now &&
                                                    (scheduledTime - now) <= 30 * 60 * 1000

                                                return (
                                                    <motion.div
                                                        key={consultation._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`p-4 rounded-xl border-l-4 ${getStatusColor(consultation.status)}`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start gap-4">
                                                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-lg font-bold border">
                                                                    {clientName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-neutral-900">
                                                                        {clientName}
                                                                    </h4>
                                                                    <div className="flex items-center gap-3 text-sm text-neutral-600 mt-1">
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="w-4 h-4" />
                                                                            {formatTime(consultation.scheduledAt)}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>{consultation.duration} min</span>
                                                                        <span>•</span>
                                                                        <span className="capitalize">{consultation.status}</span>
                                                                    </div>
                                                                    {consultation.clientNotes && (
                                                                        <p className="text-sm text-neutral-500 mt-2 line-clamp-1">
                                                                            "{consultation.clientNotes}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isStartingSoon && consultation.status === 'scheduled' && (
                                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium animate-pulse">
                                                                        Starting Soon!
                                                                    </span>
                                                                )}
                                                                {consultation.status === 'scheduled' && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => window.location.href = `/call/${consultation.roomId}`}
                                                                    >
                                                                        <Video className="w-4 h-4 mr-1" />
                                                                        Join
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Create/Edit Reminder Modal */}
            <Modal
                isOpen={showReminderModal}
                onClose={() => {
                    setShowReminderModal(false)
                    resetReminderForm()
                }}
                title={editingReminderId ? 'Edit Reminder' : 'Create Reminder'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={reminderForm.title}
                            onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                            placeholder="e.g., Prepare case documents"
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={reminderForm.description}
                            onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                            placeholder="Additional details..."
                            rows={3}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={reminderForm.date}
                                onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Time
                            </label>
                            <input
                                type="time"
                                value={reminderForm.time}
                                onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Priority
                        </label>
                        <div className="flex gap-3">
                            {['low', 'medium', 'high'].map(priority => (
                                <button
                                    key={priority}
                                    onClick={() => setReminderForm({ ...reminderForm, priority })}
                                    className={`flex-1 py-2 px-4 rounded-lg border-2 capitalize transition-all ${reminderForm.priority === priority
                                            ? priority === 'high'
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : priority === 'medium'
                                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                    : 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                >
                                    {priority}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setShowReminderModal(false)
                                resetReminderForm()
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleCreateReminder}
                        >
                            {editingReminderId ? 'Update' : 'Create'} Reminder
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

export default ManageMeetingsPage
