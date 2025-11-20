import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import fs from "fs";
import type { Plugin } from "vite";

const emitStyles = (): Plugin => ({
  name: "emit-calendar-styles",
  apply: "build",
  generateBundle() {
    const cssPath = resolve(__dirname, "src/styles/styles.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    this.emitFile({
      type: "asset",
      fileName: "styles.css",
      source: css,
    });
  },
});

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "adapters/dayjs": resolve(__dirname, "src/adapters/DayJsAdapter.ts"),
        "adapters/native": resolve(
          __dirname,
          "src/adapters/NativeDateAdapter.ts",
        ),
        "adapters/date-fns": resolve(
          __dirname,
          "src/adapters/DateFnsAdapter.ts",
        ),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "js" : "cjs";
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: ["dayjs", "date-fns"],
      output: {
        exports: "named",
        globals: {
          dayjs: "dayjs",
        },
      },
    },
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  plugins: [
    dts({
      include: ["src"],
      outDir: "dist",
      rollupTypes: true,
    }),
    emitStyles(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
