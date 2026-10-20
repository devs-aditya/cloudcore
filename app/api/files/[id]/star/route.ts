
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const { id } = await context.params;
    const fileId = Number(id);

    if (!Number.isInteger(fileId) || fileId <= 0) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (typeof body.starred !== "boolean") {
      return NextResponse.json(
        { error: "starred must be a boolean" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE files
      SET starred = $1
      WHERE id = $2 AND user_id = $3
      RETURNING id, name, starred
      `,
      [body.starred, fileId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: body.starred
        ? "File starred successfully"
        : "File unstarred successfully",
      file: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating starred status:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
