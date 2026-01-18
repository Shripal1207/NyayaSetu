import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-display font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-display font-bold text-neutral-900 mb-3">
            Page Not Found
          </h2>
          <p className="text-neutral-600 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate(-1)}
            className="group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/')}
            className="group"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
