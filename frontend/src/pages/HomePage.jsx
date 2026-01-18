import { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Hero from '../components/layout/Hero'
import Features from '../components/layout/Features'
import HowItWorks from '../components/layout/HowItWorks'
import Stats from '../components/layout/Stats'
import CTA from '../components/layout/CTA'
import Footer from '../components/layout/Footer'
import Modal from '../components/ui/Modal'

const HomePage = () => {
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [canAccept, setCanAccept] = useState(false)

  useEffect(() => {
    const hasConsented = localStorage.getItem('userConsent')
    if (!hasConsented) {
      setShowConsentModal(true)
    }
  }, [])

  useEffect(() => {
    if (showConsentModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanAccept(true)
    }
  }, [showConsentModal, countdown])

  const handleAcceptConsent = () => {
    localStorage.setItem('userConsent', 'true')
    setShowConsentModal(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <CTA />
      <Footer />

      <Modal
        isOpen={showConsentModal}
        onClose={() => {}}
        title="Terms & Conditions"
        size="md"
        showClose={false}
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            Before using LegalNexus, please review and accept our Terms of Service 
            and Privacy Policy. We are committed to protecting your privacy and 
            ensuring your data security.
          </p>

          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                required
              />
              <span className="text-sm text-neutral-700">
                I agree to the{' '}
                <a href="/terms" className="text-primary-600 hover:underline" target="_blank">
                  Terms of Service
                </a>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                required
              />
              <span className="text-sm text-neutral-700">
                I agree to the{' '}
                <a href="/privacy" className="text-primary-600 hover:underline" target="_blank">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          {!canAccept && (
            <div className="text-center py-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700 font-medium">
                Please wait {countdown} seconds before accepting
              </p>
            </div>
          )}

          <button
            onClick={handleAcceptConsent}
            disabled={!canAccept}
            className="btn-primary w-full"
          >
            {canAccept ? 'Accept & Continue' : `Wait ${countdown}s`}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default HomePage
