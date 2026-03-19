import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import { Navbar } from "@/components/navbar";
import { getAppSettings } from "@/lib/settings";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Interview Dossier",
    template: "%s | Interview Dossier",
  },
  description: "上传招聘信息与简历，生成面向目标岗位的面试题与参考答案。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = getAppSettings();

  return (
    <html
      lang="zh-CN"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <Navbar initialSettings={settings} />
        <main className="mx-auto w-full max-w-[1700px] flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
