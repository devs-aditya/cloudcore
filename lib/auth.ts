import { cookies } from "next/headers";
import pool from "@/lib/db";

export async function getSession() {
    const cookieStore = await cookies();

    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
        return null;
    }

    const result = await pool.query(
        `SELECT 
            sessions.id,
            sessions.user_id,
            sessions.expires_at,
            users.email,
            users.name
         FROM sessions
         JOIN users ON sessions.user_id = users.id
         WHERE sessions.id = $1
         AND sessions.expires_at > NOW()`,
        [sessionId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
}