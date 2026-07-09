import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/context/AppProviders";
import { MainLayout } from "@/components/layout/MainLayout";
import { APP_NAME, APP_TAGLINE } from "@/utils/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: `${APP_NAME} is a modern personal media streaming platform for videos that you own or are authorized to access. Premium, private, in sync.`,
  keywords: [APP_NAME, "media", "streaming", "video", "watch party", "library", "Next.js", "TypeScript"],
  authors: [{ name: APP_NAME }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_TAGLINE,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppProviders>
          <MainLayout>{children}</MainLayout>
        </AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
