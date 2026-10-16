
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

function formatFileSize(bytes: string | number) {
    const size = Number(bytes);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
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

    return type;
}

export default function Home() {
    const [files, setFiles] = useState<CloudFile[]>([]);
    const [search, setSearch] = useState("");
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
                setUploadMessage(
                    data.error || "Upload failed"
                );
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

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(search.toLowerCase())
    );

    function deleteFile(fileName: string) {
        setFiles((currentFiles) =>
            currentFiles.filter((file) => file.name !== fileName)
        );
    }

    return (
        <main>
            <h1>CloudCore</h1>

            <div>
                <label htmlFor="file-upload">
                    {uploading ? "Uploading..." : "Upload File"}
                </label>

                <input
                    id="file-upload"
                    type="file"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </div>

            {uploadMessage && <p>{uploadMessage}</p>}

            <input
                placeholder="Search files..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />

            {loading ? (
                <p>Loading files...</p>
            ) : error ? (
                <p>{error}</p>
            ) : filteredFiles.length === 0 ? (
                <p>No files found.</p>
            ) : (
                filteredFiles.map((file) => (
                    <FileCard
                        key={file.id}
                        name={file.name}
                        type={formatFileType(file.type)}
                        size={formatFileSize(file.size)}
                        onDelete={() => deleteFile(file.name)}
                    />
                ))
            )}
        </main>
    );
}
