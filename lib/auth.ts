import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import connectDB from "./db"
import User from "@/models/User"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "github") {
                await connectDB();
                try {
                    const existingUser = await User.findOne({ email: user.email });

                    if (existingUser) {
                        existingUser.accessToken = account.access_token;
                        existingUser.githubId = profile?.id?.toString();
                        existingUser.image = user.image;
                        existingUser.name = user.name;
                        await existingUser.save();
                    } else {
                        await User.create({
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            githubId: profile?.id?.toString(),
                            accessToken: account.access_token,
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error saving user to DB", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.sub;
                // @ts-ignore
                session.accessToken = token.accessToken;
            }
            return session;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },
})
