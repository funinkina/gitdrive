import { signIn, signOut } from "@/lib/auth"
import { Button } from "./ui/button"
import { Github } from "lucide-react"

export function SignIn() {
    return (
        <form
            action={async () => {
                "use server"
                await signIn("github")
            }}
        >
            <Button className="flex items-center gap-2" type="submit">
                <Github className="w-4 h-4" />
                Sign in with GitHub
            </Button>
        </form>
    )
}

export function SignOut() {
    return (
        <form
            action={async () => {
                "use server"
                await signOut()
            }}
        >
            <Button variant="outline" type="submit">Sign Out</Button>
        </form>
    )
}
