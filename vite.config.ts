import { defineConfig } from "vite";

// When deployed to GitHub Pages as a project site, assets are served from
// https://<user>.github.io/<repo>/, so the base path must match the repo name.
// Locally (dev/preview) the base stays "/".
const repository = "StarBreaker";

export default defineConfig(({ command }) => ({
  base: command === "build" ? `/${repository}/` : "/",
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
  },
}));
