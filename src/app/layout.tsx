import type { Metadata } from "next";
import { VT323, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify-sans",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FLLC OS // CyberWorld Portal",
  description: "CyberWorld Enterprise Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${vt323.variable} ${pixelifySans.variable}`}>
        {children}
      </body>
    </html>
  );
}
