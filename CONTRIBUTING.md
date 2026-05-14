# Contributing to Lex Grove

Thanks for your interest in contributing. This document describes how to set up
the project locally, the standards we follow, and how to send a pull request.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By
participating, you agree to uphold its terms.

## Reporting Security Issues

Do **not** open a public GitHub issue for vulnerabilities. Follow the process
in [SECURITY.md](SECURITY.md) instead.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Firebase project (free tier is fine) for authentication and Firestore
- Optional: API keys for Stripe, OpenAI, Groq, Gemini, ElevenLabs, and
  Pinecone if you want to exercise the corresponding features

## Local setup

```bash
git clone https://github.com/<org>/lex-briefs-ai.git
cd lex-briefs-ai
npm install
cp .env.example .env
# fill in real values for the services you want to test
npm run dev:all
```

`npm run dev:all` starts:

- The Vite dev server (the React app) on port 5173
- The Express API server (`Backend/api-server-simple.js`) on port 3000

The Vite dev server proxies `/api/*` to the Express server, so authenticated
backend calls (PDF summarization, AI chat) work end to end.

### Configuring Firebase

`.firebaserc` is intentionally a placeholder in the public repo. To run the
app against your own Firebase project:

1. Create a project at <https://console.firebase.google.com>.
2. Enable Email/Password (or Google) auth and create a Firestore database.
3. Copy the web config into `.env` (`VITE_FIREBASE_*` variables).
4. Update `.firebaserc` with your project id, or run `npx firebase use --add`.

## Development standards

- **Language**: TypeScript everywhere (strict mode where possible). New JS
  files should be the rare exception.
- **Styling**: Tailwind CSS only. Avoid one-off CSS files unless absolutely
  required.
- **UI**: Mobile-first, neumorphic look (subtle shadows, rounded corners,
  gentle gradients). Reuse the components in `Frontend/components/ui/`.
- **State**: Local component state where possible; React Context for
  cross-cutting concerns (see `Frontend/contexts/AuthContext.tsx`).
- **Routing**: Always use React Router's `<Link>` (not raw `<a>`).
- **Accessibility**: Keyboard-navigable, ARIA labels, semantic HTML, alt
  text. Touch targets at least 48x48 px.
- **Lint**: `npm run lint` must pass with zero warnings.

## Security and secrets

- Never commit `.env`, service-account JSON, private keys, or anything
  sensitive. The pre-commit hook (secretlint) will block obvious leaks; do
  not bypass it.
- Server-side API keys belong in `process.env.*`, never in `import.meta.env`
  (which inlines values into the client bundle).
- Validate and sanitize every user input. Prefer Zod schemas, `express-
  validator`, and `dompurify` for content rendered as HTML.

## Pull request workflow

1. Fork the repo and create a topic branch from `main`.
2. Make your changes, plus tests where applicable.
3. Run `npm run lint` and verify the app builds with `npm run build`.
4. Commit using descriptive messages (Conventional Commits style is
   appreciated but not required).
5. Open a PR against `main`. Describe **what** changed, **why**, and how to
   test it. Link related issues.
6. Be responsive to review feedback. Squash on merge unless the maintainer
   requests otherwise.

## Releasing

Maintainers cut releases by tagging `main` with `vX.Y.Z`. CI will run the
secret scan, dependency audit, and full build before publication.

## Questions

Open a GitHub Discussion or ping the maintainers. Issues are reserved for
bug reports and concrete feature requests.
