# Digital Vargani

Ganpati mandal app for vargani (collections), receipts, expenses, and accounts.

## Getting Started

```bash
cp .env.example .env
npm install
```

Set `AUTH_SECRET` in `.env` to a random string of at least 32 characters.

### Database: Supabase (recommended) or local Docker

**Supabase:** in the dashboard go to **Project Settings → Database → Connect**, copy the URI strings, and put them in `.env`:

- `DATABASE_URL` — Transaction pooler (port `6543`) plus `?sslmode=require&pgbouncer=true`
- `DIRECT_URL` — Session pooler (port `5432`) plus `?sslmode=require`

**Local Docker:** leave the default URLs in `.env` and run:

```bash
docker compose up -d
```

Then apply schema and demo data, and start the app:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Seeded password is `Vargani@2026` (admin mobile `9876543210`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
