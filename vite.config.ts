import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [
    tanstackStart({
      server: {
        entry: "src/server.ts",
      },
    }),
    tsconfigPaths(),
    tailwindcss(),
  ],
});
