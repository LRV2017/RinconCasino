# RinconCasino
# Neon Vault — GitHub Pages

A static, browser-only casino-style arcade using **fictional demo credits**. It includes Blackjack, Roulette, Slots, Keno, Chess, Farkle, Battleship, and Rocket.

## Publish it with GitHub Pages

This package is arranged so `index.html` is at the repository root and includes a GitHub Actions workflow. No Node.js, bundler, server, API key, or build step is required.

1. Create a GitHub repository for the site.
2. Extract this ZIP and upload **the contents of this folder** to the repository root. Make sure `index.html`, `.nojekyll`, and the `.github` folder are at the root—not inside an extra `neon-vault-github-pages` folder.
3. Commit the files to the repository's `main` branch.
4. In the repository, open **Settings → Pages**. Under **Build and deployment → Source**, select **GitHub Actions**.
5. Open the **Actions** tab and check the **Deploy static site to GitHub Pages** workflow. The first deployment starts after you push to `main`.
6. When the workflow succeeds, open **Settings → Pages** to find your published URL. It will usually look like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

Every subsequent push to `main` redeploys the site. You can also run the workflow manually from the Actions tab.

## Demo wallet behavior

- A fresh browser profile starts with **2,000 fictional credits**.
- The balance is saved in that browser's `localStorage`. It is not an online account and does not synchronize across devices or browsers.
- The refill button adds demo credits for testing. Clearing browser site data resets local storage; the next visit initializes the wallet to 2,000.
- If you previously used an earlier Neon Vault version, the versioned wallet migration moves it to the 2,000-credit setup once. After that, the current saved balance is retained.

## Important limitations

This is a single-player static demo, not a real-money gambling service. Credits have no cash value and cannot be deposited, transferred, or redeemed. GitHub Pages does not add a backend, authentication, server-side balance validation, or multiplayer. The wallet is client-side and can be changed by the visitor; do not use it for anything involving real money or prizes.

## Local preview

Open `index.html` in a modern browser, or serve this folder with any static file server. There are no external runtime dependencies; the styling and game logic are contained in `index.html`.
