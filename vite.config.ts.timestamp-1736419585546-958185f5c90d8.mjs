// vite.config.ts
import { defineConfig } from "file:///D:/companyProject/best-call/node_modules/vite/dist/node/index.js";
import dts from "file:///D:/companyProject/best-call/node_modules/vite-plugin-dts/dist/index.mjs";
var vite_config_default = defineConfig({
  server: {
    port: 3003
  },
  plugins: [
    dts({
      outDir: "dist",
      insertTypesEntry: true,
      // 生成类型文件的入口
      entryRoot: "src/best-call"
    })
  ],
  build: {
    lib: {
      entry: "./src/best-call/index.ts",
      name: "best-call",
      fileName: "best-call"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxjb21wYW55UHJvamVjdFxcXFxiZXN0LWNhbGxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGNvbXBhbnlQcm9qZWN0XFxcXGJlc3QtY2FsbFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovY29tcGFueVByb2plY3QvYmVzdC1jYWxsL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBkdHMgZnJvbSBcInZpdGUtcGx1Z2luLWR0c1wiO1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgc2VydmVyOntcbiAgICBwb3J0OiAzMDAzXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBkdHMoe1xuICAgICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICAgIGluc2VydFR5cGVzRW50cnk6IHRydWUsIC8vIFx1NzUxRlx1NjIxMFx1N0M3Qlx1NTc4Qlx1NjU4N1x1NEVGNlx1NzY4NFx1NTE2NVx1NTNFM1xuICAgICAgZW50cnlSb290OiBcInNyYy9iZXN0LWNhbGxcIixcbiAgICB9KSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiBcIi4vc3JjL2Jlc3QtY2FsbC9pbmRleC50c1wiLFxuICAgICAgbmFtZTogXCJiZXN0LWNhbGxcIixcbiAgICAgIGZpbGVOYW1lOiBcImJlc3QtY2FsbFwiLFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVEsU0FBUyxvQkFBb0I7QUFDdFMsT0FBTyxTQUFTO0FBQ2hCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFDUixrQkFBa0I7QUFBQTtBQUFBLE1BQ2xCLFdBQVc7QUFBQSxJQUNiLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
