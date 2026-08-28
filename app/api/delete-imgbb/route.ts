import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const imageIds = body.imageIds || [];
    const deleteUrls = body.deleteUrls || [];
    const allIds = [...imageIds];

    // deleteUrls atangin ID extract (fallback)
    // deleteUrl pattern: https://ibb.co/xxxxx/xxxxx -> a hnuhnung ber khi ID a ni
    if (allIds.length === 0 && deleteUrls.length > 0) {
      for (const url of deleteUrls) {
        try {
          const parts = url.split('/');
          const maybeId = parts[parts.length - 1] || parts[parts.length - 2];
          if (maybeId) allIds.push(maybeId);
        } catch {}
      }
    }

    const apiKey = process.env.IMGBB_API_KEY || "f7ee6ffb590faa4bffd4b5ffbb44c094";
    
    let deletedCount = 0;
    for (const id of allIds) {
      try {
        const res = await fetch(`https://api.imgbb.com/1/image/${id}?key=${apiKey}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) deletedCount++;
      } catch (e) {
        console.log("Delete error", e);
      }
    }

    // Fallback - deleteUrl hmanga delete tum tho
    if (deletedCount === 0) {
      for (const url of deleteUrls) {
        try { await fetch(url); } catch {}
      }
    }

    return NextResponse.json({ success: true, deleted: deletedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
