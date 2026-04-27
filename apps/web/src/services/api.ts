import axios from "axios";

// 항상 `/api` 상대 경로를 사용합니다.
// - 개발: Vite dev server가 `/api/*` 를 백엔드로 프록시 (vite.config.ts 참고)
// - 프로덕션: 정적 호스팅(nginx 등) 에서 동일하게 `/api` 를 백엔드로 라우팅
// 브라우저에서 `http://localhost:8080` 을 직접 호출하면 CORS 에러가 발생하므로 금지.
export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);
