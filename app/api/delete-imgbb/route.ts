import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { deleteUrl, deleteUrls, imageIds } = await req.json();
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing in env" }, { status: 500 });
    }

    let ids: string[] = [];
    if (imageIds && Array.isArray(imageIds)) ids = imageIds;

    // deleteUrls atangin ID la chhuak tum (a tawp ber kha ID a ni tlangpui)
    const urls: string[] = [];
    if (deleteUrl) urls.push(deleteUrl);
    if (deleteUrls) urls.push(...deleteUrls);

    // Image ID hmanga delete - hei hi a rintlak ber
    // I marketplace code ah imageIds i save tawh chuan hei hi a thawk ang
    for (const id of ids) {
      try {
        await fetch(`https://api.imgbb.com/1/image/${id}?key=${apiKey}`, {
          method: 'DELETE'
        });
      } catch(e) {}
    }

    // Backup - deleteUrl hmanga delete
    if (ids.length === 0) {
      for (const url of urls) {
        try {
          await fetch(url);
        } catch(e) {}
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
