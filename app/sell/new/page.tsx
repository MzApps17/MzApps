"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SellNewContent(){
  const cat=useSearchParams().get("cat") || "";
  const router=useRouter();

  useEffect(()=>{
    if(!cat) return;
    if(cat==="Jobs"){ 
      router.replace("/jobs/new"); 
    } else { 
      router.replace(`/marketplace/new?cat=${encodeURIComponent(cat)}`); 
    }
  }, [cat, router]);

  return <p className="p-6 text-center">Loading...</p>
}

export default function NewSell(){
  return (
    <Suspense fallback={<p className="p-6 text-center">Loading...</p>}>
      <SellNewContent />
    </Suspense>
  );
}
