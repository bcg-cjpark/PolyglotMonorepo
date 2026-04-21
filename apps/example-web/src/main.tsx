import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// 1) Tailwind v4 entry + 디자인 토큰 + @theme 브릿지
//    globals.css 내부에서 @import 로 @monorepo/tokens 를 끌어와 단일 CSS graph 구성.
//    (별도로 @monorepo/tokens/styles.css 를 여기서 import 하면 @theme inline 이 별 graph 로 잡혀 utility 누락)
import "@monorepo/tailwind-config/globals";
// 2) UI 컴포넌트 글로벌 스타일 (SCSS)
import "@monorepo/ui/styles.scss";
// 3) 앱 커스텀 스타일
import "./index.css";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
