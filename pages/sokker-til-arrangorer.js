// pages/sokker-til-arrangorer.js
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import {
  PenLine, Palette, CheckCircle2, PackageCheck,
  Gift, ShoppingBag, ShieldCheck, ArrowRight,
} from 'lucide-react';

const STEG = [
  { icon: PenLine, tittel: 'Fortell oss om løpet', tekst: 'Navn, dato og omtrent hvor mange som løper. Tar to minutter å fylle ut.' },
  { icon: Palette, tittel: 'Vi setter opp et forslag', tekst: 'Vi legger logoen deres på sokken og sender et bilde — før noe som helst er bestemt.' },
  { icon: CheckCircle2, tittel: 'Dere sier ja, nei eller juster', tekst: 'Liker dere ikke forslaget, prøver vi igjen. Ingenting bestilles før dere har godkjent design, antall og pris.' },
  { icon: PackageCheck, tittel: 'Levert før løpsdagen', tekst: 'Vi tar hånd om innkjøp og produksjon, og leverer ferdig sokk klar til bruk før løpsdagen.' },
];

const HVORFOR = [
  { icon: Gift, tittel: 'Et løft i goodiebagen', tekst: 'Noe deltakerne faktisk setter pris på å finne, med løpets egen logo på.' },
  { icon: ShoppingBag, tittel: 'En ekstra inntektskilde', tekst: 'Selg sokkene i egen nettbutikk eller på standen — et produkt ingen andre løp har.' },
  { icon: ShieldCheck, tittel: 'Vi står for kvaliteten', tekst: 'Design, innkjøp og produksjon er vårt ansvar, fra første skisse til ferdig sokk.' },
];

