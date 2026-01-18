import { motion } from 'framer-motion'
import { Upload, Sparkles, CheckCircle } from 'lucide-react'

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload or Ask',
      description: 'Upload your legal document or ask a question to our AI chatbot'
    },
    {
      icon: Sparkles,
      title: 'AI Analysis',
      description: 'Our advanced AI processes and analyzes your document or query instantly'
    },
    {
      icon: CheckCircle,
      title: 'Get Results',
      description: 'Receive clear explanations, summaries, and actionable insights'
    }
  ]

  return (
    <section className="section-container bg-neutral-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-4">
          How It Works
        </h2>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Get legal assistance in three simple steps
        </p>
      </motion.div>

      <div className="relative">
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 -translate-y-1/2" />

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6 mx-auto relative">
                  <step.icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-primary-600">
                      {index + 1}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">
                  {step.title}
                </h3>

                <p className="text-neutral-600 text-center">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
