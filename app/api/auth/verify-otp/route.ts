import pool from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return Response.json(
                { error: "Email and OTP are required" },
                { status: 400 }
            );
        }

        // Find the user
        const userResult = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (userResult.rows.length === 0) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const userId = userResult.rows[0].id;

        // Find the latest OTP for this user
        const otpResult = await pool.query(
            `SELECT id, code, expires_at
             FROM otp_codes
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );

        if (otpResult.rows.length === 0) {
            return Response.json(
                { error: "No OTP found" },
                { status: 400 }
            );
        }

        const storedOtp = otpResult.rows[0];

        // Check if OTP matches
        if (storedOtp.code !== otp) {
            return Response.json(
                { error: "Invalid OTP" },
                { status: 401 }
            );
        }

        // Check if OTP has expired
        if (new Date() > new Date(storedOtp.expires_at)) {
            return Response.json(
                { error: "OTP has expired" },
                { status: 401 }
            );
        }

        // OTP is valid, so delete it
        await pool.query(
            "DELETE FROM otp_codes WHERE id = $1",
            [storedOtp.id]
        );


// Create a session for the user
const sessionResult = await pool.query(
    `INSERT INTO sessions (user_id, expires_at)
     VALUES ($1, NOW() + INTERVAL '7 days')
     RETURNING id`,
    [userId]
);

const sessionId = sessionResult.rows[0].id;

const cookieStore = await cookies();

cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
});

return Response.json({
    message: "OTP verified successfully",
    userId,
});

    } catch (error) {
        console.error(error);

        return Response.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}