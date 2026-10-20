
"use client";

import { useState } from "react";

interface FileCardProps {
    id: number;
    name: string;
    type: string;
    size: string;
    starred: boolean;
    onDelete: () => void;
    onRename: (id: number, newName: string) => Promise<void>;
    onToggleStar: (id: number, starred: boolean) => Promise<void>;
}

export default function FileCard({
    id,
    name,
    type,
    size,
    starred,
    onDelete,
    onRename,
    onToggleStar,
}: FileCardProps) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(name);
    const [isSaving, setIsSaving] = useState(false);
    const [isTogglingStar, setIsTogglingStar] = useState(false);
    const [error, setError] = useState("");

    function handleDownload() {
        window.location.href = `/api/files/${id}/download`;
    }

    async function handleRename() {
        const trimmedName = newName.trim();

        if (!trimmedName) {
            setError("Filename cannot be empty.");
            return;
        }

        if (trimmedName.length > 255) {
            setError("Filename cannot exceed 255 characters.");
            return;
        }

        if (trimmedName === name) {
            setIsRenaming(false);
            setError("");
            return;
        }

        try {
            setIsSaving(true);
            setError("");

            await onRename(id, trimmedName);
            setIsRenaming(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to rename file."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleToggleStar() {
        try {
            setIsTogglingStar(true);
            setError("");

            await onToggleStar(id, !starred);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to update starred status."
            );
        } finally {
            setIsTogglingStar(false);
        }
    }

    return (
        <div>
            {isRenaming ? (
                <div>
                    <input
                        type="text"
                        value={newName}
                        onChange={(event) =>
                            setNewName(event.target.value)
                        }
                        maxLength={255}
                        aria-label="New filename"
                        disabled={isSaving}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                void handleRename();
                            }

                            if (event.key === "Escape") {
                                setNewName(name);
                                setIsRenaming(false);
                                setError("");
                            }
                        }}
                    />

                    <button
                        onClick={() => void handleRename()}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>

                    <button
                        onClick={() => {
                            setNewName(name);
                            setIsRenaming(false);
                            setError("");
                        }}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    <h3>{name}</h3>

                    <p>
                        {type} • {size}
                    </p>

                    <button
                        onClick={() => {
                            setNewName(name);
                            setIsRenaming(true);
                            setError("");
                        }}
                    >
                        Rename
                    </button>
                </>
            )}

            <button
                type="button"
                onClick={() => void handleToggleStar()}
                disabled={isTogglingStar}
                aria-label={starred ? "Unstar file" : "Star file"}
                aria-pressed={starred}
            >
                {isTogglingStar
                    ? "Updating..."
                    : starred
                      ? "★ Starred"
                      : "☆ Star"}
            </button>

            <button onClick={handleDownload}>
                Download
            </button>

            <button onClick={onDelete}>
                Delete
            </button>

            {error && <p role="alert">{error}</p>}
        </div>
    );
}
