<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7bcba9b1-17ea-4463-96c1-0f5b487bd7f7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Share With Friends (GitHub Pages)

Project page URL:
`https://nekooo6957.github.io/iFEED/`

This repo now includes a Pages workflow:
`/.github/workflows/deploy-pages.yml`

After pushing to `main`, GitHub Actions will:
1. Build with `npm run build:pages`
2. Publish `dist` to GitHub Pages

If the page still does not load:
1. Open repo `Settings > Pages`
2. Ensure `Source` is `GitHub Actions`
3. Wait for the `Deploy To GitHub Pages` workflow to finish
