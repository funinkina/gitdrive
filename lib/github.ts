import { Octokit } from "octokit";

export async function uploadToRepo(
    token: string,
    owner: string,
    repo: string,
    files: { path: string; content: any; encoding: "utf-8" | "base64" }[],
    message: string
) {
    const octokit = new Octokit({ auth: token });

    // 1. Get the current commit SHA of the main branch
    // We assume 'main' branch.
    const branchName = "main";
    let ref;
    try {
        ref = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${branchName}`,
        });
    } catch (e) {
        // If repo or branch doesn't exist, we might need to handle it. 
        // For now assume it exists.
        throw new Error(`Could not get ref heads/${branchName} for ${owner}/${repo}: ${e}`);
    }

    const latestCommitSha = ref.data.object.sha;

    // 2. Create blobs for each file
    const blobs = await Promise.all(
        files.map(async (file) => {
            const blob = await octokit.rest.git.createBlob({
                owner,
                repo,
                content: typeof file.content === "string" ? file.content : file.content.toString("base64"),
                encoding: file.encoding,
            });
            return {
                path: file.path,
                mode: "100644" as const,
                type: "blob" as const,
                sha: blob.data.sha,
            };
        })
    );

    // 3. Create a tree
    const tree = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: latestCommitSha,
        tree: blobs,
    });

    // 4. Create a commit
    const commit = await octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: tree.data.sha,
        parents: [latestCommitSha],
    });

    // 5. Update the reference
    await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha: commit.data.sha,
    });

    return commit.data.sha;
}

export async function deleteFromRepo(
    token: string,
    owner: string,
    repo: string,
    paths: string[],
    message: string
) {
    const octokit = new Octokit({ auth: token });
    const branchName = "main";

    // 1. Get latest commit
    let ref;
    try {
        ref = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${branchName}`,
        });
    } catch (e) {
        throw new Error(`Could not get ref heads/${branchName}: ${e}`);
    }
    const latestCommitSha = ref.data.object.sha;

    // 2. Create tree with deletions (sha: null)
    const treeItems = paths.map((path) => ({
        path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: null, // This deletes the file
    }));

    const tree = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: latestCommitSha,
        tree: treeItems as any, // Cast to any because types might not strictly allow null sha yet
    });

    // 3. Create commit
    const commit = await octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: tree.data.sha,
        parents: [latestCommitSha],
    });

    // 4. Update ref
    await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha: commit.data.sha,
    });

    return commit.data.sha;
}
