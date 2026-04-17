import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Scale,
  User,
  CalendarDays,
  Video,
  ShieldCheck,
  Users,
  MessageSquare,
  FileText,
  ArrowRight,
  Sparkles,
  BookOpen,
  UserCircle,
  ExternalLink,
  FileCheck,
} from 'lucide-react'
import { useFirebase } from '../context/FirebaseContext'
import Button from '../components/ui/Button'

const AdvocateLoginPage = () => {
  const navigate = useNavigate()
  const { currentUser } = useFirebase()

  const quickAccessLinks = [
    { path: '/dictionary', label: 'Legal Dictionary', icon: BookOpen, description: 'Browse legal terms', public: true },
    { path: '/lawyers', label: 'NyayBandhu', icon: Users, description: 'Find advocates', public: true },
    { path: '/manage-meetings', label: 'Manage Meetings', icon: CalendarDays, description: 'Schedule & track', public: false },
    { path: '/verification', label: 'Verification', icon: ShieldCheck, description: 'Bar Council verification', public: false },
    { path: '/consultations', label: 'Consultations', icon: Video, description: 'Messages & video calls', public: false },
    { path: '/profile', label: 'My Profile', icon: UserCircle, description: 'Edit your profile', public: false },
  ]

  const advocateFeatures = [
    {
      icon: CalendarDays,
      title: 'Manage meetings',
      description: 'Schedule and track consultations & reminders',
    },
    {
      icon: ShieldCheck,
      title: 'Bar Council verification',
      description: 'Get verified and stand out on NyayBandhu',
    },
    {
      icon: Video,
      title: 'Video consultations',
      description: 'Connect with clients over secure video calls',
    },
    {
      icon: Users,
      title: 'Reach more clients',
      description: 'Get discovered by people seeking legal help',
    },
    {
      icon: MessageSquare,
      title: 'NyaySetu',
      description: 'AI legal assistant for your practice',
    },
    {
      icon: FileText,
      title: 'NyayMarma',
      description: 'Document analysis at your fingertips',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl" />

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left: Client section */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col justify-center p-8 lg:p-12 xl:p-16"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8 transition-colors text-sm font-medium"
          >
            ← Back to Home
          </Link>
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-900">I'm a Client</h2>
                <p className="text-sm text-neutral-500">Seeking legal help</p>
              </div>
            </div>
            <p className="text-neutral-600 mb-6">
              Explore AI-powered legal assistance, find verified advocates, analyze documents, and book consultations — no account required to browse.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/')}
              className="group"
            >
              Continue to LegalNexus
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.section>

        {/* Divider on desktop */}
        <div className="hidden lg:block w-px bg-neutral-200 self-stretch my-8" />

        {/* Right: Advocate section */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 flex flex-col justify-center p-8 lg:p-12 xl:p-16"
        >
          <div className="max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-neutral-900">I'm an Advocate</h2>
                <p className="text-sm text-neutral-500">For advocates on LegalNexus</p>
              </div>
            </div>

            {/* Quick access – working links to app pages */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary-500" />
                Quick access
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickAccessLinks.map((item) => {
                  const canAccess = item.public || currentUser
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                        canAccess
                          ? 'bg-white border-neutral-200 hover:border-primary-300 hover:shadow-md'
                          : 'bg-neutral-50 border-neutral-100 text-neutral-400 cursor-not-allowed'
                      }`}
                      title={canAccess ? item.description : 'Log in to access'}
                      disabled={!canAccess}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-800 truncate">{item.label}</p>
                        <p className="text-xs text-neutral-500 truncate">{item.description}</p>
                      </div>
                      {canAccess && <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
              {!currentUser && (
                <p className="text-xs text-neutral-500 mt-2">
                  Log in to access Manage Meetings, Verification, Consultations & Profile.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                For advocates on LegalNexus
              </h3>
              <ul className="space-y-2">
                {advocateFeatures.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-neutral-600"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <span className="font-medium text-neutral-800">{item.title}</span>
                      <span className="text-neutral-500"> — {item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources – working links */}
            <div className="mt-8 pt-6 border-t border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary-500" />
                Resources
              </h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/privacy"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default AdvocateLoginPage
