"use client";
import { useState, Suspense } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function NewProductForm(){
  const {user}=useAuth();
  const router=useRouter();
  const searchParams=useSearchParams();
  const category=searchParams.get("cat") || "Others";

  const [itemName,setItemName]=useState("");
  const [village,setVillage]=useState("");
  const [district,setDistrict]=useState("");
  const [price,setPrice]=useState("");
  const [phone,setPhone]=useState("");
  const [description,setDescription]=useState("");
  const [images,setImages]=useState<string[]>([]);
  const [loading,setLoading]=useState(false);
  const [showSuccess,setShowSuccess]=useState(false);
  const [showError,setShowError]=useState("");

  const districts=["Aizawl","Lunglei","Saiha","Champhai","Kolasib","Serchhip","Lawngtlai","Mamit","Saitual","Khawzawl","Hnahthial"];

  const handleImage=(e:any)=>{
    const files=e.target.files;
    if(!files) return;
    if(images.length + files.length > 5){ setShowError("Pic 5 chiah upload theih!"); return; }
    Array.from(files).forEach((file:any)=>{
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
    if(!user){ setShowError("Login phawt rawh"); return; }
    if(!itemName||!village||!district||!price||!phone){ setShowError("Fill vek rawh Boss"); return; }
    if(phone.length < 9){ setShowError("Phone number dik lo"); return; }
    if(images.length===0){ setShowError("Thlalak 1 tal thlang rawh"); return; }
    setLoading(true);
    try{
      await addDoc(collection(db,"products"),{
        title:itemName, category, village, district,
        location:`${village}, ${district}`,
        price:Number(price), phone, description,
        image:images[0], images,
        uid:user.uid, userEmail:user.email,
        createdAt:serverTimestamp(),
      });
      setShowSuccess(true);
    }catch(err:any){ setShowError(err.message); }
    setLoading(false);
  };

  return (
    <main className="bg-white min-h-screen pb-24">
      <div className="flex items-center gap-4 p-4 border-b sticky top-0 bg-white z-10">
        <Link href="/sell" className="w-10 h-10 flex items-center justify-center -ml-2">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </Link>
        <h1 className="font-black text-[22px] text-black">Create Post</h1>
      </div>

      <form onSubmit={submit} className="p-4 flex flex-col gap-4">
        {/* 1 - Item Name - Ahmasa ber */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Item Name</label>
          <input value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="Item name" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Village</label>
          <input value={village} onChange={e=>setVillage(e.target.value)} placeholder="Village" className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block">District</label>
          <select value={district} onChange={e=>setDistrict(e.target.value)} className="w-full border border-gray-300 rounded-xl p-4 bg-white outline-none focus:border-black">
            <option value="">District</option>
            {districts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Price</label>
          <input value={price} onChange={e=>setPrice(e.target.value)} type="number" placeholder="Price" className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Phone Number</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="WhatsApp Number" className="w-full border-2 border-black rounded-xl p-4 bg-[#f7f7f7] outline-none focus:bg-white"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Thil chanchin chipchiar deuhin ziak rawh..." rows={4} className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black resize-none"></textarea>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Photos ({images.length}/5)</label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img,i)=>(
              <div key={i} className="relative h-28 rounded-xl overflow-hidden border">
                <img src={img} className="w-full h-full object-cover"/>
                <button type="button" onClick={()=>setImages(p=>p.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 bg-black text-white w-6 h-6 rounded-full text-xs">✕</button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="h-28 border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 active:bg-gray-100">
                <span className="text-3xl font-black">+</span><span className="text-[11px] font-bold">Add Photo</span>
                <input type="file" accept="image/*" multiple hidden onChange={handleImage}/>
              </label>
            )}
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-black text-white font-black text-[16px] py-4 rounded-2xl mt-2 active:scale-[0.98] disabled:opacity-50">
          {loading?"Posting...":"Create Post"}
        </button>
      </form>

      {/* SUCCESS MODAL - Mawi deuh - mz-apps says awm lo */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-7 w-full max-w-[320px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">✓</div>
            <h2 className="font-black text-[18px] mb-1">Post Create Successful!</h2>
            <button onClick={()=>{ setShowSuccess(false); router.push("/"); }} className="w-full bg-black text-white font-black py-3.5 rounded-xl">OK</button>
          </div>
        </div>
      )}

      {/* ERROR MODAL - Mawi deuh */}
      {showError && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-7 w-full max-w-[320px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">!</div>
            <h2 className="font-black text-[16px] mb-2">{showError}</h2>
            <button onClick={()=>setShowError("")} className="w-full bg-black text-white font-black py-3.5 rounded-xl mt-3">OK</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function NewProduct(){
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading...</div>}>
      <NewProductForm/>
    </Suspense>
  );
}
