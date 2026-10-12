"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("test@example.com");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function sendOtp() {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Failed to send OTP");
                return;
            }

            setOtpSent(true);
            setMessage("OTP sent successfully. Check your server terminal.");
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    async function verifyOtp() {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    otp,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Invalid OTP");
                return;
            }

            setMessage("Login successful!");

            router.push("/");
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    width: "350px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                }}
            >
                <h1>CloudCore</h1>

                <h2>Login</h2>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />

                {!otpSent ? (
                    <button
                        onClick={sendOtp}
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            maxLength={6}
                        />

                        <button
                            onClick={verifyOtp}
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </>
                )}

                {message && <p>{message}</p>}
            </div>
        </main>
    );
}