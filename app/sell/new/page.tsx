"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SellNewContent(){
  const cat=useSearchParams().get("cat") || "All";
  const router=useRouter();
  
  if(typeof window!=="undefined"){
    if(cat==="Jobs"){ router.push("/jobs/new"); }
    else if(cat==="Properties"){ router.push("/marketplace/new?cat=Properties"); }
    else { router.push(`/marketplace/new?cat=${cat}`); }
  }
  return <p className="p-6 text-center">Loading {cat}...</p>;
}

export default function NewSell(){
  return (
    <Suspense fallback={<p className="p-6 text-center">Loading...</p>}>
      <SellNewContent />
    </Suspense>
  );
}
