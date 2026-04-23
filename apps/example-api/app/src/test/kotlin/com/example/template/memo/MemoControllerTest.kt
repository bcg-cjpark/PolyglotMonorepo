package com.example.template.memo

import com.example.template.domain.memo.Memo
import com.example.template.domain.memo.MemoFixture
import com.example.template.domain.memo.MemoNotFoundException
import com.example.template.domain.memo.MemoService
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.extensions.spring.SpringExtension
import io.mockk.every
import io.mockk.just
import io.mockk.runs
import io.mockk.verify
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID

// addFilters = false: 현재 SecurityConfig 에 `/memos/**` permitAll 이 아직 추가되지 않은 상태(backend-lead 통합 커밋 시점에 반영 예정).
// 컨트롤러 계약 테스트에 SecurityFilterChain 을 태우지 않음으로써 Memo 단독 검증을 가능하게 한다.
// SecurityConfig 에 `/memos/**` 가 추가되면 이 옵션을 제거해도 동일하게 동작한다.
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("local")
class MemoControllerTest(
    @Autowired private val mockMvc: MockMvc,
    @Autowired private val objectMapper: ObjectMapper,
    @MockkBean private val memoService: MemoService,
) : DescribeSpec({
        extensions(SpringExtension)

        val id1 = UUID.fromString("11111111-1111-1111-1111-111111111111")
        val id2 = UUID.fromString("22222222-2222-2222-2222-222222222222")
        val missingId = UUID.fromString("99999999-9999-9999-9999-999999999999")

        describe("GET /memos") {
            it("빈 페이지 반환") {
                val empty =
                    PageImpl<Memo>(
                        emptyList(),
                        PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")),
                        0,
                    )
                every { memoService.findAll(page = 0, size = 20) } returns empty

                mockMvc.get("/memos")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.content.length()") { value(0) }
                        jsonPath("$.totalElements") { value(0) }
                        jsonPath("$.totalPages") { value(0) }
                        jsonPath("$.page") { value(0) }
                        jsonPath("$.size") { value(20) }
                    }
            }

            it("기본 page=0, size=20 파라미터로 호출된다") {
                val m1 = MemoFixture.create(id = id1, title = "First", content = "c1")
                val m2 = MemoFixture.create(id = id2, title = "Second", content = null)
                val page =
                    PageImpl(
                        listOf(m1, m2),
                        PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")),
                        2,
                    )
                every { memoService.findAll(page = 0, size = 20) } returns page

                mockMvc.get("/memos")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.content.length()") { value(2) }
                        jsonPath("$.content[0].id") { value(id1.toString()) }
                        jsonPath("$.content[0].title") { value("First") }
                        jsonPath("$.content[0].content") { value("c1") }
                        jsonPath("$.content[1].content") { value(null) }
                        jsonPath("$.totalElements") { value(2) }
                        jsonPath("$.totalPages") { value(1) }
                        jsonPath("$.page") { value(0) }
                        jsonPath("$.size") { value(20) }
                    }

                verify { memoService.findAll(page = 0, size = 20) }
            }

            it("쿼리 파라미터 page/size 를 전달한다") {
                val empty =
                    PageImpl<Memo>(
                        emptyList(),
                        PageRequest.of(2, 5, Sort.by(Sort.Direction.DESC, "createdAt")),
                        0,
                    )
                every { memoService.findAll(page = 2, size = 5) } returns empty

                mockMvc.get("/memos?page=2&size=5")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.page") { value(2) }
                        jsonPath("$.size") { value(5) }
                    }

                verify { memoService.findAll(page = 2, size = 5) }
            }
        }

        describe("GET /memos/{id}") {
            it("단건 조회 성공") {
                every { memoService.findById(id1) } returns
                    MemoFixture.create(id = id1, title = "Hello", content = "World")

                mockMvc.get("/memos/$id1")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.id") { value(id1.toString()) }
                        jsonPath("$.title") { value("Hello") }
                        jsonPath("$.content") { value("World") }
                    }
            }

            it("없으면 404 + message") {
                every { memoService.findById(missingId) } throws MemoNotFoundException(missingId)

                mockMvc.get("/memos/$missingId")
                    .andExpect {
                        status { isNotFound() }
                        jsonPath("$.message") { exists() }
                    }
            }

            it("UUID 형식이 아니면 404") {
                mockMvc.get("/memos/not-a-uuid")
                    .andExpect {
                        status { isNotFound() }
                        jsonPath("$.message") { exists() }
                    }
            }
        }

        describe("POST /memos") {
            it("생성 성공 시 201, content null 허용") {
                val created = MemoFixture.create(id = id1, title = "New", content = null)
                every { memoService.create(title = "New", content = null) } returns created

                mockMvc.post("/memos") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("title" to "New", "content" to null))
                }.andExpect {
                    status { isCreated() }
                    jsonPath("$.id") { value(id1.toString()) }
                    jsonPath("$.title") { value("New") }
                    jsonPath("$.content") { value(null) }
                }
            }

            it("생성 성공 시 201, content 포함") {
                val created = MemoFixture.create(id = id1, title = "New", content = "body")
                every { memoService.create(title = "New", content = "body") } returns created

                mockMvc.post("/memos") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("title" to "New", "content" to "body"))
                }.andExpect {
                    status { isCreated() }
                    jsonPath("$.title") { value("New") }
                    jsonPath("$.content") { value("body") }
                }
            }

            it("title 공백만인 경우 400") {
                mockMvc.post("/memos") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("title" to "   ", "content" to "x"))
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.title") { exists() }
                }
            }

            it("title 누락 시 400") {
                mockMvc.post("/memos") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("content" to "x"))
                }.andExpect {
                    status { isBadRequest() }
                }
            }

            it("title 100자 초과 시 400") {
                mockMvc.post("/memos") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("title" to "a".repeat(101), "content" to null))
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.title") { exists() }
                }
            }

            it("content 5000자 초과 시 400") {
                mockMvc.post("/memos") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "ok", "content" to "a".repeat(5001)),
                        )
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.content") { exists() }
                }
            }
        }

        describe("PUT /memos/{id}") {
            it("전체 교체 성공") {
                val updated = MemoFixture.create(id = id1, title = "Renamed", content = "new body")
                every {
                    memoService.update(id = id1, title = "Renamed", content = "new body")
                } returns updated

                mockMvc.put("/memos/$id1") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "Renamed", "content" to "new body"),
                        )
                }.andExpect {
                    status { isOk() }
                    jsonPath("$.title") { value("Renamed") }
                    jsonPath("$.content") { value("new body") }
                }
            }

            it("content 를 null 로 명시하면 null 로 저장된다") {
                val updated = MemoFixture.create(id = id1, title = "T", content = null)
                every {
                    memoService.update(id = id1, title = "T", content = null)
                } returns updated

                mockMvc.put("/memos/$id1") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "T", "content" to null),
                        )
                }.andExpect {
                    status { isOk() }
                    jsonPath("$.content") { value(null) }
                }
            }

            it("content 를 빈 문자열로 지정하면 그대로 저장된다") {
                val updated = MemoFixture.create(id = id1, title = "T", content = "")
                every {
                    memoService.update(id = id1, title = "T", content = "")
                } returns updated

                mockMvc.put("/memos/$id1") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "T", "content" to ""),
                        )
                }.andExpect {
                    status { isOk() }
                    jsonPath("$.content") { value("") }
                }
            }

            it("없으면 404") {
                every {
                    memoService.update(id = missingId, title = any(), content = any())
                } throws MemoNotFoundException(missingId)

                mockMvc.put("/memos/$missingId") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "x", "content" to "y"),
                        )
                }.andExpect {
                    status { isNotFound() }
                }
            }

            it("title 공백만 시 400") {
                mockMvc.put("/memos/$id1") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "   ", "content" to "x"),
                        )
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.title") { exists() }
                }
            }
        }

        describe("DELETE /memos/{id}") {
            it("삭제 성공 시 204") {
                every { memoService.delete(id1) } just runs

                mockMvc.delete("/memos/$id1")
                    .andExpect {
                        status { isNoContent() }
                    }

                verify { memoService.delete(id1) }
            }

            it("없으면 404") {
                every { memoService.delete(missingId) } throws MemoNotFoundException(missingId)

                mockMvc.delete("/memos/$missingId")
                    .andExpect {
                        status { isNotFound() }
                    }
            }
        }
    })
