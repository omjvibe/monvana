import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import SupportToggle from "@/components/support/SupportToggle";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Monvana Bank | Your Trusted Financial Partner",
    template: "%s | Monvana Bank",
  },
  description: "A premium, sophisticated digital banking experience designed for those who demand excellence in every transaction. Experience the future of banking with Monvana.",
  keywords: ["banking", "online banking", "digital bank", "secure banking", "Monvana", "Monvana Bank", "private banking", "premium wealth management"],
  authors: [{ name: "Monvana Bank" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Monvana Bank",
    title: "Monvana Bank | Your Trusted Financial Partner",
    description: "A premium, sophisticated digital banking experience designed for those who demand excellence in every transaction.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monvana Bank | Your Trusted Financial Partner",
    description: "A premium, sophisticated digital banking experience designed for those who demand excellence in every transaction.",
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <SupportToggle />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        {/* Smartsupp Initialization */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var _smartsupp = _smartsupp || {};
              _smartsupp.key = 'a1acf3cbab3417f5c7fa3af2d43f6a755f919517';
              window.smartsupp||(function(d) {
                var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
                s=d.getElementsByTagName('script')[0];c=d.createElement('script');
                c.type='text/javascript';c.charset='utf-8';c.async=true;
                c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
              })(document);
            `
          }}
        />
        <noscript>Powered by <a href="https://www.smartsupp.com" target="_blank">Smartsupp</a></noscript>
      </body>
    </html>
  );
}
