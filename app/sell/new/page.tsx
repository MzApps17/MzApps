"use client";
import { useSearchParams, useRouter } from "next/navigation";

export default function NewSell(){
  const cat=useSearchParams().get("cat") || "All";
  const router=useRouter();
  
  // Category a zirin a postna tur hawn sak ang
  if(cat==="Jobs"){ router.push("/jobs/new"); return null; }
  if(cat==="Properties"){ router.push("/marketplace/new?cat=Properties"); return null; }
  router.push(`/marketplace/new?cat=${cat}`);
  return <p className="p-6 text-center">Loading {cat}...</p>;
}
