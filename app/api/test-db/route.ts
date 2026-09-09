import pool from "@/lib/db";

export async function GET() {
    const result = await pool.query("SELECT * FROM users");

    return Response.json(result.rows);
}