import Link from "next/link";
export default function Home(){
  return (
    <main className="p-10 text-center">
      <h1 className="text-3xl font-bold">MzApps</h1>
      <p className="text-sm text-gray-500 mt-2">Mizo Marketplace & Jobs</p>
      <div className="mt-8 grid gap-3 max-w-xs mx-auto">
        <Link href="/marketplace" className="bg-blue-600 text-white p-4 rounded-xl font-bold text-center">MzMarketplace</Link>
        <Link href="/jobs" className="bg-black text-white p-4 rounded-xl font-bold text-center">MzJobs</Link>
      </div>
    </main>
  )
}
