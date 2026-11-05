import './globals.css';
import { Metadata } from 'next';
import TopLoader from '@/components/TopLoader';

export const metadata: Metadata = {
  title: 'iChengHub',
  description: 'AI Tool Card Portal',
  applicationName: 'iChengHub',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'iChengHub',
    statusBarStyle: 'default',
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var avatar=localStorage.getItem('ichenghub.session-avatar');if(avatar){document.documentElement.classList.add('has-session-avatar');document.documentElement.style.setProperty('--session-avatar-image','url("'+encodeURI(avatar).replace(/"/g,'%22')+'")')}}catch(e){}})();`,
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
