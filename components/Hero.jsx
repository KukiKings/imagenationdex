// components/Hero.jsx
import dynamic from 'next/dynamic';
import Link from 'next/link';
const ConnectWallet = dynamic(() => import('./ConnectWallet'), { ssr: false });

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-24 bg-gradient-to-b from-green-900 to-black">
      <h1 className="text-5xl font-extrabold text-white mb-4">
        IN$DEX: The AI‑Powered Web3 Marketplace
      </h1>
      <p className="text-xl text-gray-300 mb-8 max-w-xl">
        Peer‑to‑peer commerce · credit‑card on‑ramp · zero‑KYC onboarding
      </p>
      <div className="flex space-x-4">
        <ConnectWallet className="px-6 py-3 bg-yellow-500 rounded-2xl font-semibold hover:opacity-90" />
        <Link href="#waitlist">
          <a className="px-6 py-3 border border-yellow-500 text-yellow-500 rounded-2xl font-semibold hover:bg-yellow-500 hover:text-black transition">
            Join Waitlist
          </a>
        </Link>
      </div>
    </section>
  );
}
