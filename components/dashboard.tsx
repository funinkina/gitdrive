"use client";
import { useState } from "react";
import { UploadZone } from "./upload-zone";
import { DriveBrowser } from "./drive-browser";

export function Dashboard() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUploadComplete = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="w-full space-y-8">
            <UploadZone onUploadComplete={handleUploadComplete} />
            <div className="border-t pt-8">
                <h2 className="text-2xl font-semibold mb-4">Recent Files (Last 30 Days)</h2>
                <DriveBrowser key={refreshKey} />
            </div>
        </div>
    )
}
