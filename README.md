# Futures AI Trading Frontend

## Setup
1. Clone the repository: `git clone <frontend-repo-url>`
2. Navigate to the directory: `cd futures-ai-trading-frontend`
3. Deploy to Netlify (see below).

## Deployment on Netlify
1. Go to [netlify.com](https://netlify.com) and sign in.
2. Click "New site from Git" > Select GitHub > Choose `futures-ai-trading-frontend`.
3. Set build command: `npm start` (or leave blank since it’s static).
4. Set publish directory: `.` (root).
5. Deploy the site. Note the URL (e.g., `https://futures-ai-trading.netlify.app`).

## Notes
- Update `scripts.js` with your Vercel backend URL (e.g., `https://futures-ai-trading-backend.vercel.app`).
