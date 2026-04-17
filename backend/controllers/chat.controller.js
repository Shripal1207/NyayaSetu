/**
 * AI Chat (NyaySetu) - uses Google Gemini
 * POST /api/chat - send message and get AI response
 */

import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load .env so GOOGLE_API_KEY is set (ES modules load before server.js runs dotenv.config())
dotenv.config()

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY?.trim()
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null

if (!GOOGLE_API_KEY) {
  console.warn('⚠️ GOOGLE_API_KEY not set – NyaySetu chatbot will return a friendly error until you add it to backend/.env')
} else {
  console.log('✅ Gemini API key loaded – NyaySetu chatbot enabled')
}

const LEGAL_SYSTEM_PROMPT = `You are NyaySetu, a helpful AI Legal Assistant for Indian law. You give clear, accurate, and practical information about Indian legal procedures, rights, and remedies. You are friendly and supportive. You always advise users to consult a qualified advocate for their specific situation. Keep responses concise but complete. Use simple language. For Indian law, refer to relevant acts (e.g. IPC, CrPC, CPC, Consumer Protection Act) when relevant.`

function getTextFromResponse(response) {
  if (typeof response.text === 'function') {
    return response.text()
  }
  if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text
  }
  return null
}

export const sendMessage = async (req, res) => {
  try {
    const { msg } = req.body
    if (!msg || typeof msg !== 'string' || !msg.trim()) {
      return res.status(400).json({ error: 'Message is required.' })
    }

    if (!genAI) {
      return res.status(503).json({
        response: '⚠️ The AI Legal Assistant is not configured. Add GOOGLE_API_KEY to your backend .env file and restart the server. Get a key at https://aistudio.google.com/apikey',
        error: true,
        serviceUnavailable: true
      })
    }

    const modelName = 'gemini-2.5-flash'
    const model = genAI.getGenerativeModel({ model: modelName })
    const prompt = `${LEGAL_SYSTEM_PROMPT}\n\nUser question: ${msg.trim()}`
    const result = await model.generateContent(prompt)
    const response = result.response
    if (!response) {
      console.error('Gemini returned no response object. Result:', JSON.stringify(result, null, 2).slice(0, 500))
      return res.status(500).json({
        response: 'The model did not return a response. Try rephrasing your question.',
        error: true
      })
    }
    const text = getTextFromResponse(response)

    if (!text || typeof text !== 'string') {
      console.error('Gemini returned no text:', result)
      return res.status(500).json({
        response: 'Sorry, I could not generate a response. Please try again.',
        error: true
      })
    }

    const formatted = text.replace(/\n/g, '<br>')
    return res.json({ response: formatted })
  } catch (err) {
    const msg = err?.message || String(err)
    const status = err?.response?.status || err?.status
    // Log everything so we can see what Google SDK actually returns
    console.error('Chat error:', msg)
    console.error('Gemini API status:', status)
    if (err?.response?.data) console.error('Gemini response data:', JSON.stringify(err.response.data))
    if (err?.toString) console.error('Full error:', err.toString())
    try { console.error('Error keys:', Object.keys(err || {})) } catch (_) {}
    let userMsg
    if (msg.includes('API_KEY') || msg.includes('403') || msg.includes('401') || status === 403 || status === 401) {
      userMsg = '⚠️ Invalid or restricted Gemini API key. Check your key at https://aistudio.google.com/apikey and ensure the Generative Language API is enabled.'
    } else if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota')) {
      userMsg = '⚠️ API quota exceeded. Please try again later or check your Gemini API usage at Google AI Studio.'
    } else if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('network')) {
      userMsg = '⚠️ Could not reach the AI service. Check your internet connection and try again.'
    } else {
      userMsg = '⚠️ The AI Legal Assistant is temporarily unavailable. Please try again later.'
    }
    return res.status(500).json({
      response: userMsg,
      error: true,
      serviceUnavailable: true
    })
  }
}

export const chatHealth = async (req, res) => {
  res.json({
    status: GOOGLE_API_KEY ? 'OK' : 'NO_API_KEY',
    message: 'LegalNexus Chat API',
    chatbot: !!genAI
  })
}

/**
 * GET /api/chat/diagnose - Test Gemini API and return the exact error if it fails.
 * Open in browser: http://localhost:5001/api/chat/diagnose
 */
export const chatDiagnose = async (req, res) => {
  const keySet = !!GOOGLE_API_KEY
  const keyPreview = GOOGLE_API_KEY
    ? `${GOOGLE_API_KEY.slice(0, 8)}...${GOOGLE_API_KEY.slice(-4)}`
    : 'not set'
  if (!genAI) {
    return res.json({
      ok: false,
      keySet,
      keyPreview,
      error: 'GOOGLE_API_KEY is missing or empty in .env. Restart backend after adding it.',
      hint: 'Get a key at https://aistudio.google.com/apikey'
    })
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent('Reply with one word: OK')
    let text = getTextFromResponse(result?.response)
    if (text && typeof text.then === 'function') text = await text
    if (!text && result?.response?.text) text = await Promise.resolve(result.response.text())
    if (text && String(text).trim()) {
      return res.json({ ok: true, keyPreview, message: 'Gemini API is working.', reply: String(text).trim() })
    }
    return res.json({
      ok: false,
      keyPreview,
      error: 'Gemini returned no text',
      detail: JSON.stringify(result?.response || result).slice(0, 300)
    })
  } catch (err) {
    const msg = err?.message || String(err)
    const status = err?.response?.status ?? err?.status
    const body = err?.response?.data ?? err?.error ?? err?.body
    console.error('[diagnose] Gemini error:', msg, status, body)
    return res.json({
      ok: false,
      keyPreview,
      error: msg,
      status,
      detail: body ? (typeof body === 'object' ? JSON.stringify(body).slice(0, 500) : String(body).slice(0, 500)) : undefined,
      hint: 'Fix the error above, then restart the backend and try the chat again.'
    })
  }
}
