import Head from 'next/head'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <Head>
        <title>IN$DEX | Image Nation DEX</title>
      </Head>
      <main className="text-center">
        <h1 className="text-5xl font-bold text-neon">IN$DEX is Live</h1>
        <p className="mt-4">Welcome to the future of P2P merch trading on Solana.</p>
        <div className="mt-6">🚀 Launch countdown: July 28, 12:00PM AEST</div>
        <div className="mt-4">
          <input type="text" placeholder="Enter your referral code" className="p-2 rounded text-black" />
        </div>
        <div className="mt-4">
          <button className="bg-neon text-black py-2 px-4 rounded">Claim XP</button>
        </div>
      </main>
    </div>
  )
}
