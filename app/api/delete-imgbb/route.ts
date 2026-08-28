import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // deleteUrls emaw deleteUrl emaw imageIds emaw lo kal se pawm vek
    const urls: string[] = [];
    if (body.deleteUrl) urls.push(body.deleteUrl);
    if (body.deleteUrls && Array.isArray(body.deleteUrls)) urls.push(...body.deleteUrls);
    if (body.deleteHashes) urls.push(...body.deleteHashes);
    // imageIds atang pawh deleteUrl siam theih
    if (body.imageIds && body.imageIds.length > 0) {
      const key = process.env.NEXT_PUBLIC_IMGBB_KEY || process.env.IMGBB_API_KEY;
      if (key) {
        for (const id of body.imageIds) {
          urls.push(`https://api.imgbb.com/1/delete/${id}?key=${key}`);
        }
      }
    }

    if (urls.length === 0) {
      return NextResponse.json({ success: true, msg: "no urls" });
    }

    for (const delUrl of urls) {
      try {
        // ImgBB delete_url hi GET a tih chiah in a bo!
        await fetch(delUrl, {
          method: "GET",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
      } catch (e) {
        console.log("delete fail", delUrl, e);
      }
    }

    return NextResponse.json({ success: true, deleted: urls.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
