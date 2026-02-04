# Repo Analyzer

AI-Powered GitHub Repository Analysis Platform

Analyze GitHub repositories with AI. Get intelligent insights about contributors, pull requests, issues, and collaboration patterns through an interactive chat interface.

![Repo Analyzer](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=flat-square)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue?style=flat-square)
![MUI](https://img.shields.io/badge/MUI-v5-007FFF?style=flat-square&logo=mui)

## Features

- **Repository Management**: Add and manage GitHub repositories
- **AI-Powered Analysis**: Chat with AI to analyze repository data
- **Dynamic Visualizations**: Charts, tables, and diff views
- **Contributor Focus**: Filter analysis by specific contributors
- **Real-time Updates**: Powered by Convex for live data sync
- **Dark Mode**: Beautiful Graphite-inspired dark theme

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Material-UI
- **Backend**: Convex (BaaS)
- **AI**: Google Gemini 1.5 Flash
- **APIs**: GitHub REST API
- **Charts**: Recharts
- **Code Highlighting**: React Syntax Highlighter

## Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (free at [convex.dev](https://convex.dev))
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))
- GitHub Personal Access Token (optional, for higher rate limits)

## Getting Started

### 1. Clone and Install

```bash
cd repo-analyzer
npm install
```

### 2. Set Up Convex

Create a Convex account and set up a new project:

```bash
npx convex dev
```

This will prompt you to log in and create a new project. Follow the prompts.

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Convex (automatically set by npx convex dev)
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# GitHub (optional - for higher rate limits)
GITHUB_TOKEN=your_github_personal_access_token

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

**Important**: Also add `GITHUB_TOKEN` and `GEMINI_API_KEY` to your Convex dashboard:
1. Go to your project at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Navigate to Settings → Environment Variables
3. Add `GITHUB_TOKEN` and `GEMINI_API_KEY`

### 4. Run the Development Server

In one terminal, run Convex:

```bash
npx convex dev
```

In another terminal, run Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding a Repository

1. Click "Add Repository" on the home page
2. Enter a GitHub repository URL (e.g., `https://github.com/facebook/react`)
3. Click "Add Repository"

### Analyzing a Repository

1. Click on a repository card to open the chat interface
2. Start a new chat or continue an existing one
3. Ask questions like:
   - "Who are the top contributors?"
   - "Show me recent pull requests"
   - "What issues are labeled as bugs?"
   - "Display a chart of contributions over time"
   - "Compare activity between @user1 and @user2"

### Filtering by Contributors

1. Click "Add Contributors" in the message input
2. Select one or more contributors to focus on
3. Your questions will be analyzed with those contributors in mind

## Keyboard Shortcuts

- `Cmd/Ctrl + K`: Create a new chat
- `Enter`: Send message
- `Shift + Enter`: New line in message

## Project Structure

```
repo-analyzer/
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── repositories.ts    # Repository queries/mutations
│   ├── chats.ts           # Chat queries/mutations
│   ├── messages.ts        # Message queries/mutations
│   ├── github.ts          # GitHub API actions
│   └── ai.ts              # Gemini AI actions
├── src/
│   ├── app/               # Next.js app router
│   │   ├── page.tsx       # Home page (repositories)
│   │   └── repo/[repoId]/ # Chat interface
│   ├── components/        # React components
│   └── lib/               # Utilities and providers
└── public/                # Static assets
```

## AI Response Types

The AI can return different types of responses:

- **Text**: Markdown-formatted explanations
- **Chart**: Pie, bar, or line charts
- **Table**: Structured data tables
- **Diff**: Code diffs from pull requests
- **Mixed**: Combination of multiple types

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Acknowledgments

- [Convex](https://convex.dev) for the reactive backend
- [Google Gemini](https://ai.google.dev) for AI capabilities
- [Material-UI](https://mui.com) for UI components
- [Graphite](https://graphite.dev) for design inspiration
