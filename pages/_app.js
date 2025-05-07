// pages/_app.js
import '../styles/globals.css';
import '../styles/Datepicker.css';
import 'react-datepicker/dist/react-datepicker.css';
import Head from 'next/head';
import Script from 'next/script'; // 👈 Importerer Next.js sin Script-komponent
import { Analytics } from '@vercel/analytics/react';


export default function MyApp({ Component, pageProps }) {
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
        <link rel="icon" href="/favicon.ico" />
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
      
      {/* Vercel Analytics */}
      <Analytics />
    </>
  );
}
