export default function Head() {
  return (
    <>
      {/* Favicon - Multiple formats for browser compatibility */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/png" sizes="32x32" href="/images/logo.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/images/logo.png" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/images/logo.png" />
      
      {/* Preconnect to important domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="https://videos.pexels.com" />
      
      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "AlgoEdge",
            "url": "https://algoedgehub.com",
            "logo": "https://algoedgehub.com/images/logo.png",
            "description": "AI-Powered Automated Forex Trading Platform",
            "sameAs": [
              "https://t.me/+newQkIa06W1kNmMx"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer support",
              "availableLanguage": "English"
            }
          })
        }}
      />
      
      {/* Structured Data - Software Application */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "AlgoEdge Trading Platform",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI-powered automated forex trading platform with MetaTrader 5 integration. 12+ trading robots with up to 84% win rate.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150"
            }
          })
        }}
      />
      
      {/* Structured Data - WebSite with SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "AlgoEdge",
            "url": "https://algoedgehub.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://algoedgehub.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </>
  );
}
