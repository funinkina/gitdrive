"use client";

import { Search, ArrowRight, Calendar } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
    onSearch: (query: string, dateRange?: { from: Date; to: Date }) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Close filters when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearch = () => {
        const from = fromDate ? new Date(fromDate) : undefined;
        const to = toDate ? new Date(toDate) : undefined;

        if (from && to) {
            onSearch(query, { from, to });
        } else {
            onSearch(query);
        }
        setShowFilters(false);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mb-12 z-50">
            <div
                className={`
                    relative flex flex-col bg-card border border-border transition-all duration-200 
                    ${showFilters ? 'rounded-3xl shadow-lg ring-1 ring-primary/50' : 'rounded-full hover:ring-1 hover:ring-primary/20'}
                `}
            >
                <div className="relative flex items-center h-14 shrink-0">
                    <Search className={`absolute left-5 h-6 w-6 transition-colors ${showFilters ? 'text-primary' : 'text-muted-foreground'}`} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowFilters(true)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSearch();
                            }
                        }}
                        placeholder="Search for anything, any way!"
                        className="w-full h-full pl-14 pr-14 bg-transparent border-none focus:outline-none text-lg placeholder:text-muted-foreground/70"
                    />
                    <Button
                        size="icon"
                        className="absolute right-2 h-11 w-11 rounded-full"
                        onClick={handleSearch}
                    >
                        <ArrowRight className="h-6 w-6" />
                    </Button>
                </div>

                {/* Date Filters */}
                {showFilters && (
                    <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
                        <div className="h-px bg-border mb-4" />
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
