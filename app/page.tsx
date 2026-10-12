"use client";

import { useEffect, useState } from "react";
import FileCard from "@/components/FileCard";

type File = {
    id: number;
    name: string;
    type: string;
    size: string;
    storage_key: string;
    created_at: string;
};

function formatFileSize(bytes: string) {
    const size = Number(bytes);

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatFileType(type: string) {
    if (type === "application/pdf") {
        return "PDF";
    }

    if (type.startsWith("image/")) {
        return type.split("/")[1].toUpperCase();
    }

    if (type === "application/zip") {
        return "ZIP";
    }

    return type;
}

export default function Home() {
    const [files, setFiles] = useState<File[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchFiles() {
            try {
                const response = await fetch("/api/files", {
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || "Failed to load files");
                    return;
                }

                setFiles(data.files);
            } catch (error) {
                console.error(error);
                setError("Unable to connect to the server");
            } finally {
                setLoading(false);
            }
        }

        fetchFiles();
    }, []);

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(search.toLowerCase())
    );

    function deleteFile(fileName: string) {
        setFiles(
            files.filter((file) => file.name !== fileName)
        );
    }

    return (
        <main>
            <h1>CloudCore</h1>

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