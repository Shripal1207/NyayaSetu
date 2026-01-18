import { Navigate, useLocation } from 'react-router-dom'
import { useFirebase } from '../context/FirebaseContext'
import Loader from './ui/Loader'

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useFirebase()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader size="lg" />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
