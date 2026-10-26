
"use client";

import { useEffect, useState } from "react";
import FileCard from "@/components/FileCard";

type CloudFile = {
    id: number;
    name: string;
    type: string;
    size: string | number;
    storage_key: string;
    created_at: string;
    starred: boolean;
};

function formatFileSize(bytes: string | number) {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size < 0) return "Unknown size";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatFileType(type: string) {
    if (type === "application/pdf") return "PDF";
    if (type.startsWith("image/")) return type.split("/")[1].toUpperCase();
    if (type === "application/zip") return "ZIP";
    if (type === "text/plain") return "TXT";
    return type || "Unknown";
}

function formatDate(date: string) {
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime())
        ? "Unknown date"
        : parsedDate.toLocaleString();
}

export default function RecentPage() {
    const [files, setFiles] = useState<CloudFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchRecentFiles() {
            try {
                const response = await fetch("/api/files");
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || "Failed to load recent files");
                    return;
                }

                const recentFiles: CloudFile[] = Array.isArray(data.files)
                    ? data.files
                    : [];

                recentFiles.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );

                setFiles(recentFiles);
            } catch (err) {
                console.error(err);
                setError("Unable to connect to the server");
            } finally {
                setLoading(false);
            }
        }

        fetchRecentFiles();
    }, []);

    async function deleteFile(fileId: number) {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this file?"
        );

        if (!confirmed) return;

        const response = await fetch(`/api/files/${fileId}`, {
            method: "DELETE",
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to delete file");
        }

        setFiles((current) => current.filter((file) => file.id !== fileId));
        setError("");
    }

    async function renameFile(fileId: number, newName: string) {
        const response = await fetch(`/api/files/${fileId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName }),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to rename file");
        }

        setFiles((current) =>
            current.map((file) =>
                file.id === fileId
                    ? { ...file, name: data.file?.name ?? newName }
                    : file
            )
        );
        setError("");
    }

    async function toggleStar(fileId: number, starred: boolean) {
        const response = await fetch(`/api/files/${fileId}/star`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ starred }),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to update starred status");
        }

        setFiles((current) =>
            current.map((file) =>
                file.id === fileId ? { ...file, starred } : file
            )
        );
        setError("");
    }

    return (
        <main className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Recent Files</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Your newest files, displayed first.
                </p>
            </div>

            {loading ? (
                <p>Loading recent files...</p>
            ) : error ? (
                <p role="alert" className="text-red-600">{error}</p>
            ) : files.length === 0 ? (
                <p>You haven't uploaded any files yet.</p>
            ) : (
                <>
                    <p className="text-sm text-gray-500">
                        {files.length} {files.length === 1 ? "file" : "files"}
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {files.map((file) => (
                            <div key={file.id} className="space-y-2">
                                <FileCard
                                    id={file.id}
                                    name={file.name}
                                    type={formatFileType(file.type)}
                                    size={formatFileSize(file.size)}
                                    starred={file.starred ?? false}
                                    onDelete={() => deleteFile(file.id)}
                                    onRename={renameFile}
                                    onToggleStar={toggleStar}
                                />

                                <p className="text-xs text-gray-500">
                                    Added: {formatDate(file.created_at)}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </main>
    );
}
