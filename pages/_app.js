// pages/_app.js
import '../styles/globals.css';
import '../styles/Datepicker.css';
import 'react-datepicker/dist/react-datepicker.css';
import Head from 'next/head';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import NewsletterPopup from '../components/NewsletterPopup';
import { useRouter } from 'next/router';
console.log('📰 NewsletterPopup is', NewsletterPopup);

export default function MyApp({ Component, pageProps }) {
  const { pathname } = useRouter();
  return (
    <>
      {/* SEO og Meta-informasjon */}
      <Head>
        <title>Ultraløp i Norge | langeløp.no</title>
        <meta name="description" content="Oversikt over alle ultraløp i Norge. Finn din neste utfordring, få tips, erfaringer og inspirasjon fra andre løpere!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Ultraløp i Norge | langeløp.no" />
        <meta property="og:description" content="Finn ultraløp i Norge, få tips og del erfaringer fra landets vakreste løp." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.langelop.no" />
        <meta property="og:image" content="https://www.langelop.no/hero-2.jpg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-ZW1DPYXS0N"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-ZW1DPYXS0N');
        `}
      </Script>

      {/* Hovedinnhold */}
      <Component {...pageProps} />

      {/* Nyhetsbrev-popup */}
      {pathname === '/' && <NewsletterPopup /> }

      {/* Vercel Analytics */}
      <Analytics />
    </>
  );
}
