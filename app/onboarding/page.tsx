import { Button } from "@/components/ui/button";
import { createRepository } from "./actions";

export default function OnboardingPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <div className="w-full max-w-md p-8 rounded-lg shadow-md border">
                <h1 className="text-2xl font-bold mb-6 text-center">Setup Your Drive</h1>
                <p className="mb-6 text-gray-600 text-center">
                    Create a private GitHub repository to store your files.
                </p>

                <form action={createRepository} className="space-y-4">
                    <div>
                        <label htmlFor="repoName" className="block text-sm font-medium text-gray-700 mb-1">
                            Repository Name
                        </label>
                        <input
                            type="text"
                            id="repoName"
                            name="repoName"
                            required
                            placeholder="my-gitdrive-storage"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            pattern="[a-zA-Z0-9-]+"
                            title="Only letters, numbers, and hyphens are allowed"
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        Create Repository
                    </Button>
                </form>
            </div>
        </div>
    );
}
