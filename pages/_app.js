// pages/_app.js
import '../styles/globals.css';
import '../styles/Datepicker.css';
import 'react-datepicker/dist/react-datepicker.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}