# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
NUXT_SESSION_PASSWORD=your-session-password-min-32-chars
NUXT_OAUTH_GOOGLE_CLIENT_ID=your-google-oauth-client-id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
NUXT_PUBLIC_APP_URL=http://localhost:3000
NUXT_PUBLIC_GTAG_ID=G-XXXXXXXXXX  # Your Google Analytics 4 Measurement ID
```

**Google Analytics Setup:**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property or select an existing one
3. Copy your Measurement ID (format: `G-XXXXXXXXXX`)
4. Replace `G-XXXXXXXXXX` in your `.env` file with your actual Measurement ID

### Install Dependencies

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
