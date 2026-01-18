import { motion } from 'framer-motion'
import { MessageSquare, FileText, Users, BookOpen, Shield, Zap } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'NyaySetu - AI Legal Chatbot',
      description: 'Get instant answers to your legal questions from our intelligent AI assistant trained on Indian law.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FileText,
      title: 'NyayMarma - Document Analysis',
      description: 'Upload legal documents and receive clear, simplified explanations in multiple languages.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Users,
      title: 'NyayBandhu - Find Lawyers',
      description: 'Connect with verified lawyers near you based on specialization and location.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: BookOpen,
      title: 'Legal Dictionary',
      description: 'Access comprehensive legal resources and case law at your fingertips.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected. We never share your information.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get legal insights in seconds, not days. Save time and money.',
      color: 'from-yellow-500 to-yellow-600'
    }
  ]

  return (
    <section className="section-container bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-4">
          Everything You Need for Legal Assistance
        </h2>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Powerful features designed to make legal services accessible and affordable for everyone
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="group"
          >
            <div className="card hover:scale-105 transition-transform duration-300 h-full">
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {feature.title}
              </h3>

              <p className="text-neutral-600">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default Features
