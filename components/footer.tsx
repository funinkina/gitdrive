import { Github, Star } from "lucide-react";
import { version } from "@/package.json";

async function getGitHubStars() {
    try {
        const res = await fetch("https://api.github.com/repos/funinkina/gitdrive", {
            next: { revalidate: 3600 },
        });
        const data = await res.json();
        return data.stargazers_count as number;
    } catch (error) {
        return 0;
    }
}

export async function Footer() {
    const stars = await getGitHubStars();

    return (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-4 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4">
                <a
                    href="https://github.com/funinkina/gitdrive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2 bg-muted/30 hover:bg-muted/50 border border-border rounded-full transition-colors text-sm text-muted-foreground hover:text-foreground backdrop-blur-sm"
                >
                    <Github className="w-4 h-4" />
                    <span>funinkina / gitdrive</span>
                    <div className="flex items-center gap-1 pl-2 border-l border-border">
                        <Star className="w-3.5 h-3.5" />
                        <span>{stars}</span>
                    </div>
                </a>

                <div className="flex items-center px-4 py-2 bg-muted/30 border border-border rounded-full text-sm text-muted-foreground font-mono backdrop-blur-sm">
                    v{version}
                </div>
            </div>
        </div>
    );
}
