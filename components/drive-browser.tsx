"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, Trash2, Download } from "lucide-react";

interface FileMeta {
    path: string;
    name: string;
    timestamp: string;
    size: number;
    mime: string;
    sha256: string;
    tags: string[];
    ocr_text: string;
}

interface DriveBrowserProps {
    searchQuery?: string;
    onDeleteComplete?: () => void;
}

export function DriveBrowser({ searchQuery, onDeleteComplete }: DriveBrowserProps) {
    const [files, setFiles] = useState<FileMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const to = new Date();
            const from = new Date();

            if (searchQuery) {
                // Search last 10 years if query is present
                from.setFullYear(from.getFullYear() - 10);
            } else {
                // Default to last 30 days
                from.setDate(from.getDate() - 30);
            }

            const params = new URLSearchParams({
                from: from.toISOString(),
                to: to.toISOString(),
                per: "100",
            });

            if (searchQuery) {
                params.append("q", searchQuery);
            }

            const res = await fetch(`/api/search?${params}`);
            if (!res.ok) throw new Error("Failed to fetch files");
            const data = await res.json();
            setFiles(data.results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [searchQuery]);

    const handleDelete = async (path: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;

        try {
            const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete");
            // Refresh
            fetchFiles();
            if (onDeleteComplete) {
                onDeleteComplete();
            }
        } catch (e) {
            alert("Error deleting file");
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {files.length === 0 && <p className="col-span-full text-center text-gray-500">{searchQuery ? "No files found matching your search." : "No files found in the last 30 days."}</p>}
            {files.map((file) => {
                const isImage = file.mime.startsWith("image/");

                const pathParts = file.path.split('/');
                const filename = pathParts.pop() || "";
                const filenameNoExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
                const dirPath = pathParts.join('/'); // uploads/user/YYYY/MM/DD
                const thumbDir = dirPath.replace('uploads', 'thumbs');
                const thumbPath = `${thumbDir}/${filenameNoExt}.jpg`;

                return (
                    <div key={file.path} className="border rounded-lg flex flex-col bg-white hover:bg-stone-100 dark:bg-zinc-900">
                        <div className="aspect-video bg-gray-100 dark:bg-zinc-800 rounded-t-md overflow-hidden flex items-center justify-center relative group">
                            {isImage ? (
                                <img
                                    src={`/api/file?path=${encodeURIComponent(thumbPath)}`}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback if thumb fails or doesn't exist
                                        (e.target as HTMLImageElement).src = `/api/file?path=${encodeURIComponent(file.path)}`;
                                    }}
                                />
                            ) : (
                                <FileText className="w-12 h-12 text-gray-400" />
                            )}

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={`/api/file?path=${encodeURIComponent(file.path)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-black hover:bg-gray-200">
                                    <Download className="w-4 h-4" />
                                </a>
                                <button onClick={() => handleDelete(file.path)} className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-start p-2">
                            <div className="overflow-hidden">
                                <h3 className="font-medium truncate max-w-[200px]" title={file.name}>{file.name}</h3>
                                <p className="text-xs text-gray-500">{new Date(file.timestamp).toLocaleDateString()}</p>
                            </div>
                            <span className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded shrink-0">{file.mime.split('/')[1]}</span>
                        </div>
                        {file.tags && file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {file.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded-full">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
