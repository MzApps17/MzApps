import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { deleteUrl } = await req.json();
    if (!deleteUrl) return NextResponse.json({ success: false });
    await fetch(deleteUrl);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false });
  }
}
