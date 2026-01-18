import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-display font-bold text-neutral-900 mb-4">
          Terms and Conditions
        </h1>
        
        <p className="text-neutral-600 mb-8">
          <strong>Effective Date:</strong> October 30, 2025
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Nature of Service</h2>
            <p className="text-neutral-700 mb-4">
              LegalNexus is an AI-based legal informational tool designed to provide basic 
              guidance on legal topics, assist in document analysis, and connect users with 
              legal professionals.
            </p>
            <p className="text-neutral-700 mb-4">
              The Platform does not provide legal advice, legal representation, or services 
              requiring a licensed advocate under the Advocates Act, 1961.
            </p>
            <p className="text-neutral-700">
              All responses are general in nature, non-binding, and intended solely to enhance 
              user awareness. Users are strongly encouraged to consult a licensed legal 
              professional before acting on any information obtained from the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. User Eligibility</h2>
            <p className="text-neutral-700 mb-4">
              By using this Platform, you affirm that you are competent to contract under 
              the Indian Contract Act, 1872.
            </p>
            <p className="text-neutral-700">
              If you are under 18 years of age, you must use the Platform under the 
              supervision of a parent or legal guardian.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. Acceptable Use</h2>
            <p className="text-neutral-700 mb-4">You agree to use the Platform only for lawful purposes. You shall not:</p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Upload or transmit any defamatory, obscene, or unlawful content</li>
              <li>Attempt to reverse-engineer or exploit the Platform's systems</li>
              <li>Impersonate any person or entity</li>
              <li>Use the Platform for any commercial purpose without authorization</li>
              <li>Interfere with the proper functioning of the Platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Intellectual Property</h2>
            <p className="text-neutral-700">
              All content, including design, logos, AI models, and branding, are the 
              intellectual property of LegalNexus unless otherwise stated. You may not 
              reproduce, distribute, or create derivative works without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Limitation of Liability</h2>
            <p className="text-neutral-700 mb-4">
              The Platform is provided on an "as-is" and "as-available" basis without warranties 
              of any kind.
            </p>
            <p className="text-neutral-700">
              Under no circumstances shall LegalNexus be liable for any direct, indirect, 
              incidental, special, or consequential damages arising from your use of the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Legal Disclaimer</h2>
            <p className="text-neutral-700 mb-4">
              This Platform is not a substitute for legal advice or legal services.
            </p>
            <p className="text-neutral-700 mb-4">
              No lawyer-client relationship is created by the use of the Platform.
            </p>
            <p className="text-neutral-700">
              Any reliance placed on the Platform's responses is strictly at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Governing Law</h2>
            <p className="text-neutral-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of India.
            </p>
            <p className="text-neutral-700">
              Any disputes arising under these Terms shall be subject to the exclusive 
              jurisdiction of the courts located in Delhi, India.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">8. Amendments</h2>
            <p className="text-neutral-700">
              We reserve the right to amend these Terms at any time. Continued use of the 
              Platform after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <div className="mt-12 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Last updated: October 30, 2025
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default TermsPage
