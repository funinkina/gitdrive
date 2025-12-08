"use client";
import { useState } from "react";
import { UploadZone } from "./upload-zone";
import { DriveBrowser } from "./drive-browser";
import { SearchBar } from "./search-bar";
import { StorageQuota } from "./storage-quota";

interface DashboardProps {
    initialStorageUsed?: number;
}

export function Dashboard({ initialStorageUsed = 0 }: DashboardProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const handleUploadComplete = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="w-full">
            <SearchBar onSearch={setSearchQuery} />

            {!searchQuery && <UploadZone onUploadComplete={handleUploadComplete} />}

            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">
                    {searchQuery ? "Search Results" : "Recent Files (Last 30 Days)"}
                </h2>
                <DriveBrowser
                    key={refreshKey}
                    searchQuery={searchQuery}
                    onDeleteComplete={() => setRefreshKey(prev => prev + 1)}
                />
            </div>

            <StorageQuota initialUsed={initialStorageUsed} refreshKey={refreshKey} />
        </div>
    )
}
