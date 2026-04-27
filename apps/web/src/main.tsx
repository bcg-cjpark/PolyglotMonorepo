import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 1) Tailwind v4 entry + 디자인 토큰 + @theme 브릿지
//    globals.css 내부에서 @import 로 @monorepo/tokens 를 끌어와 단일 CSS graph 구성.
//    (별도로 @monorepo/tokens/styles.css 를 여기서 import 하면 @theme inline 이 별 graph 로 잡혀 utility 누락)
import "@monorepo/tailwind-config/globals";
// 2) UI 컴포넌트 글로벌 스타일 (SCSS)
import "@monorepo/ui/styles.scss";
// 3) 앱 커스텀 스타일
import "./index.css";

import App from "./App";

// TanStack Query 단일 클라이언트.
// staleTime / gcTime / retry 는 라이브러리 기본값 유지 (docs/tech-stack/frontend.md §2.1).
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
