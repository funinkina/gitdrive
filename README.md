# GitDrive

GitDrive is a cloud storage application that leverages GitHub repositories as the underlying storage mechanism. It allows users to authenticate with their GitHub accounts and automatically creates or links a private repository to store their files.

## Features

- **GitHub Authentication**: Secure login using GitHub OAuth via NextAuth.js.
- **Automated Repository Management**: Automatically creates a private `storage` repository (or links an existing one) on the user's GitHub account to serve as the drive.
- **Smart Onboarding**: Detects if a storage repository already exists, verifies its privacy and content status, and handles conflicts gracefully.
- **Modern UI**: Built with Tailwind CSS for a clean and responsive interface.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://authjs.dev/) (v5)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- A GitHub OAuth App

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/gitdrive.git
   cd gitdrive
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file in the root directory and add the following variables:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/gitdrive"
   
   # NextAuth.js
   AUTH_SECRET="your-super-secret-key" # Generate with `npx auth secret`
   
   # GitHub OAuth
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"
   ```

   To get the GitHub ID and Secret, register a new OAuth application on GitHub:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

4. **Database Setup**

   Push the Prisma schema to your database:

   ```bash
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js App Router pages and API routes.
  - `api/auth/`: NextAuth.js configuration.
  - `onboarding/`: Logic for setting up the user's storage repository.
- `components/`: Reusable UI components.
- `lib/`: Utility functions, database client, and auth configuration.
- `prisma/`: Database schema and migrations.

## License

[MIT](LICENSE)
