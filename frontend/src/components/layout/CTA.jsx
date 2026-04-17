import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import { useFirebase } from '../../context/FirebaseContext'

const CTA = () => {
  const navigate = useNavigate()
  const { currentUser } = useFirebase()

  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl p-8 md:p-16"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="relative text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Ready to Get Started?
          </h2>

          <p className="text-lg md:text-xl text-primary-100 mb-8">
            Join thousands of users who trust LegalNexus for their legal needs. 
            Start your journey to accessible legal assistance today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/chat')}
              className="group bg-white text-primary-600 hover:bg-primary-50"
            >
              {currentUser ? 'Go to Dashboard' : 'Learn More'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/lawyers')}
              className="bg-transparent border-2 border-white text-white hover:bg-white/10"
            >
              Find a Lawyer
            </Button>
          </div>

          <p className="text-sm text-primary-100 mt-6">
            No credit card required. Get started in seconds.
          </p>
        </div>
      </motion.div>
    </section>
  )
}

export default CTA
