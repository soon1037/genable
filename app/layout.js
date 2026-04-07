import { Inter } from "next/font/google";
import "./globals.css";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "GENABLE - AI 사용을 쉽게",
  description: "제네이블은 복잡한 AI 기술을 누구나 쉽고 직관적으로 활용할 수 있도록 돕는 운영 인텔리전스 & 상담 가이드 플랫폼입니다.",
  keywords: ["제네이블", "GENABLE", "AI 상담", "운영 인텔리전스", "AI 가이드"],
  authors: [{ name: "GENABLE Team" }],
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "GENABLE - AI 사용을 쉽게",
    description: "복잡한 운영과 상담, 이제 AI와 함께 쉽고 빠르게 해결하세요.",
    url: "https://genable.ai",
    siteName: "GENABLE",
    locale: "ko_KR",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={interSans.variable}>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
