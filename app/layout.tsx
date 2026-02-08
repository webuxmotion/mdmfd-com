import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MDMFD - Social Networks Manager",
  description: "Manage your social networks, notes, and books in one place",
  icons: {
    icon: "/favicon.png",
  },
};

// Inline script to prevent flash of wrong theme and sidebar width
const initScript = `
  (function() {
    try {
      var theme = localStorage.getItem('mdmfd_theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
      var sidebarWidth = localStorage.getItem('sidebarWidth');
      if (sidebarWidth) {
        var width = parseInt(sidebarWidth, 10);
        if (width >= 200 && width <= 500) {
          document.documentElement.style.setProperty('--sidebar-width', width + 'px');
        }
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
