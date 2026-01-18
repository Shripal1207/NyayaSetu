import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const Stats = () => {
  const stats = [
    { value: 10000, suffix: '+', label: 'Active Users' },
    { value: 50000, suffix: '+', label: 'Documents Analyzed' },
    { value: 500, suffix: '+', label: 'Verified Lawyers' },
    { value: 98, suffix: '%', label: 'Satisfaction Rate' }
  ]

  return (
    <section className="section-container bg-gradient-to-br from-primary-600 to-accent-600 text-white">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="text-center"
          >
            <Counter value={stat.value} suffix={stat.suffix} />
            <p className="text-primary-100 mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

const Counter = ({ value, suffix }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      let start = 0
      const end = value
      const duration = 2000
      const increment = end / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-display font-bold">
      {count.toLocaleString()}{suffix}
    </div>
  )
}

export default Stats
