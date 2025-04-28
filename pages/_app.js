// pages/_app.js
import '../styles/globals.css';
import '../styles/Datepicker.css';
import 'react-datepicker/dist/react-datepicker.css';
import Script from 'next/script';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
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
          gtag('config', 'G-ZW1DPYXS0N', {
            page_path: window.location.pathname,
          });
        `}
      </Script>

      {/* Resten av appen */}
      <Component {...pageProps} />
    </>
  );
}
