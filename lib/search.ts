import { Octokit } from "octokit";

export async function searchMetadata(
    token: string,
    owner: string,
    repo: string,
    userId: string,
    query: string,
    fromDate: Date,
    toDate: Date
) {
    const octokit = new Octokit({ auth: token });
    const results: any[] = [];
    const qLower = query.toLowerCase();

    // 1. Generate list of date paths to check
    const dates: Date[] = [];
    let current = new Date(fromDate);
    while (current <= toDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    // 2. For each date, list files in meta/{userId}/{YYYY}/{MM}/{DD}
    // We can do this in parallel with some concurrency limit
    await Promise.all(
        dates.map(async (date) => {
            const yyyy = date.getUTCFullYear().toString();
            const mm = (date.getUTCMonth() + 1).toString().padStart(2, "0");
            const dd = date.getUTCDate().toString().padStart(2, "0");
            const path = `meta/${userId}/${yyyy}/${mm}/${dd}`;

            try {
                // List files in the directory
                const { data: files } = await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path,
                });

                if (!Array.isArray(files)) return;

                // Filter for .json files
                const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

                // Fetch content for each JSON file
                // To optimize, we can use the 'download_url' or fetch blob if we have SHA, 
                // but 'getContent' gives us download_url.
                // We can fetch these in parallel.
                const fileContents = await Promise.all(
                    jsonFiles.map(async (f) => {
                        if (!f.download_url) return null;
                        try {
                            const res = await fetch(f.download_url, {
                                headers: {
                                    Authorization: `token ${token}`,
                                    Accept: "application/vnd.github.v3.raw",
                                },
                            });
                            if (!res.ok) return null;
                            return await res.json();
                        } catch (e) {
                            console.error(`Failed to fetch ${f.path}`, e);
                            return null;
                        }
                    })
                );

                // Filter and match
                for (const meta of fileContents) {
                    if (!meta) continue;
                    const name = meta.name?.toLowerCase() || "";
                    const tags = (meta.tags || []).join(" ").toLowerCase();
                    const ocr = meta.ocr_text?.toLowerCase() || "";

                    if (
                        name.includes(qLower) ||
                        tags.includes(qLower) ||
                        ocr.includes(qLower)
                    ) {
                        results.push(meta);
                    }
                }
            } catch (e: any) {
                // If directory doesn't exist (404), just skip
                if (e.status !== 404) {
                    console.error(`Error listing ${path}`, e);
                }
            }
        })
    );

    return results;
}
