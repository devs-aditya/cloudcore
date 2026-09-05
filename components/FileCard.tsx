interface FileCardProps {
    name: string;
    type: string;
    size: string;
    onDelete: () => void;
}

export default function FileCard({
    name,
    type,
    size,
    onDelete
}: FileCardProps) {
    return (
        <div>
            <h3>{name}</h3>
            <p>
                {type} • {size}
            </p>

            <button onClick={onDelete}>
                Delete
            </button>
        </div>
    );
}