
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  let savedFilePath: string | null = null;

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
      `SELECT user_id
       FROM sessions
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

    // 2. Read the uploaded file
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please provide a file using the 'file' field" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Empty files are not allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must not exceed 10 MB" },
        { status: 413 }
      );
    }

    // 3. Save the actual file using a unique storage key
    const storageKey = randomUUID();
    const uploadDirectory = path.join(
      process.cwd(),
      "storage",
      "uploads"
    );

    await mkdir(uploadDirectory, { recursive: true });

    savedFilePath = path.join(uploadDirectory, storageKey);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(savedFilePath, buffer);

    // 4. Save file metadata in PostgreSQL
    const result = await pool.query(
      `INSERT INTO files (name, size, type, storage_key, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, size, type, storage_key, created_at`,
      [
        file.name,
        file.size,
        file.type || "application/octet-stream",
        storageKey,
        userId,
      ]
    );

    return NextResponse.json(
      {
        message: "File uploaded successfully",
        file: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    // Remove the saved file if something fails afterward
    if (savedFilePath) {
      await unlink(savedFilePath).catch(() => {});
    }

    console.error("Error uploading file:", error);

    return NextResponse.json(
      { error: "Something went wrong while uploading the file" },
      { status: 500 }
    );
  }
}
