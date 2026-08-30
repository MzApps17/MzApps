import { NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request){
  try {
    const { title, body, tokens } = await req.json();
    
    if(!tokens || tokens.length === 0){
      return NextResponse.json({ error: "No tokens" });
    }

    const validTokens = tokens.filter((t:any) => t && typeof t === 'string' && t.length > 20);
    
    if(validTokens.length === 0){
      return NextResponse.json({ error: "No valid tokens" });
    }

    const message = {
      notification: { 
        title: title || "Marketplace Thar!", 
        body: body || "Post thar a awm e!",
        image: "https://mizoapps.in/icon-512.png"
      },
      data: { 
        type: "new_post",
        url: "/marketplace"
      },
      webpush: {
        notification: {
          icon: "https://mizoapps.in/icon-512.png",
          badge: "https://mizoapps.in/icon-192.png"
        },
        fcmOptions: {
          link: "https://mizoapps.in/marketplace"
        }
      }
    };

    let totalSent = 0;
    let totalFailed = 0;

    for(let i=0; i<validTokens.length; i+=500){
      const chunk = validTokens.slice(i, i+500);
      try {
        const res = await admin.messaging().sendEachForMulticast({
          ...message,
          tokens: chunk,
        });
        totalSent += res.successCount;
        totalFailed += res.failureCount;
      } catch(chunkError){
        totalFailed += chunk.length;
      }
    }

    return NextResponse.json({ success: true, sent: totalSent, failed: totalFailed, total: validTokens.length });
  } catch(e:any){
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
