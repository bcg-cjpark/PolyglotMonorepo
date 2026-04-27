import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { uiPackageResolveAliases } from "../../scripts/vite-ui-consumer.mjs";

const monorepoRoot = fileURLToPath(new URL("../..", import.meta.url));

// 개발 서버는 `/api/*` 요청을 백엔드로 프록시합니다.
// 프론트엔드 코드에서는 axios baseURL을 `/api` 로 고정하고, 여기서만 백엔드 URL을 관리합니다.
// 백엔드 포트/호스트가 다르면 .env 또는 .env.local 에 VITE_API_TARGET 을 지정하세요.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        ...uiPackageResolveAliases(monorepoRoot),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
    },
  };
});
