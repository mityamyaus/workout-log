import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { StoreProvider } from "@/lib/store";
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
    <html lang="ru" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <StoreProvider>
            <div className="flex-1 pb-[calc(84px+env(safe-area-inset-bottom))]">{children}</div>
            <BottomNav />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
