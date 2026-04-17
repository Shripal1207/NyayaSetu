import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'
import Button from '../ui/Button'
import { useFirebase } from '../../context/FirebaseContext'

const Hero = () => {
  const navigate = useNavigate()
  const { currentUser } = useFirebase()

  const features = [
    { icon: Sparkles, text: 'AI-Powered Legal Assistant' },
    { icon: Shield, text: 'Secure & Confidential' },
    { icon: Zap, text: 'Instant Document Analysis' },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/30">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-neutral-200 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-neutral-700">
                Trusted by 10,000+ users
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-neutral-900 mb-6 leading-tight">
              Legal Help Made{' '}
              <span className="gradient-text">Simple</span> with AI
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-xl">
              Get instant legal assistance, analyze documents, and connect with 
              verified lawyers. All powered by advanced AI technology.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button
                size="lg"
                onClick={() => navigate('/chat')}
                className="group"
              >
                Start Chatting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/dictionary')}
              >
                Explore Features
              </Button>
            </div>

            <div className="flex flex-wrap gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl transform rotate-3" />
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-primary-200 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-primary-100 rounded w-1/2" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-accent-50 rounded-lg">
                    <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-accent-200 rounded w-2/3 mb-2" />
                      <div className="h-2 bg-accent-100 rounded w-1/3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
                    <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-neutral-600" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-neutral-200 rounded w-4/5 mb-2" />
                      <div className="h-2 bg-neutral-100 rounded w-2/5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-6 -right-6 w-24 h-24 bg-primary-500 rounded-full blur-xl opacity-50"
            />
            
            <motion.div
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-6 -left-6 w-32 h-32 bg-accent-500 rounded-full blur-xl opacity-50"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero
