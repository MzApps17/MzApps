"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";

export default function EditProductPage(){
  const {user}=useAuth();
  const router=useRouter();
  const params=useParams();
  const id = params.id as string;

  const [itemName,setItemName]=useState("");
  const [village,setVillage]=useState("");
  const [district,setDistrict]=useState("");
  const [price,setPrice]=useState("");
  const [phone,setPhone]=useState("");
  const [description,setDescription]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  const districts=["Aizawl","Lunglei","Saiha","Champhai","Kolasib","Serchhip","Lawngtlai","Mamit","Saitual","Khawzawl","Hnahthial"];

  useEffect(()=>{
    const fetchData = async ()=>{
      const snap = await getDoc(doc(db,"products",id));
      if(snap.exists()){
        const d:any = snap.data();
        setItemName(d.title||"");
        setVillage(d.village||"");
        setDistrict(d.district||"");
        setPrice(d.price?.toString()||"");
        setPhone(d.phone||"");
        setDescription(d.description||"");
      }
      setLoading(false);
    };
    if(id) fetchData();
  },[id]);

  const handleUpdate = async (e:any)=>{
    e.preventDefault();
    setSaving(true);
    try{
      await updateDoc(doc(db,"products",id),{
        title:itemName,
        village,
        district,
        location:`${village}, ${district}`,
        price:Number(price),
        phone,
        description,
      });
      router.push("/my-ads");
    }catch(err:any){ alert(err.message); }
    setSaving(false);
  };

  if(loading) return <div className="p-10 text-center font-black">Loading...</div>;

  return(
    <main className="bg-white min-h-screen pb-24">
      <div className="flex items-center gap-4 p-4 border-b sticky top-0 bg-white z-10">
        <button onClick={()=>router.back()} className="w-10 h-10 flex items-center justify-center -ml-2">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-black text-[22px] text-black">Edit Post</h1>
      </div>

      <form onSubmit={handleUpdate} className="p-4 flex flex-col gap-4">
        <div><label className="text-[13px] font-black mb-1.5 block">Item Name</label><input value={itemName} onChange={e=>setItemName(e.target.value)} className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-black"/></div>
        <div><label className="text-[13px] font-black mb-1.5 block">Village</label><input value={village} onChange={e=>setVillage(e.target.value)} className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-black"/></div>
        <div><label className="text-[13px] font-black mb-1.5 block">District</label><select value={district} onChange={e=>setDistrict(e.target.value)} className="w-full border border-gray-300 rounded-xl p-4 bg-white outline-none focus:border-black">{districts.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        <div><label className="text-[13px] font-black mb-1.5 block">Price</label><input value={price} onChange={e=>setPrice(e.target.value)} type="number" className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-black"/></div>
        <div><label className="text-[13px] font-black mb-1.5 block">Phone Number</label><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" className="w-full border-2 border-black rounded-xl p-4 bg-[#f7f7f7] outline-none focus:bg-white"/></div>
        <div><label className="text-[13px] font-black mb-1.5 block">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-black resize-none"></textarea></div>

        <button type="submit" disabled={saving} className="w-full bg-black text-white font-black text-[16px] py-4 rounded-2xl mt-2 active:scale-[0.98] disabled:opacity-50">
          {saving?"Saving...":"Update Post"}
        </button>
      </form>
    </main>
  );
}
