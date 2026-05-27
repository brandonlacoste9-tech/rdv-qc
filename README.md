# Planxo

Planxo is a scheduling platform inspired by Calendly and Cal.com, with booking pages, event types, availability management, payments, and voice automation.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Prisma + PostgreSQL
- Supabase (auth + data access)
- Stripe (payments)
- Resend (email)
- Twilio/Deepgram/ElevenLabs (voice features)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file from template:

```bash
cp .env.example .env
```

3. Fill required values in `.env` (at minimum):

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`

4. Generate Prisma client:

```bash
npm run postinstall
```

5. Start development server:

```bash
npm run dev
```

App URL: `http://localhost:3000`

## Quality Checks

Run lint + type checks before pushing:

```bash
npm run verify
```

Available scripts:

- `npm run dev`: Start local dev server
- `npm run build`: Create production build
- `npm run start`: Run production server
- `npm run lint`: Run ESLint CLI
- `npm run typecheck`: Run TypeScript checks
- `npm run verify`: Run lint and typecheck

## Notes

- Build and API routes require Supabase environment variables. Missing Supabase values will fail runtime requests for Supabase-dependent endpoints.
- Voice routes additionally require Twilio, Deepgram, and ElevenLabs keys.
