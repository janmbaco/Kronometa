import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/Kronometa/" : "/",
  build: {
    sourcemap: true,
    target: "es2022"
  }
}));
