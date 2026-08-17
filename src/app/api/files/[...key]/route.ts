import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const relative = key.join("/");
  if (relative.includes("..") || path.isAbsolute(relative)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const root = path.join(/* turbopackIgnore: true */ process.cwd(), "uploads");
  const fullPath = path.join(/* turbopackIgnore: true */ root, relative);
  if (!fullPath.startsWith(root)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readFile(/* turbopackIgnore: true */ fullPath);
    const ext = path.extname(fullPath);
    const type =
      ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const fileName = path.basename(fullPath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `${ext === ".pdf" ? "inline" : "inline"}; filename="${fileName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
