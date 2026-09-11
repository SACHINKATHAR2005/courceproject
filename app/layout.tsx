import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "LearnHub Certify | Verified Digital Credentials & Certificate Verification",
  description: "Official credential verification platform. Complete courses, earn verifiable certificates, and validate institutional student registration records.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#1E3A5F] selection:text-white`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
