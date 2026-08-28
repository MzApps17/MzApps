"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

export default function Home(){
  const [ads,setAds]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");

  useEffect(()=>{(async()=>{
    const s=await getDocs(collection(db,"products"));
    setAds(s.docs.map(d=>({id:d.id,...d.data() as any})));
  })()},[]);

  const cats=["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion"];
  const filtered=ads.filter(a=>{
    const s=search.toLowerCase();
    const match =!search || a.title?.toLowerCase().includes(s);
    const matchCat = cat==="All" || a.category===cat;
    return match && matchCat;
  });

  return (
    <main style={{minHeight:"100vh", background:"#f2f2f2", paddingBottom:70}}>
      <div style={{background:"#fff", position:"sticky", top:0, zIndex:20, padding:12}}>
        <div style={{display:"flex", alignItems:"center", border:"1px solid #ccc", borderRadius:6, padding:"10px 12px"}}>
          <span style={{marginRight:8}}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile Phones and more..." style={{flex:1, outline:"none", border:"none", fontSize:14}}/>
        </div>
        <div style={{display:"flex", gap:8, overflowX:"auto", marginTop:12, paddingBottom:4}}>
          {cats.map(c=>
            <button key={c} onClick={()=>setCat(c)} style={{whiteSpace:"nowrap", padding:"6px 14px", borderRadius:20, border:"1px solid #002f34", fontSize:12, fontWeight:"bold", background:cat===c?"#002f34":"#fff", color:cat===c?"#fff":"#002f34"}}>{c}</button>
          )}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"#ddd"}}>
        {filtered.map(ad=>(
          <Link key={ad.id} href={`/marketplace/${ad.id}`} style={{background:"#fff", padding:8, textDecoration:"none", color:"black"}}>
            <img src={ad.image || ad.images?.[0]} style={{width:"100%", height:140, objectFit:"cover"}}/>
            <p style={{fontWeight:"bold", marginTop:8, fontSize:16}}>₹ {ad.price}</p>
            <p style={{fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{ad.title}</p>
            <p style={{fontSize:10, color:"gray", marginTop:8}}>{ad.location || "MIZORAM"} • TODAY</p>
          </Link>
        ))}
      </div>

      <div style={{position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"1px solid #ddd", display:"flex", justifyContent:"space-around", padding:"8px 0", zIndex:30}}>
        <Link href="/" style={{display:"flex", flexDirection:"column", alignItems:"center", textDecoration:"none", color:"#002f34", fontSize:10, fontWeight:"bold"}}><span style={{fontSize:20}}>⌂</span>HOME</Link>
        <Link href="/profile" style={{display:"flex", flexDirection:"column", alignItems:"center", textDecoration:"none", color:"gray", fontSize:10}}><span style={{fontSize:20}}>≡</span>MY ADS</Link>
        <Link href="/sell" style={{display:"flex", flexDirection:"column", alignItems:"center", textDecoration:"none", color:"black", fontSize:10}}><div style={{width:38, height:38, border:"3px solid #002f34", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:"bold", marginTop:-8}}>+</div>SELL</Link>
        <Link href="/profile" style={{display:"flex", flexDirection:"column", alignItems:"center", textDecoration:"none", color:"gray", fontSize:10}}><span style={{fontSize:20}}>◯</span>ACCOUNT</Link>
      </div>
    </main>
  );
}
