import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui";
import { tokensToCss } from "@/lib/design/tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CSDL Hà Tĩnh – Bản đồ cơ sở dữ liệu", template: "%s · CSDL Hà Tĩnh" },
  description: "Bản đồ 3D các cơ sở dữ liệu của HĐND, UBND, các sở, ban, ngành và đơn vị trực thuộc tỉnh Hà Tĩnh.",
  robots: { index: false, follow: false }, // hệ thống nội bộ
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#262624" },
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&display=swap&subset=vietnamese"
        />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
