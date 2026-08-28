import Link from "next/link";

export default function Home(){
  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      {/* HEADER */}
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-black">MZ APPS</h1>
        <p className="text-gray-500 text-sm mt-1">Mizoram Super App • Bazar • Jobs • News</p>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-2 gap-4">
        {/* MARKETPLACE */}
        <Link href="/marketplace" className="bg-white rounded-[24px] p-5 border shadow-sm hover:shadow-md transition">
          <div className="text-4xl mb-3">🛒</div>
          <p className="font-black text-lg">Bazar</p>
          <p className="text-xs text-gray-500 mt-1">Thil zuar & lei</p>
          <p className="text-[11px] mt-3 bg-blue-50 text-blue-600 px-2 py-1 rounded-full inline-block">Thil 100+ awm</p>
        </Link>

        {/* JOBS */}
        <Link href="/jobs" className="bg-black text-white rounded-[24px] p-5 shadow-sm hover:shadow-md transition">
          <div className="text-4xl mb-3">💼</div>
          <p className="font-black text-lg">Jobs</p>
          <p className="text-xs text-gray-300 mt-1">Hnaruak zawng</p>
          <p className="text-[11px] mt-3 bg-white/20 px-2 py-1 rounded-full inline-block">Hna thar</p>
        </Link>

        {/* NEWS - SOON */}
        <Link href="/news" className="bg-white rounded-[24px] p-5 border shadow-sm opacity-70">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-black text-lg">News</p>
          <p className="text-xs text-gray-500 mt-1">Chanchin thar</p>
          <span className="text-[10px] mt-3 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full inline-block">Coming Soon</span>
        </Link>

        {/* RENTAL - SOON */}
        <Link href="/marketplace" className="bg-white rounded-[24px] p-5 border shadow-sm opacity-70">
          <div className="text-4xl mb-3">🏠</div>
          <p className="font-black text-lg">In Luah</p>
          <p className="text-xs text-gray-500 mt-1">In & Room</p>
          <span className="text-[10px] mt-3 bg-gray-100 px-2 py-1 rounded-full inline-block">Soon</span>
        </Link>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/marketplace/new" className="bg-blue-600 text-white p-4 rounded-2xl text-center font-bold">+ Thil Zuarh</Link>
        <Link href="/jobs/new" className="bg-white border-2 border-black p-4 rounded-2xl text-center font-bold">+ Hnaruak Post</Link>
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-8">Made for Mizoram ❤️ • v1.0</p>
    </main>
  )
}
