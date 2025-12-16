import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

const TermsOfService = ({ onBack }) => {
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
            <FileText className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          </div>

          <p className="text-gray-400 mb-6">
            <strong>Last Updated:</strong> December 7, 2025
          </p>

          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using AlgoEdge ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">2. Description of Service</h2>
              <p>
                AlgoEdge provides automated forex trading services through integration with MetaTrader 5 platforms. The Service includes:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Automated trading robots with various strategies</li>
                <li>Real-time trade monitoring and analytics</li>
                <li>Account management and configuration tools</li>
                <li>Email notifications and alerts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">3. Risk Disclosure</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
                <p className="font-semibold text-red-400 mb-2">IMPORTANT RISK WARNING</p>
                <p>
                  Trading forex, commodities, and other financial instruments involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results. You should carefully consider whether trading is appropriate for you in light of your financial condition.
                </p>
              </div>
              <p>
                By using AlgoEdge, you acknowledge that:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>You may lose all or more than your initial investment</li>
                <li>Automated trading carries additional risks</li>
                <li>No guarantee of profit or performance is made</li>
                <li>You are responsible for your trading decisions</li>
                <li>You should not invest money you cannot afford to lose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">4. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Not use the Service for illegal purposes</li>
                <li>Not attempt to reverse engineer or hack the Service</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Monitor your trading activity regularly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">5. Subscription and Payments</h2>
              <p>
                AlgoEdge offers three subscription tiers: Free, Pro, and Enterprise. By subscribing to a paid plan:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>You authorize recurring charges to your payment method</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>Refunds are provided at our discretion</li>
                <li>Prices may change with 30 days notice</li>
                <li>You can cancel anytime through the billing portal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALGOEDGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Your use of or inability to use the Service</li>
                <li>Trading losses incurred through use of the Service</li>
                <li>Technical failures or interruptions</li>
                <li>Unauthorized access to your account</li>
                <li>Errors or omissions in the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">7. No Financial Advice</h2>
              <p>
                AlgoEdge does not provide financial, investment, or trading advice. The Service is provided as a tool only. You should consult with a qualified financial advisor before making trading decisions. We are not registered as a securities broker-dealer or investment advisor.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">8. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Service are owned by AlgoEdge and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">9. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of subscription fees</li>
                <li>Any reason at our sole discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">12. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at:
              </p>
              <div className="mt-2 ml-4">
                <p>Email: support@algoedge.com</p>
                <p>Address: [Your Business Address]</p>
              </div>
            </section>

            <section className="border-t border-purple-500/30 pt-6">
              <p className="text-sm text-gray-400">
                By creating an account or using AlgoEdge, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
