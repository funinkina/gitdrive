"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, File as FileIcon, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UploadZone() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const uploadFile = async (file: File) => {
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
            // Optional: Add tags input later
            // formData.append("tags", "web-upload");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setStatus({ type: "success", message: "File uploaded successfully!" });
        } catch (error: any) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setUploading(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            uploadFile(file);
        }
    }, []);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            uploadFile(file);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto mt-8">
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-colors
          ${isDragging
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600"
                    }
        `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={onFileSelect}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-full">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                            {uploading ? "Uploading..." : "Upload a file"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Drag and drop or click to select
                        </p>
                    </div>

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        variant="outline"
                    >
                        Select File
                    </Button>
                </div>
            </div>

            {status && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${status.type === "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                    {status.type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <p>{status.message}</p>
                </div>
            )}
        </div>
    );
}
