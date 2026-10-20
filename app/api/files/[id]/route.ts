
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unlink } from "node:fs/promises";
import path from "node:path";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify the session
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

    // 3. Find a file owned by this user
    const result = await pool.query(
      `SELECT storage_key FROM files
       WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const storageKey = result.rows[0].storage_key;

    // 4. Delete the physical file when it uses local upload storage
    if (storageKey) {
      if (path.basename(storageKey) !== storageKey) {
        return NextResponse.json(
          { error: "Invalid stored file" },
          { status: 500 }
        );
      }

      const filePath = path.join(
        process.cwd(),
        "storage",
        "uploads",
        storageKey
      );

      try {
        await unlink(filePath);
      } catch (error) {
        // Older database records may not have a local file.
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          error.code !== "ENOENT"
        ) {
          throw error;
        }
      }
    }

    // 5. Delete the database record, scoped to its owner
    await pool.query(
      `DELETE FROM files WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting file:", error);

    return NextResponse.json(
      { error: "Something went wrong while deleting the file" },
      { status: 500 }
    );
  }
}
