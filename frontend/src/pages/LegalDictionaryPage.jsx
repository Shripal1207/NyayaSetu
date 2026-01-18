import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, BookOpen, Scale, ExternalLink } from 'lucide-react'
import Footer from '../components/layout/Footer'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'

const LegalDictionaryPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Terms' },
    { id: 'criminal', name: 'Criminal Law' },
    { id: 'civil', name: 'Civil Law' },
    { id: 'corporate', name: 'Corporate Law' },
    { id: 'constitutional', name: 'Constitutional Law' }
  ]

  const legalTerms = [
    {
      term: 'Affidavit',
      category: 'civil',
      definition: 'A written statement confirmed by oath or affirmation, for use as evidence in court.',
      example: 'The witness submitted an affidavit detailing the events of that night.'
    },
    {
      term: 'Bail',
      category: 'criminal',
      definition: 'The temporary release of an accused person awaiting trial, sometimes on condition that a sum of money is lodged to guarantee their appearance in court.',
      example: 'The accused was granted bail of Rs. 50,000.'
    },
    {
      term: 'Plaintiff',
      category: 'civil',
      definition: 'A person who brings a case against another in a court of law.',
      example: 'The plaintiff filed a lawsuit for breach of contract.'
    },
    {
      term: 'Defendant',
      category: 'criminal',
      definition: 'An individual, company, or institution sued or accused in a court of law.',
      example: 'The defendant pleaded not guilty to all charges.'
    },
    {
      term: 'Jurisdiction',
      category: 'constitutional',
      definition: 'The official power to make legal decisions and judgments.',
      example: 'The case falls under the jurisdiction of the High Court.'
    },
    {
      term: 'Litigation',
      category: 'civil',
      definition: 'The process of taking legal action; a lawsuit.',
      example: 'The company is involved in litigation with its former partner.'
    },
    {
      term: 'Arbitration',
      category: 'corporate',
      definition: 'The use of an arbitrator to settle a dispute outside of court.',
      example: 'Both parties agreed to resolve their differences through arbitration.'
    },
    {
      term: 'FIR (First Information Report)',
      category: 'criminal',
      definition: 'A written document prepared by police when they receive information about a cognizable offense.',
      example: 'She filed an FIR at the local police station.'
    },
    {
      term: 'Writ',
      category: 'constitutional',
      definition: 'A formal written order issued by a body with administrative or judicial jurisdiction.',
      example: 'A writ of habeas corpus was filed in the Supreme Court.'
    },
    {
      term: 'IPR (Intellectual Property Rights)',
      category: 'corporate',
      definition: 'Legal rights that protect creations of the mind, such as inventions, literary works, and symbols.',
      example: 'The company enforced its IPR against counterfeit products.'
    },
    {
      term: 'Acquittal',
      category: 'criminal',
      definition: 'A judgment that a person is not guilty of the crime with which they have been charged.',
      example: 'The jury returned a verdict of acquittal.'
    },
    {
      term: 'Injunction',
      category: 'civil',
      definition: 'An authoritative warning or order issued by a court.',
      example: 'The court issued an injunction preventing the sale of the property.'
    }
  ]

  const filteredTerms = legalTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const firstLetter = term.term[0].toUpperCase()
    if (!acc[firstLetter]) {
      acc[firstLetter] = []
    }
    acc[firstLetter].push(term)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-neutral-50">
      <div>
        <div className="bg-gradient-to-br from-primary-600 to-accent-600 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-10 h-10" />
              <h1 className="text-4xl font-display font-bold">
                Legal Dictionary
              </h1>
            </div>
            <p className="text-primary-100 text-lg max-w-2xl">
              Your comprehensive guide to understanding legal terminology
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Input
              placeholder="Search legal terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              className="max-w-xl"
            />
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {filteredTerms.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  No terms found
                </h3>
                <p className="text-neutral-600">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.keys(groupedTerms).sort().map(letter => (
                <div key={letter}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-lg flex items-center justify-center text-2xl font-bold">
                      {letter}
                    </div>
                    <div className="flex-1 h-0.5 bg-neutral-200" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {groupedTerms[letter].map((term, index) => (
                      <motion.div
                        key={term.term}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="h-full hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-xl mb-2">
                                  {term.term}
                                </CardTitle>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${term.category === 'criminal' ? 'bg-red-100 text-red-700' :
                                    term.category === 'civil' ? 'bg-blue-100 text-blue-700' :
                                      term.category === 'corporate' ? 'bg-purple-100 text-purple-700' :
                                        'bg-green-100 text-green-700'
                                  }`}>
                                  {term.category.charAt(0).toUpperCase() + term.category.slice(1)} Law
                                </span>
                              </div>
                              <Scale className="w-6 h-6 text-primary-600" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-neutral-700 mb-4">
                              {term.definition}
                            </p>
                            <div className="p-3 bg-neutral-50 rounded-lg">
                              <p className="text-sm text-neutral-600 italic">
                                <span className="font-medium text-neutral-900">Example: </span>
                                {term.example}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Card className="mt-12 bg-gradient-to-br from-primary-50 to-accent-50">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">
                Need More Help?
              </h3>
              <p className="text-neutral-700 mb-6">
                Our AI assistant can help you understand complex legal terms and concepts
              </p>
              <a
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Ask AI Assistant
                <ExternalLink className="w-5 h-5" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default LegalDictionaryPage
