import './globals.css';
import { Metadata } from 'next';
import TopLoader from '@/components/TopLoader';

export const metadata: Metadata = {
  title: 'iChengHub 热荐工坊',
  description: '隐私优先的浏览器在线工具、精选数字资源、实用效率指南与原创技术博客。',
  applicationName: 'iChengHub',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'iChengHub',
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: '/favicon.svg',
    apple: [{ url: '/apple-touch-icon-v2.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;var avatar=localStorage.getItem('ichenghub.session-avatar');if(avatar){root.classList.add('has-session-avatar','has-session-user');root.style.setProperty('--session-avatar-image','url("'+encodeURI(avatar).replace(/"/g,'%22')+'")')}else if(localStorage.getItem('ichenghub.session-active')==='1'){root.classList.add('has-session-user')}}catch(e){}})();`,
          }}
        />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6703406106028729"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans">
        <TopLoader />
        {children}
      </body>
    </html>
  );
}
