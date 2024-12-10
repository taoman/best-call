import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
export default defineConfig({
  server:{
    port: 3003
  },
  plugins: [
    dts({
      outDir: "dist",
      insertTypesEntry: true, // 生成类型文件的入口
      entryRoot: "src/best-call",
    }),
  ],
  build: {
    lib: {
      entry: "./src/best-call/index.ts",
      name: "best-call",
      fileName: "best-call",
    },
  },
});
