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

    if (!Number.isFinite(size) || size < 0) {
        return "Unknown size";
    }

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }
    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatFileType(type: string) {
    if (type === "application/pdf") return "PDF";
    if (type.startsWith("image/")) {
        return type.split("/")[1].toUpperCase();
    }
    if (type === "text/plain") return "TXT";
    if (type === "application/zip") return "ZIP";

    return type || "Unknown";
}

export default function StarredPage() {
    const [files, setFiles] = useState<CloudFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function fetchFiles() {
        try {
            const response = await fetch("/api/files");
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to load files");
                return;
            }

            setFiles(data.files.filter((file: CloudFile) => file.starred));
            setError("");
        } catch (error) {
            console.error(error);
            setError("Unable to connect to the server");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFiles();
    }, []);

    async function toggleStar(
        fileId: number,
        starred: boolean
    ): Promise<void> {
        const response = await fetch(`/api/files/${fileId}/star`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ starred }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to update starred status");
        }

        // Remove the file from this page when it is unstarred.
        setFiles((currentFiles) =>
            currentFiles.filter((file) => file.id !== fileId)
        );

        setMessage(
            starred
                ? "File starred successfully!"
                : "File removed from Starred"
        );
        setError("");
    }

    async function renameFile(
        fileId: number,
        newName: string
    ): Promise<void> {
        const response = await fetch(`/api/files/${fileId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: newName }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to rename file");
        }

        setFiles((currentFiles) =>
            currentFiles.map((file) =>
                file.id === fileId
                    ? { ...file, name: data.file.name }
                    : file
            )
        );

        setMessage("File renamed successfully!");
        setError("");
    }

    async function deleteFile(fileId: number) {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this file?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/files/${fileId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to delete file");
                return;
            }

            setFiles((currentFiles) =>
                currentFiles.filter((file) => file.id !== fileId)
            );

            setMessage("File deleted successfully!");
            setError("");
        } catch (error) {
            console.error(error);
            setError("Unable to delete the file");
        }
    }

    return (
        <main className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Starred Files</h1>
                <p className="mt-2 text-gray-500">
                    Quickly access the files that matter most to you.
                </p>
            </div>

            {message && (
                <p role="status" className="text-sm text-green-600">
                    {message}
                </p>
            )}

            {loading ? (
                <p>Loading starred files...</p>
            ) : error ? (
                <p role="alert" className="text-red-600">
                    {error}
                </p>
            ) : files.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
                    <p className="text-lg font-semibold">
                        No starred files yet
                    </p>
                    <p className="mt-2 text-gray-500">
                        Star a file from your dashboard and it will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-500">
                        {files.length} {files.length === 1 ? "file" : "files"}
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {files.map((file) => (
                            <FileCard
                                key={file.id}
                                id={file.id}
                                name={file.name}
                                type={formatFileType(file.type)}
                                size={formatFileSize(file.size)}
                                starred={file.starred}
                                onToggleStar={toggleStar}
                                onDelete={() => deleteFile(file.id)}
                                onRename={renameFile}
                            />
                        ))}
                    </div>
                </>
            )}
        </main>
    );
}