
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const sessionResult = await pool.query(
      `
      SELECT user_id
      FROM sessions
      WHERE id = $1
      AND expires_at > NOW()
      `,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = sessionResult.rows[0].user_id;

    const filesResult = await pool.query(
      `
      SELECT id, name, size, type, storage_key, created_at, starred
      FROM files
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return NextResponse.json({
      files: filesResult.rows,
    });
  } catch (error) {
    console.error("Error fetching files:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
