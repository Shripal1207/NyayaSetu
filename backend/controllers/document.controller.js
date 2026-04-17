/**
 * Document analyzer proxy – forwards to ML service to avoid CORS and same-origin issues
 */

import axios from 'axios'
import FormData from 'form-data'

const DOC_ANALYZER_URL = process.env.DOC_ANALYZER_URL || 'http://localhost:7861'

export const uploadDocuments = async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error: 'No PDF files uploaded' })
  }

  try {
    const form = new FormData()
    req.files.forEach((file) => {
      form.append('pdfs', file.buffer, { filename: file.originalname || 'document.pdf', contentType: file.mimetype })
    })

    const response = await axios.post(`${DOC_ANALYZER_URL}/upload`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000
    })
    return res.json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data = err.response?.data
    const message = data?.error || err.message || 'Document analyzer unavailable'
    console.error('Document upload proxy error:', message)
    return res.status(status).json({ error: message })
  }
}

export const getExplanation = async (req, res) => {
  try {
    const language = req.query.language || 'English'
    const response = await axios.get(`${DOC_ANALYZER_URL}/explain`, {
      params: { language },
      timeout: 60000
    })
    return res.json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data = err.response?.data
    const message = data?.error || err.message || 'Failed to get explanation'
    return res.status(status).json({ error: message })
  }
}

export const askQuestion = async (req, res) => {
  try {
    const { question, language = 'English' } = req.body || {}
    if (!question) {
      return res.status(400).json({ error: 'Question is required' })
    }
    const response = await axios.post(
      `${DOC_ANALYZER_URL}/ask`,
      { question, language },
      { timeout: 60000, headers: { 'Content-Type': 'application/json' } }
    )
    return res.json(response.data)
  } catch (err) {
    const status = err.response?.status || 500
    const data = err.response?.data
    const message = data?.error || err.message || 'Failed to get answer'
    return res.status(status).json({ error: message })
  }
}
