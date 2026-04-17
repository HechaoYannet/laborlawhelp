import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { CaseStoreProvider } from '@/hooks/use-case-store';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '劳动维权助手',
    template: '%s | 劳动维权助手',
  },
  description:
    '为劳动者提供专业的劳动维权指导，包括案情分析、赔偿计算、文书生成、律师推荐等一站式服务。',
  keywords: [
    '劳动法',
    '劳动维权',
    '劳动仲裁',
    '劳动纠纷',
    '赔偿计算',
    '劳动合同',
    '辞退',
    '工资',
    '社保',
  ],
  authors: [{ name: '劳动维权助手', url: process.env.NEXT_PUBLIC_APP_URL || 'https://example.com' }],
  generator: 'LaborLawHelp',
  // icons: {
  //   icon: '',
  // },
  openGraph: {
    title: '劳动维权助手',
    description:
      '为劳动者提供专业的劳动维权指导，包括案情分析、赔偿计算、文书生成与律师推荐。',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://example.com',
    siteName: '劳动维权助手',
    locale: 'zh_CN',
    type: 'website',
    // images: [
    //   {
    //     url: '',
    //     width: 1200,
    //     height: 630,
    //     alt: '扣子编程 - 你的 AI 工程师',
    //   },
    // ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
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
  const isDev = process.env.NODE_ENV === 'development';
  const enableInspector = process.env.NEXT_PUBLIC_ENABLE_DEV_INSPECTOR === 'true';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <CaseStoreProvider>
          {isDev && enableInspector && <Inspector />}
          {children}
        </CaseStoreProvider>
      </body>
    </html>
  );
}
