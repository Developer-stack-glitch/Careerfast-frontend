import "../index.css";
import "../App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Header.css";
import "../css/LandingPage.css";
import "../css/LoginPage.css";
import "../css/Footer.css";
import "../css/CommonLoader.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Providers } from "./providers";
import ClientRouteHandler from "./client-route-handler";
import ScrollToTop from "../ScrollTop/ScrollToTop";
import Script from "next/script";
import { Suspense } from "react";
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-geist",
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-YX6Y57X00W";
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyA2-QH2Uf2Jq9AyVfotBjQfgS9-VkPTLQ4";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7f5af0",
};

export const metadata = {
  metadataBase: new URL('https://www.careerfast.in'),
  title: {
    default: "CareerFast | Find Jobs, Internships, Courses & Scholarships",
    template: "%s | CareerFast",
  },
  description: "Discover premium job opportunities and internships with top-tier companies. CareerFast connects job seekers with verified recruiters.",
  robots: "index, follow",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.careerfast.in/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "CareerFast",
  "url": "https://www.careerfast.in",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.careerfast.in/jobs?search={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CareerFast",
  "url": "https://www.careerfast.in",
  "logo": "https://www.careerfast.in/og-image.png",
  "description": "CareerFast connects job seekers and students with verified employers for jobs, internships, scholarships, and career courses.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "careerfastcontact@gmail.com"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.transparenttextures.com" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" precedence="default" />
      </head>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd]) }}
        />
        <Providers>
          <Suspense fallback={null}>
            <ClientRouteHandler>
              <ScrollToTop />
              {children}
            </ClientRouteHandler>
          </Suspense>
        </Providers>
        {/* GA Script Integration */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        {/* Google Maps Integration */}
        {GOOGLE_MAPS_KEY && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&loading=async`}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
