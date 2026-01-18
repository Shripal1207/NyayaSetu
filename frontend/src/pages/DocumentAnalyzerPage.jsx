import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, Download, MessageSquare, Loader2, CheckCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Toast from '../components/ui/Toast'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { useFirebase } from '../context/FirebaseContext'
import { db } from '../context/FirebaseContext'
import { documentAnalyzerService, saveDocumentToFirestore } from '../utils/api'

const DocumentAnalyzerPage = () => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [language, setLanguage] = useState('English')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  const fileInputRef = useRef(null)
  const { currentUser } = useFirebase()

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'हिंदी (Hindi)' },
    { value: 'Bengali', label: 'বাংলা (Bengali)' },
    { value: 'Telugu', label: 'తెలుగు (Telugu)' },
    { value: 'Marathi', label: 'मराठी (Marathi)' },
    { value: 'Tamil', label: 'தமிழ் (Tamil)' },
    { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
    { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
    { value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
    { value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)' },
    { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { value: 'Assamese', label: 'অসমীয়া (Assamese)' },
    { value: 'Urdu', label: 'اردو (Urdu)' },
    { value: 'Sanskrit', label: 'संस्कृत (Sanskrit)' },
    { value: 'Konkani', label: 'कोंकणी (Konkani)' },
    { value: 'Manipuri', label: 'মৈতৈলোন্ (Manipuri)' },
    { value: 'Nepali', label: 'नेपाली (Nepali)' },
    { value: 'Sindhi', label: 'سنڌي (Sindhi)' },
    { value: 'Kashmiri', label: 'कॉशुर (Kashmiri)' },
    { value: 'Dogri', label: 'डोगरी (Dogri)' },
    { value: 'Maithili', label: 'मैथिली (Maithili)' },
    { value: 'Santali', label: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)' },
    { value: 'Bodo', label: 'बड़ो (Bodo)' }
  ]

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const pdfFiles = files.filter(file => file.type === 'application/pdf')

    if (pdfFiles.length !== files.length) {
      setToast({ show: true, message: 'Only PDF files are allowed', type: 'warning' })
    }

    setSelectedFiles(prev => [...prev, ...pdfFiles])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const pdfFiles = files.filter(file => file.type === 'application/pdf')

    if (pdfFiles.length !== files.length) {
      setToast({ show: true, message: 'Only PDF files are allowed', type: 'warning' })
    }

    setSelectedFiles(prev => [...prev, ...pdfFiles])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setToast({ show: true, message: 'Please select at least one PDF file', type: 'warning' })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      await documentAnalyzerService.uploadDocument(selectedFiles)
      setUploadProgress(100)
      setToast({ show: true, message: 'Documents uploaded successfully!', type: 'success' })

      setTimeout(() => {
        handleGetExplanation()
      }, 500)
    } catch (error) {
      console.error('Upload error:', error)
      setToast({ show: true, message: 'Failed to upload documents', type: 'error' })
    } finally {
      clearInterval(progressInterval)
      setIsUploading(false)
    }
  }

  const handleGetExplanation = async () => {
    setIsAnalyzing(true)
    setExplanation('')

    try {
      const response = await documentAnalyzerService.getExplanation(language)
      setExplanation(response.explanation)

      if (currentUser) {
        await saveDocumentToFirestore(db, currentUser.uid, {
          fileName: selectedFiles.map(f => f.name).join(', '),
          language,
          explanation: response.explanation
        })
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setToast({ show: true, message: 'Failed to analyze document', type: 'error' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setToast({ show: true, message: 'Please enter a question', type: 'warning' })
      return
    }

    setIsAsking(true)
    setAnswer('')

    try {
      const response = await documentAnalyzerService.askQuestion(question, language)
      setAnswer(response.answer)
    } catch (error) {
      console.error('Question error:', error)
      setToast({ show: true, message: 'Failed to get answer', type: 'error' })
    } finally {
      setIsAsking(false)
    }
  }

  const handleReset = () => {
    setSelectedFiles([])
    setExplanation('')
    setQuestion('')
    setAnswer('')
    setUploadProgress(0)
  }

  const downloadExplanation = () => {
    const element = document.createElement('a')
    const file = new Blob([explanation], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'legal-document-explanation.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              NyayMarma - Document Analyzer
            </h1>
            <p className="text-neutral-600">
              Simplify legal documents | न्यायसारांश - Get explanations in your language
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
                  >
                    <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-700 font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-neutral-500">
                      PDF files only (Max 10MB each)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-neutral-700">
                        Selected Files ({selectedFiles.length})
                      </p>
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                            <span className="text-sm text-neutral-700 truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-neutral-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <Select
                      label="Explanation Language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      options={languageOptions}
                    />
                  </div>

                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-neutral-600 mb-2">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || isUploading || isAnalyzing}
                      isLoading={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? 'Uploading...' : 'Upload & Analyze'}
                    </Button>
                    {selectedFiles.length > 0 && (
                      <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={isUploading || isAnalyzing}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {explanation && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Ask Questions</CardTitle>
                      <MessageSquare className="w-5 h-5 text-primary-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question about your document..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAskQuestion()
                        }}
                      />
                      <Button
                        onClick={handleAskQuestion}
                        disabled={!question.trim() || isAsking}
                        isLoading={isAsking}
                        className="w-full"
                      >
                        Ask Question
                      </Button>

                      {answer && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-primary-50 rounded-lg"
                        >
                          <p className="text-sm font-medium text-primary-900 mb-2">Answer:</p>
                          <div
                            className="text-sm text-primary-800 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: answer }}
                          />
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Document Explanation</CardTitle>
                    {explanation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={downloadExplanation}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                      <p className="text-neutral-600">Analyzing your document...</p>
                    </div>
                  )}

                  {!isAnalyzing && !explanation && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="w-16 h-16 text-neutral-300 mb-4" />
                      <p className="text-neutral-600">
                        Upload a document to see the explanation here
                      </p>
                    </div>
                  )}

                  <AnimatePresence>
                    {explanation && !isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="prose prose-sm max-w-none"
                      >
                        <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            Analysis Complete
                          </span>
                        </div>
                        <div
                          className="text-neutral-700 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: explanation }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}

export default DocumentAnalyzerPage
