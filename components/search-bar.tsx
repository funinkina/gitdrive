"use client";

import { Search, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-12 rounded-full">
            <div className="relative flex items-center group">
                <Search className="absolute left-5 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onSearch(query);
                        }
                    }}
                    placeholder="Search for anything, any way!"
                    className="w-full h-14 pl-14 pr-14 rounded-full border border-border bg-card hover:outline-none hover:ring-1 hover:ring-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/50 text-lg transition-all duration-200"
                />
                <Button
                    size="icon"
                    className="absolute right-2 h-11 w-11 rounded-full"
                    onClick={() => onSearch(query)}
                >
                    <ArrowRight className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
