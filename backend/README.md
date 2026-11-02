# Doswall backend

This Express API uses MySQL. Keep its credentials in the hosting provider's
environment settings; do not commit `.env` files or database dumps.

## Local setup

1. Copy `.env.example` to `.env` and set the local MySQL credentials.
2. Create the `doswall` database and run `schema.sql`.
3. Run `npm ci` and `npm start` from this directory.
4. To create test accounts, run `npm run seed:test-users` after the API can
   connect to the database.

The generated test accounts are `user@gmail.com`, `admin@gmail.com`, and
`superadmin@gmail.com`. Their shared password is `password`. These are public
demo credentials; never use them with real user data.

## Railway deployment

Create a Railway project with a MySQL service and a backend service connected
to this repository. Set the backend service root directory to `/backend`.
Railway uses `railway.json` to start the API and check `/health`.

Run `schema.sql` against the test database, then set these variables on the
backend service:

- `NODE_ENV=production`
- `APP_KEY` — a test value matching the frontend build variable below
- `CORS_ORIGINS=https://devakurniasetiawan.github.io`
- `FRONTEND_URL=https://devakurniasetiawan.github.io/doswall-frontend`
- `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE`
  from the Railway MySQL service

Railway supplies `PORT` to the backend. Do not add a `.env` file to GitHub.
After the backend is healthy, run `npm run seed:test-users` once from this
directory with the backend service's database variables available.

## Connect GitHub Pages

In the repository's **Settings → Secrets and variables → Actions → Variables**,
set:

- `NEXT_PUBLIC_API_URL` to the deployed backend base URL, without a trailing
  slash (for example, `https://your-api.example`)
- `NEXT_PUBLIC_DOSWALL_APP_KEY` to the same test value as backend `APP_KEY`
- `NEXT_PUBLIC_USE_DUMMY` to `false`

The app-key value is included in the public frontend bundle, so it is only a
test identifier—not a secret or a substitute for user authentication. Pushing
to `main` rebuilds and redeploys the GitHub Pages frontend.
