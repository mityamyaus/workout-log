import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { StoreProvider } from "@/lib/store";
import { ProfileProvider } from "@/lib/profile";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Дневник тренировок",
  description: "Личный дневник тренировок",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Тренировки",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-dvh antialiased overflow-hidden" suppressHydrationWarning>
      <body className="h-dvh flex flex-col overflow-hidden">
        <ThemeProvider>
          <ProfileProvider>
            <StoreProvider>
              <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</main>
              <BottomNav />
            </StoreProvider>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
