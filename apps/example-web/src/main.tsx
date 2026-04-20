import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// 1) 디자인 토큰 (CSS 변수) — 반드시 Tailwind보다 먼저 import
import "@monorepo/tokens/styles.css";
// 2) Tailwind v4 + @theme 기본값
import "@monorepo/tailwind-config/globals";
// 3) UI 컴포넌트 글로벌 스타일 (SCSS)
import "@monorepo/ui/styles.scss";
// 4) 앱 커스텀 스타일
import "./index.css";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
