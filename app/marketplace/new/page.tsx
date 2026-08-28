"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NewProduct(){
  const {user}=useAuth();
  const router=useRouter();
  const searchParams=useSearchParams();
  const defaultCat=searchParams.get("cat") || "";

  const [category,setCategory]=useState(defaultCat);
  const [itemName,setItemName]=useState("");
  const [village,setVillage]=useState("");
  const [district,setDistrict]=useState("");
  const [price,setPrice]=useState("");
  const [phone,setPhone]=useState("");
  const [images,setImages]=useState<string[]>([]);
  const [loading,setLoading]=useState(false);

  const districts=["Aizawl","Lunglei","Saiha","Champhai","Kolasib","Serchhip","Lawngtlai","Mamit","Saitual","Khawzawl","Hnahthial"];

  const handleImage=(e:any)=>{
    const files=e.target.files;
    if(!files) return;
    if(images.length + files.length > 5) return alert("Pic 5 chiah theih!");
    Array.from(files).forEach((file:any)=>{
      if(file.size>3*1024*1024) return alert(`${file.name} lian lutuk`);
      const reader=new FileReader();
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{
          const canvas=document.createElement("canvas");
          let w=img.width, h=img.height;
          const MAX=800;
          if(w>MAX){ h=h*(MAX/w); w=MAX; }
          canvas.width=w; canvas.height=h;
          canvas.getContext("2d")?.drawImage(img,0,0,w,h);
          const comp=canvas.toDataURL("image/jpeg",0.65);
          setImages(p=>[...p,comp].slice(0,5));
        };
        img.src=reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const submit=async(e:any)=>{
    e.preventDefault();
    if(!user) return alert("Login rawh");
    if(!category) return alert("Category thlang rawh");
    if(!itemName||!village||!district||!price||!phone) return alert("Fill vek rawh");
    if(phone.length < 9) return alert("Phone number dik lo");
    if(images.length===0) return alert("Thlalak thlang rawh");
    
    setLoading(true);
    try{
      // ImgBB nilo in Firestore ah direct kan dah (storage ngai lo)
      await addDoc(collection(db,"products"),{
        title:itemName,
        category:category,
        village:village,
        district:district,
        location:`${village}, ${district}`,
        price:Number(price),
        phone:phone,
        image:images[0],
        images:images,
        uid:user.uid,
        userEmail:user.email,
        createdAt:serverTimestamp(),
      });
      alert("Post hlawhtling!");
      router.push("/");
    }catch(err:any){
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <main className="bg-white min-h-screen pb-24">
      {/* HEADER - Arrow Lian + Create Post */}
      <div className="flex items-center gap-4 p-4 border-b sticky top-0 bg-white z-10">
        <Link href="/sell" className="w-10 h-10 flex items-center justify-center -ml-2">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <h1 className="font-black text-[22px] text-black">Create Post</h1>
      </div>

      <form onSubmit={submit} className="p-4 flex flex-col gap-4">
        {/* 1 Category - Thil zuarh tih aiah Category */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Category</label>
          <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Category" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black font-bold"/>
        </div>

        {/* 2 Item name */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Item Name</label>
          <input value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="Item name" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>

        {/* 3 Village */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Village</label>
          <input value={village} onChange={e=>setVillage(e.target.value)} placeholder="Village" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>

        {/* 4 District */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">District</label>
          <select value={district} onChange={e=>setDistrict(e.target.value)} className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black bg-white">
            <option value="">District</option>
            {districts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* 5 Price */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Price</label>
          <input value={price} onChange={e=>setPrice(e.target.value)} type="number" placeholder="Price" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>

        {/* 6 Phone */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Phone Number</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="WhatsApp Number 9612XXXXXX" className="w-full border-2 border-black rounded-xl p-4 text-[15px] outline-none bg-[#f7f7f7] focus:bg-white"/>
          <p className="text-[11px] text-gray-600 mt-1.5 ml-1">He number ah hian min lo be dawn che - Call & WhatsApp</p>
        </div>

        {/* Pic 5 thleng - pakhat upload zawh ah dang rawn awm */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Photos ({images.length}/5)</label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img,i)=>(
              <div key={i} className="relative h-28 rounded-xl overflow-hidden border">
                <img src={img} className="w-full h-full object-cover"/>
                <button type="button" onClick={()=>setImages(p=>p.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 bg-black text-white w-6 h-6 rounded-full text-xs">✕</button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="h-28 border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 active:bg-gray-100">
                <span className="text-3xl font-black">+</span>
                <span className="text-[11px] font-bold">Add Photo</span>
                <input type="file" accept="image/*" multiple hidden onChange={handleImage}/>
              </label>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Pakhat upload zawh ah adang upload na rawn awm leh zel ang</p>
        </div>

        {/* Button Dum - Create Post */}
        <button type="submit" disabled={loading} className="w-full bg-black text-white font-black text-[16px] py-4 rounded-2xl mt-2 active:scale-[0.98] transition disabled:opacity-50">
          {loading?"Posting...":"Create Post"}
        </button>
      </form>
    </main>
  );
      }
