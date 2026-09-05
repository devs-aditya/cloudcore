"use client";

import { useState } from "react";
import FileCard from "@/components/FileCard";

type File = {
    name: string;
    type: string;
    size: string;
};

const initialFiles = [
    {
        name: "Resume.pdf",
        type: "PDF",
        size: "2.4 MB"
    },
    {
        name: "Photo.jpg",
        type: "JPG",
        size: "5.1 MB"
    },
    {  
        name: "Project.zip",
        type: "ZIP",
        size: "18 MB"
    }
];

export default function Home() {

    const [files, setFiles] = useState<File[]>(initialFiles);
    const [search, setSearch] = useState("");

    const filteredFiles = files.filter((file) =>
        file.name.toLowerCase().includes(search.toLowerCase())
    );

    function addFile() {
        setFiles([
            ...files,
            {
                name: "NewFile.pdf",
                type: "PDF",
                size: "1 MB"
            }
        ]);
    }

    function removeLastFile() {
        setFiles(files.slice(0, -1));
    }

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

            <button onClick={addFile}>
                Add File
            </button>

            <button onClick={removeLastFile}>
                Remove Last File
            </button>

            {filteredFiles.length === 0 ? (
                <p>No files found.</p>
            ) : (
                filteredFiles.map((file) => (
                    <FileCard
                        key={file.name}
                        name={file.name}
                        type={file.type}
                        size={file.size}
                        onDelete={() => deleteFile(file.name)}
                    />
                ))
            )}
        </main>
    );
}