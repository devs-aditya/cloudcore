import pool from "@/lib/db";
import { randomInt } from "node:crypto";

export async function POST(request: Request){
    try {
        const body = await request.json();
        const email =
        typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

if (!email) {
    return Response.json(
        { error: "Email is required" },
        { status: 400 }
    );
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //emailRegex is a variable that stores a regular expression — a pattern used to check whether a string matches a particular format.

if (!emailRegex.test(email)) {
    return Response.json(
        { error: "Invalid email address" },
        { status: 400 }
    );
}

        // Check if user already exists
        const userResult = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        let userId;

        if (userResult.rows.length === 0) {
            // Create a new user
            const newUser = await pool.query(
                "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
                ["New User", email]
            );

            userId = newUser.rows[0].id;
        } else {
            userId = userResult.rows[0].id;
        }

        // Generate a 6-digit OTP
        const otp = randomInt(100000, 1000000).toString();

        // OTP expires in 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Store OTP
        await pool.query(
            `INSERT INTO otp_codes (user_id, code, expires_at)
             VALUES ($1, $2, $3)`,
            [userId, otp, expiresAt]
        );

        console.log(`OTP for ${email}: ${otp}`);

        return Response.json({
            message: "OTP generated successfully",
        });
    } catch (error) {
        console.error(error);

        return Response.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}