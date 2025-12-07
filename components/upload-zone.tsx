"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react";

export function UploadZone({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    const uploadFile = useCallback(async (file: File) => {
        setUploading(true);
        setStatus(null);

        try {
            // Compute SHA256 client-side
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("sha256", sha256);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setStatus({ type: "success", message: "File uploaded successfully!" });
            if (onUploadComplete) {
                onUploadComplete();
            }

            // Clear status after 3 seconds
            setTimeout(() => setStatus(null), 3000);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            setStatus({ type: "error", message });
            setTimeout(() => setStatus(null), 5000);
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete]);

    useEffect(() => {
        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current += 1;
            if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current -= 1;
            if (dragCounter.current === 0) {
                setIsDragging(false);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            dragCounter.current = 0;

            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                uploadFile(file);
            }
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [uploadFile]);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            uploadFile(file);
        }
    };

    const isExpanded = isDragging || isHovering || uploading || status !== null;

    return (
        <>
            {/* Full screen drop overlay */}
            {isDragging && (
                <div className="fixed left-0 right-0 bottom-0 top-16 z-40 bg-background/50 backdrop-blur-sm border-4 border-dashed border-primary m-4 rounded-xl flex items-center justify-center pointer-events-none">
                    <div className="bg-background p-6 rounded-xl shadow-lg border border-border">
                        <p className="text-xl font-semibold text-primary">Drop file to upload</p>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileSelect}
            />

            <button
                className={`fixed bottom-8 right-8 z-50 flex items-center bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-xl h-14 min-w-14 justify-center ${isExpanded ? "px-6 gap-3" : "px-0 gap-0"}`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
            >
                <div className="flex items-center justify-center shrink-0">
                    {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : status?.type === "success" ? (
                        <CheckCircle className="h-6 w-6" />
                    ) : status?.type === "error" ? (
                        <XCircle className="h-6 w-6" />
                    ) : (
                        <Upload className="h-6 w-6" />
                    )}
                </div>

                <div className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isExpanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"}`}>
                    {uploading ? (
                        <span className="font-medium">Uploading...</span>
                    ) : status ? (
                        <span className="font-medium">{status.message}</span>
                    ) : isDragging ? (
                        <span className="font-medium">Drop to upload</span>
                    ) : (
                        <span className="font-medium">Upload file</span>
                    )}
                </div>
            </button>
        </>
    );
}
