import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
export default defineConfig({
  plugins: [
    dts({
      outDir: "dist",
      insertTypesEntry: true, // 生成类型文件的入口
      entryRoot: "src/sipCall",
    }),
  ],
  build: {
    lib: {
      entry: "./src/sipCall/index.ts",
      name: "best-call",
      fileName: "best-call",
    },
  },
});
