'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/app/firebase/config'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (user)=>{
      if(!user){
        if(pathname!== "/"){
          router.replace("/")
        }
      } else {
        try{
          await updateDoc(doc(db,"users",user.uid), {
            isOnline: true,
            lastSeen: serverTimestamp()
          })
        }catch{}
      }
    })

    const setOffline = async()=>{
      const user = auth.currentUser
      if(user){
        try{
          await updateDoc(doc(db,"users",user.uid), {
            isOnline: false,
            lastSeen: serverTimestamp()
          })
        }catch{}
      }
    }

    const handleVis = ()=>{
      if(document.visibilityState === "hidden"){
        setOffline()
      } else {
        const user = auth.currentUser
        if(user){
          updateDoc(doc(db,"users",user.uid), { isOnline: true, lastSeen: serverTimestamp() }).catch(()=>{})
        }
      }
    }

    window.addEventListener("beforeunload", setOffline)
    document.addEventListener("visibilitychange", handleVis)

    return ()=>{
      unsub()
      window.removeEventListener("beforeunload", setOffline)
      document.removeEventListener("visibilitychange", handleVis)
    }
  },[router, pathname])

  return <>{children}</>
}
