import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageIds } = await req.json();
    if (!imageIds || imageIds.length === 0) {
      return NextResponse.json({ success: true });
    }
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_KEY || process.env.IMGBB_API_KEY || "f7ee6ffb590faa4bffd4b5ffbb44c094";
    
    for (const id of imageIds) {
      try {
        await fetch(`https://api.imgbb.com/1/image/${id}?key=${apiKey}`, {
          method: "DELETE",
        });
      } catch {}
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
