"use client";
import { useState, useEffect, Suspense } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";

function EditJobForm(){
  const {user}=useAuth();
  const router=useRouter();
  const params=useParams();
  const id = params.id as string;

  const [jobTitle,setJobTitle]=useState("");
  const [company,setCompany]=useState("");
  const [village,setVillage]=useState("");
  const [district,setDistrict]=useState("");
  const [salary,setSalary]=useState("");
  const [phone,setPhone]=useState("");
  const [description,setDescription]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [showSuccess,setShowSuccess]=useState(false);
  const [showError,setShowError]=useState("");

  const districts=["Aizawl","Lunglei","Saiha","Champhai","Kolasib","Serchhip","Lawngtlai","Mamit","Saitual","Khawzawl","Hnahthial"];

  useEffect(()=>{
    window.history.pushState({page:"edit-job"}, "", window.location.href);
    const onPopState = () => {
      if(showSuccess || showError){
        setShowSuccess(false);
        setShowError("");
        window.history.pushState({page:"edit-job"}, "", window.location.href);
      } else {
        router.replace("/my-ads");
      }
    };
    window.addEventListener("popstate", onPopState);
    return ()=> window.removeEventListener("popstate", onPopState);
  }, [showSuccess, showError, router]);

  useEffect(()=>{
    const fetchData = async ()=>{
      try{
        const snap = await getDoc(doc(db,"jobs",id));
        if(snap.exists()){
          const d:any = snap.data();
          if(d.uid!== user?.uid && d.userId!== user?.uid){
            setShowError("I ta a ni lo");
            return;
          }
          setJobTitle(d.title||"");
          setCompany(d.company||"");
          setVillage(d.village||"");
          setDistrict(d.district||"");
          setSalary(d.salary?.toString()||"");
          setPhone(d.phone||"");
          setDescription(d.description||"");
        } else {
          setShowError("Job hmuh loh");
        }
      }catch(e:any){
        setShowError(e.message);
      }
      setLoading(false);
    };
    if(id && user) fetchData();
  },[id, user]);

  const handleUpdate = async (e:any)=>{
    e.preventDefault();
    if(!jobTitle||!company||!village||!district||!salary||!phone){ setShowError("Fillup vek rawh"); return; }
    setSaving(true);
    try{
      await updateDoc(doc(db,"jobs",id),{
        title: jobTitle,
        company,
        village,
        district,
        location: `${village}, ${district}`,
        salary: Number(salary),
        phone,
        description,
        userId: user?.uid,
        uid: user?.uid,
      });
      setShowSuccess(true);
    }catch(err:any){
      setShowError(err.message);
    }
    setSaving(false);
  };

  if(loading) return <div className="p-10 text-center font-black text-black">Loading...</div>;

  return(
    <main className="bg-white min-h-screen pb-24">
      <div className="flex items-center gap-4 p-4 border-b sticky top-0 bg-white z-10">
        <button onClick={()=>router.replace("/my-ads")} className="w-10 h-10 flex items-center justify-center -ml-2">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-black text-[22px] text-black">Edit Job Post</h1>
      </div>

      <form onSubmit={handleUpdate} className="p-4 flex flex-col gap-4">
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Hna Hming</label>
          <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="Hna hming - e.g. Sales Boy" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black text-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Company / Dawr Hming</label>
          <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company/Dawr hming" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black text-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Village</label>
          <input value={village} onChange={e=>setVillage(e.target.value)} placeholder="Village" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black text-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">District</label>
          <select value={district} onChange={e=>setDistrict(e.target.value)} className="w-full border border-gray-300 rounded-xl p-4 bg-white outline-none focus:border-black text-black">
            <option value="">District</option>
            {districts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Hlawh / Salary</label>
          <input value={salary} onChange={e=>setSalary(e.target.value)} type="number" placeholder="Hlawh - 15000" className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black text-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Phone Number</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" placeholder="Contact No. 9612XXXXXX" className="w-full border-2 border-black rounded-xl p-4 bg-[#f7f7f7] outline-none focus:bg-white text-black"/>
        </div>
        <div>
          <label className="text-[13px] font-black mb-1.5 block text-black">Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Hna chungchang chipchiar deuhin ziak rawh..." rows={4} className="w-full border border-gray-300 rounded-xl p-4 text-[15px] outline-none focus:border-black resize-none text-black"></textarea>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-black text-white font-black text-[16px] py-4 rounded-2xl mt-2 active:scale-[0.98] disabled:opacity-50">
          {saving?"Saving...":"Update rawh"}
        </button>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-7 w-full max-w-[320px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl">✓</div>
            <h2 className="font-black text-[18px] mb-1 text-black">Update Successful!</h2>
            <p className="text-[13px] text-gray-500 mb-4">I job post a update ta!</p>
            <button onClick={()=>{ setShowSuccess(false); router.replace("/my-ads"); }} className="w-full bg-black text-white font-black py-3.5 rounded-xl">OK</button>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-7 w-full max-w-[320px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl font-black">!</div>
            <h2 className="font-black text-[16px] mb-2 text-black">{showError}</h2>
            <button onClick={()=>setShowError("")} className="w-full bg-black text-white font-black py-3.5 rounded-xl mt-3">OK</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function EditJobPage(){
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Loading...</div>}>
      <EditJobForm/>
    </Suspense>
  );
        }
