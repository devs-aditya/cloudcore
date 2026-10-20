
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check the user's session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const sessionResult = await pool.query(
      `SELECT user_id FROM sessions
       WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = sessionResult.rows[0].user_id;
    const { id } = await params;
    const fileId = Number(id);

    // 2. Validate the file ID
    if (!Number.isSafeInteger(fileId) || fileId <= 0) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    // 3. Only find files owned by this user
    const result = await pool.query(
      `SELECT name, type, storage_key
       FROM files
       WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const file = result.rows[0];

    // 4. Resolve the stored file safely
    const uploadDirectory = path.resolve(
      process.cwd(),
      "storage",
      "uploads"
    );

    const storageKey = file.storage_key;

    if (
      typeof storageKey !== "string" ||
      path.basename(storageKey) !== storageKey
    ) {
      return NextResponse.json(
        { error: "Invalid stored file" },
        { status: 500 }
      );
    }

    const filePath = path.join(uploadDirectory, storageKey);
    const buffer = await readFile(filePath);

    // 5. Return the file as a download
    const safeName = String(file.name).replace(/["\\\r\n]/g, "_");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return NextResponse.json(
        { error: "Stored file is missing" },
        { status: 404 }
      );
    }

    console.error("Error downloading file:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
