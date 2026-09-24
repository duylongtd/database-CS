import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui";
import { tokensToCss } from "@/lib/design/tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Mạch · Bản đồ dữ liệu Hà Tĩnh", template: "%s · Mạch" },
  description: "Mạch nguồn dữ liệu đất Hồng Lam – bản đồ 3D các cơ sở dữ liệu của HĐND, UBND, các sở, ban, ngành tỉnh Hà Tĩnh.",
  applicationName: "Mạch",
  robots: { index: false, follow: false }, // hệ thống nội bộ
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7F9" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1219" },
  ],
};

// Đặt theme trước khi vẽ trang để không bị nháy màu.
const themeScript = `try{var t=localStorage.getItem("hatinh-csdl:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: tokensToCss() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
