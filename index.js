import Head from 'next/head'
export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <Head>
        <title>IN$DEX | Image Nation DEX</title>
      </Head>
      <main className="text-center">
        <h1 className="text-4xl font-bold text-neon">IN$DEX is Live</h1>
        <p className="mt-4">Welcome to the future of P2P merch trading. Powered by Solana. No KYC. 100% Decentralized.</p>
        <div className="mt-6">🚀 Launch countdown: July 28, 12:00PM AEST</div>
      </main>
    </div>
  )
}
