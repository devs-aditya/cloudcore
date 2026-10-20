
interface FileCardProps {
    id: number;
    name: string;
    type: string;
    size: string;
    onDelete: () => void;
}

export default function FileCard({
    id,
    name,
    type,
    size,
    onDelete
}: FileCardProps) {
    function handleDownload() {
        window.location.href = `/api/files/${id}/download`;
    }

    return (
        <div>
            <h3>{name}</h3>

            <p>
                {type} • {size}
            </p>

            <button onClick={handleDownload}>
                Download
            </button>

            <button onClick={onDelete}>
                Delete
            </button>
        </div>
    );
}
