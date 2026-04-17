import { motion } from 'framer-motion'
import { User, Scale, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'

const UserTypeSelection = ({ onSelectType }) => {
  const userTypes = [
    {
      type: 'client',
      icon: User,
      title: 'I need legal help',
      description: 'Get AI-powered legal assistance, analyze documents, and find lawyers',
      color: 'from-blue-500 to-blue-600'
    },
    {
      type: 'lawyer',
      icon: Scale,
      title: 'I am an advocate',
      description: 'Connect with clients and grow your practice',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-neutral-900 mb-3">
          Welcome to LegalNexus
        </h1>
        <p className="text-lg text-neutral-600">
          Choose how you want to get started
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {userTypes.map((item) => (
          <motion.div
            key={item.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => onSelectType(item.type)}
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200 h-full">
              <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                {item.title}
              </h3>

              <p className="text-neutral-600 mb-6">
                {item.description}
              </p>

              <div className="flex items-center text-primary-600 font-medium group-hover:gap-2 transition-all duration-300">
                Continue
                <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </motion.div>
  )
}

export default UserTypeSelection
