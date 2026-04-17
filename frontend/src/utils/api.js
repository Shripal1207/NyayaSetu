import axios from 'axios'

// Always use backend URL so chat/document API hit the Node server (backend .env has PORT=5001)
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error)
      return Promise.reject(error)
    }
  )

  return instance
}

const backendApi = createApiInstance(BACKEND_URL)

// Document analyzer: use backend proxy (avoids CORS; backend forwards to ML service)
export const documentAnalyzerService = {
  uploadDocument: async (files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('pdfs', file)
    })
    const response = await backendApi.post('/api/document/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000
    })
    return response.data
  },

  getExplanation: async (language = 'English') => {
    const response = await backendApi.get('/api/document/explain', {
      params: { language },
      timeout: 60000
    })
    return response.data
  },

  askQuestion: async (question, language = 'English') => {
    const response = await backendApi.post('/api/document/ask', { question, language }, { timeout: 60000 })
    return response.data
  }
}

export const chatbotService = {
  sendMessage: async (message) => {
    try {
      const response = await backendApi.post('/api/chat', { msg: message })
      return response.data
    } catch (error) {
      console.error('Chatbot service error:', error)
      const backendMsg = error.response?.data?.response || error.response?.data?.error
      return {
        response: backendMsg || '⚠️ The AI Legal Assistant (NyaySetu) is temporarily unavailable. Ensure the backend is running (npm start in backend folder) and GOOGLE_API_KEY is set in backend/.env',
        error: true,
        serviceUnavailable: true
      }
    }
  },

  getChatHistory: async () => ({ history: [] }),

  checkHealth: async () => {
    try {
      await backendApi.get('/api/chat/health', { timeout: 5000 })
      return { available: true }
    } catch (error) {
      return { available: false }
    }
  }
}

export const saveChatToFirestore = async (db, userId, messages) => {
  try {
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    const chatRef = doc(db, 'chatbots', userId)

    await setDoc(chatRef, {
      chats: messages,
      updatedAt: serverTimestamp()
    }, { merge: true })
  } catch {
    // Silently fail - chat history saving is not critical
    // Firebase permissions may not be configured for this collection
  }
}

export const saveDocumentToFirestore = async (db, userId, documentData) => {
  try {
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
    const docsRef = collection(db, 'users', userId, 'documents')

    await addDoc(docsRef, {
      ...documentData,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error saving document:', error)
  }
}
