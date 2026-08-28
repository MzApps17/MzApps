"use client";
import { useState, Suspense, useEffect } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

function NewJobForm(){
  const {user}=useAuth();
  const router=useRouter();

  const [jobTitle,setJobTitle]=useState("");
  const [company,setCompany]=useState("");
  const [village,setVillage]=useState("");
  const [district,setDistrict]=useState("");
  const [salary,setSalary]=useState("");
  const [phone,setPhone]=useState("");
  const [description,setDescription]=useState("");
  const [loading,setLoading]=useState(false);
  const [showSuccess,setShowSuccess]=useState(false);
  const [showError,setShowError]=useState("");

  const districts=["Aizawl","Lunglei","Saiha","Champhai","Kolasib","Serchhip","Lawngtlai","Mamit","Saitual","Khawzawl","Hnahthial"];

  // Phone back button fix
  useEffect(()=>{
    window.history.pushState({page:"create-job"}, "", window.location.href);
    const onPopState = () => {
      if(showSuccess || showError){
        setShowSuccess(false);
        setShowError("");
        window.history.pushState({page:"create-job"}, "", window.location.href);
      } else {
        router.replace("/sell");
      }
    };
    window.addEventListener("popstate", onPopState);
    return ()=> window.removeEventListener("popstate", onPopState);
  }, [showSuccess, showError, router]);

  const submit=async(e:any)=>{
    e.preventDefault();
    if(!user){ setShowError("Login hmasa rawh"); return; }
    if(!jobTitle||!company||!village||!district||!salary||!phone){ setShowError("Fillup vek rawh"); return; }
    if(phone.length < 9){ setShowError("Phone number dik lo"); return; }
    setLoading(true);
    try{
      await addDoc(collection(db,"jobs"),{
        title: jobTitle,
        company,
        village,
        district,
        location: `${village}, ${district}`,
        salary: Number(salary),
        phone,
        description,
        uid: user.uid,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
      });
      setShowSuccess(true);
    }catch(err:any){ setShowError(err.message); }
    setLoading(false);
  };

  return (
    <main className="bg-white min-h-screen pb-24">
      {/* Chung ber - Arrow Lian + Create Post ang chiah */}
      <div className="flex items-center gap-4 p-4 border-b sticky top-0 bg-white z-10">
        <button onClick={()=>router.replace("/sell")} className="w-10 h-10 flex items-center justify-center -ml-2">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-black text-[22px] text-black">Create Post</h1>
      </div>

      <form onSubmit={submit} className="p-4 flex flex-col gap-4">
        {/* 1 - Hna hming */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Hna Hming</label>
          <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="Hna hming - e.g. Sales Boy" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>
        {/* 2 - Company */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Company / Dawr Hming</label>
          <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company/Dawr hming" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>
        {/* 3 - Village */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Village</label>
          <input value={village} onChange={e=>setVillage(e.target.value)} placeholder="Village" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>
        {/* 4 - District */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">District</label>
          <select value={district} onChange={e=>setDistrict(e.target.value)} className="w-full border border-gray-300 rounded-xl p-4 bg-white outline-none focus:border-black">
            <option value="">District</option>
            {districts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* 5 - Salary */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Hlawh / Salary</label>
          <input value={salary} onChange={e=>setSalary(e.target.value)} type="number" placeholder="Hlawh - 15000" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black"/>
        </div>
        {/* 6 - Phone */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Phone Number</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="Contact No. 9612XXXXXX" className="w-full border-2 border-black rounded-xl p-4 bg-[#f7f7f7] outline-none focus:bg-white"/>
        </div>
        {/* 7 - Description */}
        <div>
          <label className="text-[13px] font-black mb-1.5 block">Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Hna chungchang chipchiar deuhin ziak rawh..." rows={4} className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black resize-none"></textarea>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-black text-white font-black text-[16px] py-4 rounded-2xl mt-2 active:scale-[0.98] disabled:opacity-50">
          {loading?"Posting...":"Post rawh"}
        </button>
      </form>

      {/* Success Modal - Bike post ang chiah */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-7 w-full max-w-[320px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">✓</div>
            <h2 className="font-black text-[18px] mb-1">Post Create Successful!</h2>
            <button onClick={()=>{ setShowSuccess(false); router.replace("/"); }} className="w-full bg-black text-white font-black py-3.5 rounded-xl">OK</button>
          </div>
        </div>
      )}

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

export default function NewJobPage(){
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading...</div>}>
      <NewJobForm/>
    </Suspense>
  );
}
