import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-display font-bold text-neutral-900 mb-4">
          Privacy Policy
        </h1>
        
        <p className="text-neutral-600 mb-8">
          <strong>Effective Date:</strong> October 30, 2025 | <strong>Last Updated:</strong> October 30, 2025
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">1. Introduction</h2>
            <p className="text-neutral-700 mb-4">
              This Privacy Policy outlines the data handling practices of LegalNexus. 
              It explains how we collect, use, and safeguard your information when you 
              access or interact with our services.
            </p>
            <p className="text-neutral-700">
              By using this Platform, you agree to the terms outlined in this Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">2. Information We Collect</h2>
            <p className="text-neutral-700 mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Personal information (name, email, phone number) when you create an account</li>
              <li>Location data when you search for nearby lawyers (with your consent)</li>
              <li>Document content when you use our AI analysis features</li>
              <li>Chat conversations with our AI assistant</li>
              <li>Usage data and analytics to improve our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-neutral-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Provide and improve our AI-powered legal services</li>
              <li>Connect you with verified lawyers in your area</li>
              <li>Analyze documents and provide legal insights</li>
              <li>Send important updates about your account and services</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">4. Data Security</h2>
            <p className="text-neutral-700">
              We implement industry-standard security measures including encryption, 
              secure servers, and regular security audits to protect your data. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">5. Data Sharing</h2>
            <p className="text-neutral-700 mb-4">
              We do not sell your personal information. We may share your data only:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>With lawyers when you initiate contact through our platform</li>
              <li>With service providers who help us operate the platform (e.g., Google Maps)</li>
              <li>When required by law or legal process</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">6. Your Rights</h2>
            <p className="text-neutral-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-neutral-700 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">7. Cookies</h2>
            <p className="text-neutral-700">
              We use cookies to enhance your experience, analyze usage, and personalize content. 
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">8. Contact Us</h2>
            <p className="text-neutral-700 mb-2">
              For any questions regarding this Privacy Policy, please contact us at:
            </p>
            <p className="text-neutral-700">
              Email: privacy@legalnexus.com<br />
              Address: Delhi, India
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

export default PrivacyPolicyPage
