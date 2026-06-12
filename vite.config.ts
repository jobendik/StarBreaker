import { defineConfig } from "vite";

// When deployed to GitHub Pages as a project site, assets are served from
// https://<user>.github.io/<repo>/, so the base path must match the repo name.
// `vite preview` serves the built output, so it must use the same base;
// only the dev server stays at "/".
const repository = "StarBreaker";

export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? `/${repository}/` : "/",
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
  },
}));
