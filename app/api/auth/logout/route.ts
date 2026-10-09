import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function POST() {
    const cookieStore = await cookies();

    const sessionId = cookieStore.get("session_id")?.value;

    if (sessionId) {
        await pool.query(
            "DELETE FROM sessions WHERE id = $1",
            [sessionId]
        );
    }

    cookieStore.delete("session_id");

    return Response.json({
        message: "Logged out successfully",
    });
}