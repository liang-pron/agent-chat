import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

/** POST /api/upload — upload an avatar image, returns the URL */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 PNG、JPEG、GIF、WebP、SVG 格式" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过 2MB" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const avatarsDir = path.join(process.cwd(), "public", "avatars");

    // Ensure directory exists
    await mkdir(avatarsDir, { recursive: true });

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(avatarsDir, filename);
    await writeFile(filePath, buffer);

    const url = `/avatars/${filename}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
