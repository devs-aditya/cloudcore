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
};

type FileCategory =
    | "All Files"
    | "Documents"
    | "PDFs"
    | "Images"
    | "Videos"
    | "Other Files";

const categories: FileCategory[] = [
    "All Files",
    "Documents",
    "PDFs",
    "Images",
    "Videos",
    "Other Files",
];

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

    if (type === "application/zip") return "ZIP";
    if (type === "text/plain") return "TXT";

    return type || "Unknown";
}

function getFileCategory(type: string): FileCategory {
    if (type === "application/pdf") {
        return "PDFs";
    }

    if (type.startsWith("image/")) {
        return "Images";
    }

    if (type.startsWith("video/")) {
        return "Videos";
    }

    if (
        type.startsWith("text/") ||
        type.includes("wordprocessingml") ||
        type.includes("msword") ||
        type.includes("spreadsheetml") ||
        type.includes("ms-excel") ||
        type.includes("presentationml") ||
        type.includes("ms-powerpoint") ||
        type === "application/rtf"
    ) {
        return "Documents";
    }

    return "Other Files";
}

export default function Home() {
    const [files, setFiles] = useState<CloudFile[]>([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] =
        useState<FileCategory>("All Files");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    async function fetchFiles() {
        try {
            const response = await fetch("/api/files");
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to load files");
                return;
            }

            setFiles(data.files);
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

    async function handleUpload(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file) return;

        setUploading(true);
        setUploadMessage("");
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/files/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setUploadMessage(data.error || "Upload failed");
                return;
            }

            setUploadMessage("File uploaded successfully!");
            await fetchFiles();
        } catch (error) {
            console.error(error);
            setUploadMessage("Unable to upload the file");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    }

    const filteredFiles = files.filter((file) => {
        const matchesSearch = file.name
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesCategory =
            category === "All Files" ||
            getFileCategory(file.type) === category;

        return matchesSearch && matchesCategory;
    });

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

            setError("");
            setUploadMessage("File deleted successfully!");
        } catch (error) {
            console.error(error);
            setError("Unable to delete the file");
        }
    }

    return (
        <main className="space-y-6 p-6">
            <h1 className="text-3xl font-bold">
                CloudCore
            </h1>

            <div className="space-y-2">
                <label
                    htmlFor="file-upload"
                    className="inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    {uploading ? "Uploading..." : "Upload File"}
                </label>

                <input
                    id="file-upload"
                    type="file"
                    className="block"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </div>

            {uploadMessage && (
                <p role="status" className="text-sm">
                    {uploadMessage}
                </p>
            )}

            <input
                type="search"
                placeholder="Search files..."
                value={search}
                onChange={(event) =>
                    setSearch(event.target.value)
                }
                className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2"
            />

            <section
                aria-label="File categories"
                className="space-y-3"
            >
                <h2 className="text-xl font-semibold">
                    Categories
                </h2>

                <div className="flex flex-wrap gap-2">
                    {categories.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setCategory(item)}
                            aria-pressed={category === item}
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                                category === item
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold">
                        {category}
                    </h2>

                    {!loading && !error && (
                        <span className="text-sm text-gray-500">
                            {filteredFiles.length}{" "}
                            {filteredFiles.length === 1
                                ? "file"
                                : "files"}
                        </span>
                    )}
                </div>

                {loading ? (
                    <p>Loading files...</p>
                ) : error ? (
                    <p role="alert" className="text-red-600">
                        {error}
                    </p>
                ) : filteredFiles.length === 0 ? (
                    <p>
                        {search
                            ? "No files match your search in this category."
                            : `No files in ${category.toLowerCase()} yet.`}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredFiles.map((file) => (
                            <FileCard
                                key={file.id}
                                id={file.id}
                                name={file.name}
                                type={formatFileType(file.type)}
                                size={formatFileSize(file.size)}
                                onDelete={() =>
                                    deleteFile(file.id)
                                }
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}