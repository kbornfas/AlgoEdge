import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

const PrivacyPolicy = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-gray-900/90 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>

          <p className="text-gray-400 mb-6">
            <strong>Last Updated:</strong> December 7, 2025
          </p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">1. Introduction</h2>
              <p>
                AlgoEdge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Personal Information</h3>
              <p>We collect information that you provide directly to us:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Account credentials (username, email, password)</li>
                <li>Profile information (name, phone, country, timezone)</li>
                <li>MT5 broker account details</li>
                <li>Payment information (processed by Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Trading Data</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Trade history and performance metrics</li>
                <li>Robot configurations and settings</li>
                <li>Account balances and equity</li>
                <li>Trading preferences and risk settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Technical Information</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and interactions</li>
                <li>Log data and error reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
              <p>We use collected information for:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Providing and maintaining the Service</li>
                <li>Processing transactions and subscriptions</li>
                <li>Sending trade alerts and notifications</li>
                <li>Improving user experience and features</li>
                <li>Detecting and preventing fraud</li>
                <li>Complying with legal obligations</li>
                <li>Responding to support requests</li>
                <li>Sending marketing communications (with consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">4. Information Sharing</h2>
              <p>We may share your information with:</p>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Service Providers</h3>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Stripe (payment processing)</li>
                <li>Email service providers (notifications)</li>
                <li>Cloud hosting services (data storage)</li>
                <li>Analytics providers (usage insights)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Legal Requirements</h3>
              <p className="mt-2">We may disclose information if required by law or to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Comply with legal process</li>
                <li>Enforce our Terms of Service</li>
                <li>Protect rights, property, or safety</li>
                <li>Prevent fraud or abuse</li>
              </ul>

              <p className="mt-4">
                <strong>We do not sell your personal information to third parties.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">5. Data Security</h2>
              <p>We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Bcrypt password hashing with salt</li>
                <li>JWT token-based authentication</li>
                <li>Rate limiting and abuse prevention</li>
                <li>Regular security audits</li>
                <li>Access controls and logging</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">6. Data Retention</h2>
              <p>We retain your information for as long as:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Your account is active</li>
                <li>Needed to provide the Service</li>
                <li>Required by law or regulation</li>
                <li>Necessary for business purposes</li>
              </ul>
              <p className="mt-4">
                You may request deletion of your account and data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">7. Your Rights</h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>Access:</strong> Request a copy of your data</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request account and data removal</li>
                <li><strong>Portability:</strong> Export your data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
                <li><strong>Object:</strong> Object to certain data processing</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at privacy@algoedge.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">8. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies for:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Authentication and session management</li>
                <li>Storing user preferences</li>
                <li>Analytics and performance monitoring</li>
                <li>Security and fraud prevention</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings. Disabling cookies may affect Service functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">10. Children's Privacy</h2>
              <p>
                Our Service is not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">11. Third-Party Links</h2>
              <p>
                Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to read their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">12. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">13. Contact Us</h2>
              <p>
                For questions or concerns about this Privacy Policy or our data practices:
              </p>
              <div className="mt-2 ml-4">
                <p>Email: privacy@algoedge.com</p>
                <p>Support: support@algoedge.com</p>
                <p>Address: [Your Business Address]</p>
              </div>
            </section>

            <section className="border-t border-purple-500/30 pt-6">
              <p className="text-sm text-gray-400">
                By using AlgoEdge, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
