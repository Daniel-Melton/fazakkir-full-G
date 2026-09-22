import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Amiri } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fazakkir.com"),
  title: {
    default: "Fazakkir Academy | 1-on-1 Online Quran & Arabic for Kids",
    template: "%s | Fazakkir Academy",
  },
  description:
    "Master Quran recitation with certified Al-Azhar scholars. Tailored 1-on-1 online classes in Tajweed, Hifz, and Arabic for Muslim children in the USA, UK, and Canada.",
  keywords: [
    "Online Quran classes",
    "Quran tutor for kids",
    "1 on 1 Tajweed classes",
    "Learn Quran online UK",
    "Quran teacher USA",
    "Learn Arabic for children",
    "Al-Azhar Quran academy",
    "Noorani Qaida online",
  ],
  authors: [{ name: "Fazakkir Academy Academic Board" }],
  creator: "Fazakkir Academy",
  publisher: "Fazakkir Academy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fazakkir.com",
    siteName: "Fazakkir Academy",
    title: "Fazakkir Academy | 1-on-1 Online Quran & Arabic Classes for Kids",
    description:
      "Connect your child with certified Al-Azhar instructors. Start with 2 free assessment classes today.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fazakkir Academy - 1-on-1 Online Quran Tutoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fazakkir Academy | 1-on-1 Online Quran & Arabic Classes",
    description:
      "Certified Al-Azhar tutors guiding your child with structured Tajweed and personalized curriculum.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Fazakkir Academy",
    url: "https://fazakkir.com",
    logo: "https://fazakkir.com/logo.png",
    description:
      "Online educational academy teaching the Holy Quran, Tajweed, and Arabic language to children and families living in Western countries.",
    sameAs: [
      "https://facebook.com/fazakkir",
      "https://instagram.com/fazakkir",
    ],
    offers: {
      "@type": "Offer",
      category: "Free Trial",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <html lang="en" className={`${jakarta.variable} ${amiri.variable}`}>
      <head>
        {/* Font Awesome 6 */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* Cloudflare Turnstile */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />

        {/* Google Structured Data (Schema.org) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-slate-200/70 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 min-h-screen">
        <div className="max-w-[1360px] mx-auto bg-slate-50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.12)] min-h-screen border-x border-slate-200/80">
          {children}
        </div>
      </body>
    </html>
  );
}