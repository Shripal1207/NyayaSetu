import axios from 'axios'

const DOC_ANALYZER_URL = import.meta.env.VITE_DOC_ANALYZER_URL || 'http://localhost:8000'
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || 'http://localhost:8080'

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

const docAnalyzerApi = createApiInstance(DOC_ANALYZER_URL)
const chatbotApi = createApiInstance(CHATBOT_URL)

export const documentAnalyzerService = {
  uploadDocument: async (files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('pdfs', file)
    })

    const response = await docAnalyzerApi.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getExplanation: async (language = 'English') => {
    const response = await docAnalyzerApi.get('/explain', {
      params: { language }
    })
    return response.data
  },

  askQuestion: async (question, language = 'English') => {
    const response = await docAnalyzerApi.post('/ask', { question, language })
    return response.data
  }
}

export const chatbotService = {
  sendMessage: async (message) => {
    const response = await chatbotApi.post('/get', { msg: message })
    return response.data
  },

  getChatHistory: async () => {
    const response = await chatbotApi.get('/chat_history')
    return response.data
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
  } catch (error) {
    console.error('Error saving chat:', error)
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
