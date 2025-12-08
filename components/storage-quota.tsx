"use client";

import { Database } from "lucide-react";
import { useEffect, useState } from "react";

interface StorageQuotaProps {
    initialUsed?: number;
    refreshKey?: number;
}

export function StorageQuota({ initialUsed = 0, refreshKey = 0 }: StorageQuotaProps) {
    const [used, setUsed] = useState(initialUsed);
    const total = 1024 * 1024 * 1024; // 1GB

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await fetch("/api/user");
                if (res.ok) {
                    const data = await res.json();
                    setUsed(data.storageUsed || 0);
                }
            } catch (error) {
                console.error("Failed to fetch storage usage", error);
            }
        };

        // If initialUsed is provided and it's the first render (refreshKey is 0), we might skip fetching
        // But to keep it simple and ensure latest data on refreshKey change:
        if (refreshKey > 0) {
            fetchUsage();
        }
    }, [refreshKey]);

    // Also update if initialUsed changes (though usually it won't if passed from server component)
    useEffect(() => {
        setUsed(initialUsed);
    }, [initialUsed]);

    const percentage = Math.min((used / total) * 100, 100);

    // Format bytes to readable string
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="fixed bottom-8 left-8 z-50 flex flex-col gap-2 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-xl w-64 shadow-lg">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-foreground font-medium">
                    <Database className="w-4 h-4" />
                    <span>Storage</span>
                </div>
                <span className="text-muted-foreground">
                    {formatBytes(used)} / 1 GB
                </span>
            </div>

            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ease-out ${percentage > 90 ? "bg-red-500" : "bg-primary"
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
