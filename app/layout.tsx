import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Rakamin - Career Portal",
  description: "Find your dream job at Rakamin. Browse career opportunities and apply for positions that match your skills and ambitions.",
  keywords: "Rakamin, career portal, job search, employment, hiring, careers, jobs, recruitment",
  authors: [{ name: "Rakamin" }],
  creator: "Rakamin",
  publisher: "Rakamin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Rakamin - Career Portal",
    description: "Find your dream job at Rakamin. Browse career opportunities and apply for positions that match your skills and ambitions.",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000',
    siteName: "Rakamin",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rakamin - Career Portal",
    description: "Find your dream job at Rakamin. Browse career opportunities and apply for positions that match your skills and ambitions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${nunitoSans.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
