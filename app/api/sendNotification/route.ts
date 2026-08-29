import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Firebase Admin init (vawikhat chauh)
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

    const message = {
      notification: { title, body },
      data: { type: "new_post" },
    };

    // Token 500 zel in thawn
    for(let i=0; i<tokens.length; i+=500){
      const chunk = tokens.slice(i, i+500);
      await admin.messaging().sendEachForMulticast({
        ...message,
        tokens: chunk,
      });
    }

    return NextResponse.json({ success: true, sent: tokens.length });
  } catch(e:any){
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