// Håndtegnede konturlinjer (ikke ekte topografi) — gir hero-seksjonen en fjell/terreng-følelse
// i stedet for flate gradient-sirkler.
const TOPO_PEAK_1 = [
  'M738.9 160.0 L738.0 163.5 L735.2 166.6 L731.7 169.1 L728.6 171.3 L726.3 173.5 L724.1 175.7 L721.4 177.5 L717.8 178.3 L713.7 177.8 L709.8 176.8 L706.8 176.0 L704.6 176.7 L702.6 179.0 L700.0 182.3 L696.5 185.5 L692.4 187.3 L688.3 187.4 L684.8 185.9 L681.7 183.9 L678.7 181.9 L675.4 180.2 L672.1 178.3 L669.6 175.7 L668.9 172.3 L670.4 168.5 L673.6 164.9 L677.0 162.1 L679.0 160.0 L679.1 158.1 L677.5 155.8 L675.6 153.0 L674.5 149.9 L674.9 147.1 L676.5 144.6 L678.5 142.4 L680.4 139.8 L682.1 136.6 L684.2 133.1 L687.2 130.1 L691.3 128.7 L695.8 129.6 L700.0 132.4 L703.3 136.1 L705.8 139.3 L707.9 141.4 L710.4 142.3 L713.3 142.7 L716.0 143.5 L718.2 145.1 L719.7 147.1 L721.0 149.2 L723.1 150.9 L726.6 152.4 L731.2 154.2 L735.9 156.7 L738.9 160.0Z',
  'M779.7 160.0 L775.6 167.0 L771.3 173.4 L767.7 179.4 L764.2 185.4 L760.0 190.9 L754.3 195.5 L747.2 198.7 L739.7 200.8 L732.7 202.7 L726.7 205.4 L721.2 209.7 L715.4 215.2 L708.3 220.4 L700.0 224.0 L691.1 225.0 L682.3 223.5 L674.2 220.4 L666.6 216.9 L659.1 213.4 L651.7 209.7 L645.1 205.1 L640.3 199.0 L638.2 191.8 L638.6 184.3 L640.0 177.2 L640.7 171.1 L639.6 165.6 L636.7 160.0 L633.3 153.8 L631.0 147.1 L631.1 140.2 L633.5 133.8 L637.4 127.7 L641.6 121.8 L645.9 115.6 L650.6 109.2 L656.5 103.3 L664.3 99.2 L673.5 97.8 L683.1 99.2 L692.1 102.4 L700.0 105.7 L707.1 108.1 L714.2 109.2 L721.5 109.7 L728.9 110.7 L735.9 113.1 L742.1 116.7 L747.5 121.0 L753.2 125.2 L759.8 129.2 L767.4 133.4 L775.0 138.5 L780.8 144.9 L783.1 152.3 L781.7 160.0Z',
  'M814.3 160.0 L811.2 170.3 L808.4 180.3 L804.8 190.1 L799.3 199.2 L791.4 207.1 L782.0 213.7 L772.6 219.5 L763.9 225.7 L756.1 233.3 L748.2 242.0 L738.7 250.7 L727.2 257.6 L713.9 261.4 L700.0 261.6 L686.4 259.3 L673.3 255.8 L660.8 251.9 L648.5 247.8 L636.8 242.5 L626.7 235.4 L619.2 226.3 L614.6 215.9 L611.8 205.4 L609.2 195.9 L605.0 187.3 L599.0 178.9 L592.2 170.0 L586.6 160.0 L584.1 149.3 L585.0 138.5 L588.6 128.0 L593.5 117.9 L598.8 107.9 L604.7 97.7 L612.1 87.9 L622.1 79.9 L634.6 74.6 L648.7 72.7 L663.0 73.3 L676.3 75.0 L688.4 75.9 L700.0 75.6 L711.8 74.5 L724.0 73.9 L736.2 75.2 L747.8 78.5 L758.7 83.4 L769.2 88.9 L780.2 94.2 L792.0 99.8 L803.9 106.5 L814.0 115.0 L820.5 125.4 L822.3 137.1 L819.9 148.9 L815.3 160.0Z',
  'M850.6 160.0 L849.8 173.8 L846.8 187.5 L840.8 200.4 L832.0 212.1 L822.2 222.9 L812.7 233.7 L804.1 245.3 L795.5 258.2 L785.3 271.3 L772.1 282.8 L755.9 290.9 L737.5 294.8 L718.6 295.1 L700.0 293.3 L682.1 290.6 L664.5 287.6 L647.3 283.4 L631.3 277.0 L617.4 267.8 L606.3 256.3 L597.6 244.0 L589.7 232.1 L580.8 221.4 L570.2 211.3 L558.4 200.6 L547.7 188.5 L540.3 174.8 L537.4 160.0 L538.4 145.1 L542.0 130.4 L546.6 116.0 L552.0 101.6 L559.1 87.4 L569.3 74.6 L583.2 64.3 L600.2 57.4 L618.5 53.7 L636.4 51.7 L652.9 49.6 L668.4 46.3 L683.8 42.0 L700.0 38.1 L717.0 36.2 L734.2 37.2 L750.9 40.8 L767.1 45.8 L783.3 51.3 L800.2 57.0 L817.2 63.9 L832.9 73.1 L845.1 85.3 L852.2 99.9 L854.3 115.7 L852.9 131.4 L850.4 146.1 L848.4 160.0Z',
  'M890.8 160.0 L889.1 177.5 L883.8 194.4 L876.1 210.5 L867.9 226.3 L860.3 242.6 L852.9 260.0 L843.8 277.9 L831.1 294.8 L813.8 308.5 L792.6 317.7 L769.3 322.4 L745.7 324.1 L722.6 324.2 L700.0 323.8 L677.7 322.4 L655.8 318.7 L635.3 311.7 L617.0 301.3 L601.1 289.0 L586.7 276.5 L571.9 265.1 L555.5 254.5 L537.8 243.6 L520.6 230.8 L506.6 215.5 L497.6 197.9 L493.8 179.1 L493.8 160.0 L495.8 141.1 L498.9 122.4 L503.8 103.7 L512.0 85.8 L525.0 69.8 L542.4 56.9 L562.7 47.4 L583.5 40.2 L603.1 33.5 L621.3 25.9 L639.0 17.2 L657.8 8.4 L678.2 1.6 L700.0 -1.7 L722.2 -1.5 L744.2 1.2 L766.1 5.0 L788.4 9.5 L811.0 15.2 L832.8 23.5 L851.7 35.6 L865.8 51.6 L874.4 70.2 L878.6 89.5 L880.7 108.2 L882.8 125.8 L885.7 142.8 L888.4 160.0Z',
  'M930.9 160.0 L928.0 181.1 L923.4 201.8 L919.0 222.8 L914.7 244.8 L908.8 267.6 L898.7 290.0 L882.8 309.9 L861.0 325.5 L835.1 336.3 L807.5 343.1 L780.1 347.8 L753.3 351.5 L726.7 354.5 L700.0 355.3 L673.5 352.5 L648.3 345.7 L625.0 335.8 L603.3 324.7 L581.8 314.3 L559.1 304.9 L534.9 295.4 L510.7 283.8 L488.9 268.7 L472.2 250.0 L461.4 228.5 L455.7 205.7 L453.0 182.8 L451.9 160.0 L452.7 137.2 L456.8 114.5 L466.2 92.9 L481.3 73.6 L500.9 57.4 L522.3 43.8 L543.1 31.4 L562.3 18.4 L580.6 4.2 L599.9 -10.4 L621.7 -23.4 L646.3 -32.9 L672.8 -38.0 L700.0 -39.6 L727.3 -39.0 L754.9 -37.4 L783.0 -34.5 L810.8 -28.7 L836.8 -18.6 L858.8 -3.3 L875.5 16.1 L887.2 37.6 L895.9 59.1 L904.1 79.4 L913.0 98.9 L922.0 118.4 L929.2 138.8 L932.5 160.0Z',
  'M972.7 160.0 L973.5 185.3 L974.2 211.3 L973.5 238.5 L968.4 266.0 L956.4 292.1 L936.6 314.7 L910.5 332.6 L881.0 346.1 L850.8 356.8 L821.1 366.1 L791.6 374.7 L761.7 381.6 L730.9 385.1 L700.0 384.1 L669.9 379.0 L641.1 371.6 L612.9 364.2 L583.9 357.7 L553.4 351.3 L522.1 342.9 L492.3 330.3 L466.9 312.4 L447.5 290.1 L434.1 265.0 L424.7 239.0 L417.7 212.8 L412.5 186.6 L410.5 160.0 L413.7 133.5 L423.6 108.3 L439.4 85.2 L458.7 64.7 L478.2 45.7 L496.2 26.8 L513.0 6.6 L530.5 -14.3 L551.1 -34.3 L576.1 -51.0 L604.8 -63.1 L635.8 -70.7 L667.7 -75.2 L700.0 -77.9 L732.9 -79.2 L766.2 -77.8 L798.8 -71.6 L828.8 -59.4 L854.4 -41.4 L874.9 -19.9 L891.9 2.6 L907.6 24.3 L923.7 44.7 L940.5 65.0 L956.0 86.5 L967.9 109.9 L974.5 134.6 L976.4 160.0Z',
];
const TOPO_PEAK_2 = [
  'M130.6 560.0 L130.4 561.9 L129.2 563.6 L127.6 565.0 L126.4 566.5 L126.3 568.4 L127.1 571.2 L128.1 574.8 L128.1 578.7 L126.6 581.7 L123.7 583.3 L119.9 583.3 L116.2 582.4 L112.9 581.3 L110.0 580.6 L107.2 580.2 L104.5 579.6 L102.2 578.2 L100.7 575.9 L100.0 573.1 L99.7 570.6 L98.8 569.2 L96.6 568.7 L93.0 568.7 L88.7 568.4 L84.9 567.2 L82.4 565.2 L81.7 562.6 L82.0 560.0 L82.6 557.5 L82.9 554.9 L83.0 552.2 L83.7 549.6 L85.8 547.5 L89.3 546.4 L93.6 546.6 L97.8 547.5 L101.0 548.3 L103.0 548.1 L104.3 546.7 L105.7 544.5 L107.6 542.3 L110.0 540.9 L112.7 540.5 L115.4 540.7 L118.2 540.9 L121.4 540.7 L125.1 540.2 L129.2 540.3 L132.6 541.5 L134.4 544.0 L134.3 547.5 L132.6 551.1 L130.4 554.1 L128.9 556.5 L128.7 558.3 L129.3 560.0Z',
  'M165.3 560.0 L164.1 565.0 L162.7 569.9 L162.0 574.9 L162.3 580.6 L162.8 587.2 L162.1 594.0 L159.1 600.2 L153.5 604.8 L146.2 607.2 L138.2 608.0 L130.5 608.0 L123.4 608.1 L116.7 608.5 L110.0 608.6 L103.5 607.7 L97.4 605.2 L92.2 601.7 L87.7 597.9 L83.2 595.0 L77.7 593.2 L70.8 592.1 L63.1 590.7 L55.8 587.9 L50.2 583.6 L47.0 578.1 L45.8 572.0 L45.7 565.9 L45.7 560.0 L45.7 554.1 L46.5 548.1 L49.0 542.5 L53.8 537.8 L60.4 534.5 L67.6 532.3 L74.0 530.5 L78.9 528.1 L82.8 524.5 L86.5 520.0 L91.0 515.4 L96.6 511.9 L103.1 510.0 L110.0 509.5 L116.9 509.5 L124.0 509.5 L131.6 509.4 L139.4 509.9 L146.8 512.0 L152.7 516.1 L156.3 522.1 L157.6 528.8 L157.8 535.4 L158.1 541.0 L159.5 545.8 L161.9 550.3 L164.4 555.0 L165.9 560.0Z',
  'M200.4 560.0 L200.8 568.4 L202.1 577.2 L203.5 586.8 L203.7 597.0 L201.0 606.9 L194.5 615.3 L184.9 621.4 L173.5 625.3 L162.0 627.9 L151.2 630.1 L141.0 632.5 L130.8 634.7 L120.4 635.9 L110.0 635.1 L100.0 632.6 L90.8 629.1 L81.8 626.1 L72.3 624.2 L61.6 623.1 L49.9 621.8 L38.2 618.9 L28.1 613.5 L20.8 605.9 L16.4 597.0 L13.8 587.6 L12.0 578.4 L10.3 569.2 L9.5 560.0 L10.6 550.8 L14.6 542.1 L21.4 534.6 L29.8 528.3 L37.9 522.9 L44.6 517.2 L49.7 510.6 L54.5 502.9 L60.2 495.0 L67.8 488.1 L77.2 483.2 L87.8 480.4 L98.9 478.9 L110.0 477.8 L121.4 476.8 L133.2 476.5 L145.0 478.0 L155.7 482.3 L164.2 489.3 L170.3 498.0 L174.5 507.1 L178.2 515.4 L182.7 522.5 L188.4 529.1 L194.3 535.8 L199.1 543.3 L201.9 551.5 L202.6 560.0Z',
  'M241.2 560.0 L245.1 572.5 L247.8 585.8 L247.1 599.3 L241.7 612.0 L231.6 622.7 L218.5 630.9 L204.3 637.3 L190.6 642.9 L177.8 648.5 L165.2 654.0 L152.0 658.5 L138.1 661.1 L123.9 661.4 L110.0 660.1 L96.5 658.5 L82.8 657.8 L68.1 658.1 L52.3 658.3 L36.0 656.6 L20.7 651.8 L8.2 643.5 L-1.2 632.7 L-7.9 620.7 L-13.1 608.6 L-17.9 596.7 L-21.9 584.7 L-24.0 572.4 L-22.9 560.0 L-18.1 548.2 L-10.8 537.4 L-2.9 527.6 L3.9 518.1 L8.9 507.9 L13.0 496.6 L18.2 484.8 L26.0 473.7 L36.9 464.6 L50.1 458.0 L64.5 453.5 L79.4 450.0 L94.5 447.0 L110.0 444.6 L125.9 444.2 L141.5 446.9 L155.6 453.2 L167.4 462.3 L177.0 472.6 L185.5 482.4 L194.3 490.9 L204.2 498.4 L214.8 506.0 L224.5 514.8 L232.0 525.0 L236.7 536.3 L239.4 548.0 L241.4 560.0Z',
  'M288.5 560.0 L291.7 576.8 L289.3 593.6 L281.0 609.1 L268.1 622.4 L252.9 633.6 L237.8 643.6 L223.7 653.2 L210.0 662.9 L195.8 671.9 L180.0 679.2 L162.9 683.9 L145.2 686.4 L127.6 687.9 L110.0 689.8 L91.8 692.7 L72.2 695.7 L51.6 696.8 L31.2 694.2 L12.7 686.9 L-2.6 675.8 L-14.8 662.3 L-24.9 648.2 L-34.2 634.3 L-42.7 620.3 L-49.6 605.8 L-53.3 590.6 L-52.9 575.0 L-48.9 560.0 L-43.4 545.8 L-38.5 532.2 L-35.3 518.3 L-33.4 503.4 L-30.6 487.6 L-24.7 471.9 L-14.5 457.9 L-0.3 446.6 L16.3 437.8 L34.1 430.7 L52.1 424.4 L70.7 418.9 L90.1 415.1 L110.0 414.7 L129.5 418.4 L147.3 426.0 L163.0 435.7 L177.2 445.6 L191.2 454.0 L206.1 461.2 L221.8 468.3 L237.3 476.7 L250.8 487.4 L261.2 500.3 L268.9 514.4 L274.9 529.1 L280.5 544.2 L285.7 560.0Z',
  'M331.3 560.0 L327.1 580.1 L316.6 598.7 L302.6 615.3 L287.8 630.2 L274.1 644.5 L261.2 658.9 L247.7 672.9 L232.2 685.7 L214.3 696.0 L194.5 703.8 L174.0 709.9 L153.4 715.8 L132.3 722.5 L110.0 729.4 L86.0 734.6 L61.1 735.8 L36.8 731.4 L15.0 721.7 L-3.7 708.4 L-19.9 693.6 L-34.7 678.7 L-48.8 663.8 L-61.6 648.4 L-71.7 631.7 L-77.6 613.8 L-79.3 595.4 L-78.3 577.4 L-77.2 560.0 L-77.7 542.7 L-79.7 524.5 L-81.1 505.2 L-79.2 485.3 L-71.9 466.3 L-59.0 449.5 L-41.9 435.5 L-22.6 423.7 L-2.5 413.1 L18.1 403.4 L39.7 395.3 L62.8 390.3 L86.6 389.7 L110.0 393.7 L131.9 400.9 L152.0 409.0 L171.5 415.9 L191.4 421.3 L212.5 426.2 L233.9 432.6 L254.0 441.9 L271.2 454.6 L285.2 469.7 L296.8 486.2 L307.3 503.4 L317.2 521.2 L325.5 540.1 L329.8 560.0Z',
];

function TopoBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="-100 -100 1100 850"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      {TOPO_PEAK_1.map((d, i) => (
        <path key={`p1-${i}`} d={d} stroke="#fbbf24" strokeWidth={1} opacity={Math.max(0.05, 0.3 - i * 0.04)} />
      ))}
      {TOPO_PEAK_2.map((d, i) => (
        <path key={`p2-${i}`} d={d} stroke="#ffffff" strokeWidth={1} opacity={Math.max(0.04, 0.22 - i * 0.035)} />
      ))}
    </svg>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-amber-700">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function SokkerTilArrangorer() {
  const [form, setForm] = useState({
    race_name: '', contact_name: '', contact_email: '', contact_phone: '',
    estimated_quantity: '', race_date: '', message: '',
  });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    const res = await fetch('/api/sock-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      setStatus('success');
      setForm({ race_name: '', contact_name: '', contact_email: '', contact_phone: '', estimated_quantity: '', race_date: '', message: '' });
    } else {
      setStatus(json.error || 'Noe gikk galt. Prøv igjen.');
    }
  }

  return (
    <>
      <Head>
        <title>Tilpassede løpesokker for arrangører | Langeløp.no</title>
        <meta
          name="description"
          content="Vi designer, bestiller og leverer tilpassede løpesokker med løpets eget logo — til goodiebag eller salg i egne kanaler. Få et uforpliktende tilbud."
        />
        <link rel="canonical" href="https://www.langelop.no/sokker-til-arrangorer" />
        <meta property="og:title" content="Tilpassede løpesokker for arrangører | Langeløp.no" />
        <meta
          property="og:description"
          content="Vi designer, bestiller og leverer tilpassede løpesokker med løpets eget logo — til goodiebag eller salg i egne kanaler."
        />
        <meta property="og:type" content="website" />
      </Head>

      {/* Hero */}
      <div className="relative bg-[#0b1626] overflow-hidden">
        <TopoBackground />
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 mb-4">
                For løpsarrangører
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.1] mb-5">
                Tilpassede løpesokker<br />til <span className="text-amber-400">løpet deres</span>
              </h1>
              <p className="text-gray-400 text-base md:text-lg max-w-lg leading-relaxed mb-8">
                Vi designer, bestiller og leverer løpesokker med løpets eget logo.
                Dere bestemmer bruken — del dem ut i goodiebagen, eller selg dem i
                egen nettbutikk eller på standen.
              </p>
              <a href="#skjema"
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3.5 rounded-xl text-sm hover:bg-gray-100 transition shadow-lg shadow-black/20">
                Spør om pris og design
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="relative w-full max-w-sm mx-auto lg:mx-0">
              <div className="hidden lg:block absolute -right-10 -bottom-10 w-44 h-44 rotate-[9deg] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10">
                <Image
                  src="/sokker-til-arrangorer/mockup-eksempel-2.webp"
                  alt="Eksempel på løpesokk i sort med tilpasset løpslogo"
                  fill
                  sizes="180px"
                  className="object-cover"
                  style={{ objectPosition: '50% 70%' }}
                />
              </div>
              <div className="absolute -inset-3 translate-x-3 translate-y-3 rotate-[-4deg] rounded-[2rem] border-2 border-amber-400/60" />
              <div
                className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] ring-1 ring-white/10 p-8 rotate-[1.5deg]"
                style={{ clipPath: 'polygon(14% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 16%)' }}
              >
                <div
                  className="relative w-full h-full bg-[#f1f0ed]"
                  style={{ clipPath: 'polygon(11% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 13%)' }}
                >
                  <Image
                    src="/sokker-til-arrangorer/mockup-eksempel-1.webp"
                    alt="Eksempel på løpesokk med tilpasset løpslogo"
                    fill
                    priority
                    sizes="(max-width: 1024px) 60vw, 400px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troverdighet */}
      <div className="bg-white py-5 px-4 border-b border-gray-100">
        <p className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          Samme design- og produksjonsprosess som sokkene vi selger i{' '}
          <a href="/shop" className="text-amber-700 font-medium hover:underline">vår egen nettbutikk</a>.
        </p>
      </div>

      {/* Slik fungerer det */}
      <div className="bg-gray-50 py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Slik fungerer det</h2>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-[22px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEG.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.tittel} className="relative">
                    <div className="relative inline-flex items-center justify-center w-11 h-11 rounded-full bg-amber-50 text-amber-700 ring-4 ring-gray-50 mb-4">
                      <Icon size={19} strokeWidth={2} />
                      <span className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#0b1626] text-white text-[10px] font-bold">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1.5">{s.tittel}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.tekst}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hvorfor sokker */}
      <div className="bg-white py-16 md:py-20 px-4 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
              Fleksibelt, uansett<br />hvordan dere vil bruke dem
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Enten sokkene skal ut i goodiebagen eller selges som eget produkt,
              tar vi hånd om design, innkjøp og kvalitet — fra første skisse til
              ferdig sokk.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {HVORFOR.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.tittel} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{f.tittel}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.tekst}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Skjema */}
      <div id="skjema" className="bg-gray-50 py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-0 bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">

            {/* Venstre: pitch */}
            <div className="bg-[#0b1626] text-white p-8 md:p-10 flex flex-col justify-center">
              <h2 className="text-2xl font-extrabold mb-3">Fortell oss om løpet</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Pris avhenger av antall og design, så vi sender et konkret forslag
                basert på det dere skriver her. Ta kontakt tidlig — det gir oss
                bedre tid til design og produksjon før løpsdagen.
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400 shrink-0" /> Du ser forslaget før noe er bestemt</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400 shrink-0" /> Pris og antall tilpasses løpet deres</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-amber-400 shrink-0" /> Det er oss du svarer med, ikke et skjema</li>
              </ul>
            </div>

            {/* Høyre: skjema */}
            <div className="p-8 md:p-10">
              {status === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Takk for henvendelsen!</h3>
                  <p className="text-sm text-gray-500">Vi tar kontakt innen kort tid med et forslag.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field label="Løpets navn" required>
                    <input className={inputCls} value={form.race_name}
                      onChange={(e) => setForm((f) => ({ ...f, race_name: e.target.value }))} required />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Løpsdato">
                      <input type="date" className={inputCls} value={form.race_date}
                        onChange={(e) => setForm((f) => ({ ...f, race_date: e.target.value }))} />
                    </Field>
                    <Field label="Antall deltakere (ca.)">
                      <input className={inputCls} placeholder="f.eks. 150"
                        value={form.estimated_quantity}
                        onChange={(e) => setForm((f) => ({ ...f, estimated_quantity: e.target.value }))} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Kontaktperson" required>
                      <input className={inputCls} value={form.contact_name}
                        onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} required />
                    </Field>
                    <Field label="Telefon">
                      <input className={inputCls} value={form.contact_phone}
                        onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} />
                    </Field>
                  </div>

                  <Field label="E-post" required>
                    <input type="email" className={inputCls} value={form.contact_email}
                      onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} required />
                  </Field>

                  <Field label="Designønsker eller annet">
                    <textarea className={inputCls} rows={3}
                      placeholder="Logo, farger, budsjett eller annet dere har i tankene..."
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
                  </Field>

                  {typeof status === 'string' && status !== 'success' && (
                    <p className="text-red-500 text-sm">{status}</p>
                  )}

                  <button type="submit" disabled={sending}
                    className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3.5 rounded-xl text-sm transition disabled:opacity-60">
                    {sending ? 'Sender...' : <>Send henvendelse <ArrowRight size={16} /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
