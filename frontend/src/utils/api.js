import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const backendApi = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const chatbotService = {
  sendMessage: async (message) => {
    try {
      const response = await backendApi.post('/api/chat', { msg: message })
      return response.data
    } catch (error) {
      console.error('Chatbot service error:', error)
      const backendMsg = error.response?.data?.response || error.response?.data?.error
      return {
        response: backendMsg || 'The AI Legal Assistant (NyaySetu) is temporarily unavailable. Ensure the RAG backend is running (python app.py in ML/CHATBOT/law) and GOOGLE_API_KEY is set in ML/CHATBOT/law/.env',
        error: true,
        serviceUnavailable: true
      }
    }
  },

  checkHealth: async () => {
    try {
      await backendApi.get('/api/chat/health', { timeout: 5000 })
      return { available: true }
    } catch {
      return { available: false }
    }
  }
}
