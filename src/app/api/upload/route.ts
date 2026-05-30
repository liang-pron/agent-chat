import { NextRequest, NextResponse } from "next/server";
import { validateFile, uploadAvatar } from "@/lib/storage";

/** POST /api/upload — upload an avatar image, returns the URL */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const validationError = validateFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const url = await uploadAvatar(file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
