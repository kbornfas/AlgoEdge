'use client';

import Link from 'next/link';
import { 
  ArrowLeft, 
  AlertTriangle, 
  TrendingDown, 
  Brain, 
  Zap, 
  Shield, 
  DollarSign,
  Activity,
  Clock,
  Target
} from 'lucide-react';

export default function RiskDisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/20 via-[#1a1a2e] to-red-900/20 border-b border-red-500/30">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Risk Disclaimer</h1>
              <p className="text-gray-400 mt-1">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Warning Banner */}
      <div className="bg-gradient-to-r from-red-500/10 via-red-500/20 to-red-500/10 border-y border-red-500/30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-400 mb-2">⚠️ CRITICAL RISK WARNING</h2>
              <p className="text-gray-300 leading-relaxed">
                <strong>Trading foreign exchange (forex), contracts for differences (CFDs), cryptocurrencies, and other 
                financial instruments on margin carries a HIGH LEVEL OF RISK and may not be suitable for all investors.</strong> 
                The possibility exists that you could sustain a loss of some or all of your initial investment. Therefore, 
                you should not invest money that you cannot afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard 
            value="74-89%"
            label="of retail CFD accounts lose money"
            color="red"
          />
          <StatCard 
            value="High"
            label="Leverage Risk"
            color="orange"
          />
          <StatCard 
            value="24/7"
            label="Market Volatility"
            color="yellow"
          />
          <StatCard 
            value="100%"
            label="Your Responsibility"
            color="blue"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          
          {/* Section 1 */}
          <RiskSection
            icon={<TrendingDown className="w-5 h-5" />}
            title="High-Risk Investment Warning"
            color="red"
          >
            <p>
              Trading leveraged products such as Forex, CFDs, and cryptocurrencies involves substantial risk of loss 
              and is not suitable for all investors. Before you decide to trade, you should carefully consider your 
              investment objectives, experience, and risk tolerance.
            </p>
            <ul>
              <li><strong>You could lose all your invested capital</strong> – never trade with money you cannot afford to lose</li>
              <li>Past performance is not indicative of future results</li>
              <li>The value of investments can go down as well as up</li>
              <li>High leverage can magnify both profits AND losses</li>
            </ul>
          </RiskSection>

          {/* Section 2 */}
          <RiskSection
            icon={<Zap className="w-5 h-5" />}
            title="Leverage and Margin Risks"
            color="orange"
          >
            <p>
              Leverage allows you to control large positions with a small amount of capital. While this can amplify 
              profits, it equally amplifies losses. Even a small market movement can result in significant losses 
              that may exceed your initial deposit.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 my-4">
              <p className="text-orange-300 font-medium m-0">
                <strong>Example:</strong> With 1:100 leverage, a 1% adverse market movement can result in a 100% loss 
                of your invested capital. Higher leverage ratios increase this risk proportionally.
              </p>
            </div>
            <ul>
              <li>Margin calls may require you to deposit additional funds quickly</li>
              <li>Positions may be automatically closed if margin requirements are not met</li>
              <li>You may owe more than your initial deposit in extreme market conditions</li>
            </ul>
          </RiskSection>

          {/* Section 3 */}
          <RiskSection
            icon={<Activity className="w-5 h-5" />}
            title="Automated Trading System Risks"
            color="purple"
          >
            <p>
              AlgoEdge provides automated trading robots and signal services. These systems carry unique risks that 
              you must understand before use:
            </p>
            <ul>
              <li><strong>Technical Failures:</strong> Software bugs, connectivity issues, or server downtime can cause 
              unexpected losses or missed opportunities</li>
              <li><strong>Market Conditions:</strong> Automated systems are designed based on historical data and may 
              not perform well in unusual market conditions</li>
              <li><strong>Slippage:</strong> Execution prices may differ significantly from expected prices during 
              high volatility</li>
              <li><strong>Over-optimization:</strong> Systems that perform well on historical data may not perform 
              well in live markets</li>
              <li><strong>Monitoring Required:</strong> Automated systems still require regular monitoring and may 
              need intervention</li>
            </ul>
          </RiskSection>

          {/* Section 4 */}
          <RiskSection
            icon={<Clock className="w-5 h-5" />}
            title="Market and Volatility Risks"
            color="cyan"
          >
            <p>
              Financial markets can be highly volatile and subject to rapid and significant price movements:
            </p>
            <ul>
              <li><strong>Gap Risk:</strong> Markets can open at prices significantly different from the previous close</li>
              <li><strong>News Events:</strong> Economic releases, geopolitical events, and other news can cause 
              extreme volatility</li>
              <li><strong>Liquidity Risk:</strong> In some market conditions, it may be difficult to execute trades 
              at desired prices</li>
              <li><strong>Weekend/Holiday Risk:</strong> Markets may gap significantly after closures</li>
              <li><strong>Flash Crashes:</strong> Sudden, severe market movements can occur without warning</li>
            </ul>
          </RiskSection>

          {/* Section 5 */}
          <RiskSection
            icon={<Brain className="w-5 h-5" />}
            title="Psychological Risks"
            color="pink"
          >
            <p>
              Trading can be psychologically demanding and may lead to poor decision-making:
            </p>
            <ul>
              <li><strong>Emotional Trading:</strong> Fear, greed, and other emotions can lead to impulsive decisions</li>
              <li><strong>Overtrading:</strong> The urge to trade frequently can lead to excessive costs and poor results</li>
              <li><strong>Revenge Trading:</strong> Attempting to recover losses quickly often leads to larger losses</li>
              <li><strong>Overconfidence:</strong> Early successes may lead to excessive risk-taking</li>
              <li><strong>Addiction:</strong> Trading can become addictive, leading to financial and personal problems</li>
            </ul>
          </RiskSection>

          {/* Section 6 */}
          <RiskSection
            icon={<Shield className="w-5 h-5" />}
            title="No Guarantees"
            color="gray"
          >
            <p>
              AlgoEdge and its services come with no guarantees of any kind:
            </p>
            <ul>
              <li>We do not guarantee any specific trading results or profits</li>
              <li>Historical performance shown is not a guarantee of future results</li>
              <li>Testimonials and case studies represent individual experiences and may not be typical</li>
              <li>Signal accuracy rates are historical and may vary in future conditions</li>
              <li>Robot performance backtests may not reflect real market conditions</li>
            </ul>
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 my-4">
              <p className="text-gray-300 m-0">
                <strong>IMPORTANT:</strong> Any projections, forecasts, or trading simulations are for informational 
                purposes only and should not be relied upon as indicators of future performance.
              </p>
            </div>
          </RiskSection>

          {/* Section 7 */}
          <RiskSection
            icon={<DollarSign className="w-5 h-5" />}
            title="Not Financial Advice"
            color="green"
          >
            <p>
              The information and services provided by AlgoEdge are for educational and informational purposes only:
            </p>
            <ul>
              <li>We are NOT registered financial advisors, brokers, or dealers</li>
              <li>Our content does not constitute personalized investment advice</li>
              <li>You should consult with qualified financial professionals before making investment decisions</li>
              <li>We do not consider your individual financial situation, goals, or risk tolerance</li>
              <li>Any decisions you make based on our services are entirely your own responsibility</li>
            </ul>
          </RiskSection>

          {/* Section 8 */}
          <RiskSection
            icon={<Target className="w-5 h-5" />}
            title="Your Responsibilities"
            color="blue"
          >
            <p>
              By using AlgoEdge, you acknowledge and agree that:
            </p>
            <ul>
              <li>You have read and understood this Risk Disclaimer in its entirety</li>
              <li>You are solely responsible for your trading decisions and their outcomes</li>
              <li>You will only trade with capital you can afford to lose entirely</li>
              <li>You will seek independent professional advice if needed</li>
              <li>You understand the specific risks associated with the products you trade</li>
              <li>You will continuously monitor your positions and risk exposure</li>
              <li>You accept that losses are a normal part of trading</li>
            </ul>
          </RiskSection>

          {/* Acknowledgment Box */}
          <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border border-red-500/30 rounded-2xl p-6 mt-12">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Important Acknowledgment</h3>
                <p className="text-gray-300 mb-4">
                  By creating an account or using any services on AlgoEdge, you confirm that you have read, understood, 
                  and accept all the risks described in this disclaimer. You acknowledge that trading is speculative and 
                  involves the risk of loss, including the loss of your entire investment.
                </p>
                <p className="text-gray-400 text-sm">
                  If you do not fully understand these risks or have any doubts about trading, please do not use our 
                  services and seek advice from an independent financial advisor.
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 justify-center pt-8 border-t border-gray-800 mt-12">
            <Link 
              href="/terms" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-gray-600">•</span>
            <Link 
              href="/privacy" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600">•</span>
            <Link 
              href="/contact" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Contact Support
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  };
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 text-center`}>
      <div className={`text-2xl font-bold ${colors[color].split(' ').pop()}`}>{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}

// Risk Section Component
function RiskSection({ 
  icon, 
  title, 
  color, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  color: string;
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
    gray: 'from-gray-500/20 to-gray-600/10 border-gray-500/30 text-gray-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  };

  const colorClass = colors[color] || colors.gray;

  return (
    <section className="bg-[#12121a] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
      <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r ${colorClass} border w-fit`}>
        {icon}
        <h2 className="text-lg font-bold text-white m-0">{title}</h2>
      </div>
      <div className="text-gray-300 leading-relaxed [&>p]:mb-4 [&>ul]:mb-4 [&>ul]:ml-6 [&>ul>li]:mb-2 [&>ul>li]:list-disc">
        {children}
      </div>
    </section>
  );
}
