import { Inter } from "next/font/google";
import "./globals.css";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Antigravity - Zero-Gravity Guides",
  description: "Interactive real-time guides with zero gravity experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={interSans.variable}>
      <body>{children}</body>
    </html>
  );
}
