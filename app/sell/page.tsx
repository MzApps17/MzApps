"use client";
import Link from "next/link";

const cats=[
  {name:"Cars", icon:"🚗"},
  {name:"Properties", icon:"🏢"},
  {name:"Mobiles", icon:"📱"},
  {name:"Jobs", icon:"💼"},
  {name:"Bikes", icon:"🏍️"},
  {name:"Electronics & Appliances", icon:"📺"},
  {name:"Commercial Vehicles", icon:"🚚"},
  {name:"Furniture", icon:"🛋️"},
  {name:"Fashion", icon:"👕"},
  {name:"Books, Sports", icon:"🎸"},
  {name:"Pets", icon:"🐶"},
  {name:"Services", icon:"🛠️"},
];

export default function Sell(){
  return <main className="bg-white min-h-screen">
    <div className="flex items-center gap-4 p-4 border-b">
    <h2 className="font-bold text-lg">Categories</h2>
    </div>
    <div className="grid grid-cols-2">
      {cats.map(c=>
        <Link key={c.name} href={`/sell/new?cat=${c.name}`} className="border-b border-r p-6 flex flex-col items-center text-center">
          <div className="text-4xl mb-2">{c.icon}</div>
          <p className="text-sm font-bold">{c.name}</p>
        </Link>
      )}
    </div>
  </main>
}
