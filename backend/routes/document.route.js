import express from 'express'
import multer from 'multer'
import { uploadDocuments, getExplanation, askQuestion } from '../controllers/document.controller.js'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'), false)
    }
  }
})

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 20 MB.' })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10.' })
    }
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message })
  }
  next(err)
}

router.post('/upload', (req, res, next) => {
  upload.array('pdfs', 10)(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next)
    next()
  })
}, uploadDocuments)
router.get('/explain', getExplanation)
router.post('/ask', askQuestion)

export default router
