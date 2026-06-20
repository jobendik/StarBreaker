import { defineConfig } from "vite";

// When deployed to GitHub Pages as a project site, assets are served from
// https://<user>.github.io/<repo>/, so the base path must match the repo name.
// `vite preview` serves the built output, so it must use the same base;
// only the dev server stays at "/".
const repository = "StarBreaker";

// CrazyGames hosts the game from an arbitrary path and only reads index.html,
// so that build must use relative ("./") asset URLs. Trigger it with
// `vite build --mode crazygames`.
export default defineConfig(({ command, isPreview, mode }) => {
  const isCrazy = mode === "crazygames";
  return {
    base: isCrazy ? "./" : command === "build" || isPreview ? `/${repository}/` : "/",
    build: {
      target: "es2020",
      outDir: isCrazy ? "crazygames" : "dist",
      sourcemap: !isCrazy,
    },
  };
});
