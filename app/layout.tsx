import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "8+1｜碰一下，开始今晚",
    description: "实时酒吧热力、NFC 到店打卡、AI 喝酒路线与每季酒单。",
    openGraph: {
      title: "8+1｜碰一下，开始今晚",
      description: "记录你的喝酒路线，找到下一家刚刚好的酒吧。",
      type: "website",
      locale: "zh_CN",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "8+1 城市喝酒路线" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "8+1｜碰一下，开始今晚",
      description: "记录你的喝酒路线，找到下一家刚刚好的酒吧。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
