// Codegen을 실행하기 전까지는 generated.ts가 존재하지 않을 수 있습니다.
// 최초 세팅 시: `nx run api-types:codegen`
//
// 사용 예:
//   import type { components } from "@monorepo/api-types";
//   type User = components["schemas"]["UserResponse"];

export type * from "./generated";
