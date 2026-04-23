package com.example.template.todo

import com.example.template.domain.todo.TodoFixture
import com.example.template.domain.todo.TodoNotFoundException
import com.example.template.domain.todo.TodoService
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
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class TodoControllerTest(
    @Autowired private val mockMvc: MockMvc,
    @Autowired private val objectMapper: ObjectMapper,
    @MockkBean private val todoService: TodoService,
) : DescribeSpec({
        extensions(SpringExtension)

        describe("GET /todos") {
            it("status 생략 시 all 로 조회") {
                val t1 = TodoFixture.create(id = 2L, title = "Second")
                val t2 = TodoFixture.create(id = 1L, title = "First", completed = true)
                every { todoService.findAll("all") } returns listOf(t1, t2)

                mockMvc.get("/todos")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.length()") { value(2) }
                        jsonPath("$[0].id") { value(2) }
                        jsonPath("$[0].title") { value("Second") }
                        jsonPath("$[1].completed") { value(true) }
                    }
            }

            it("status=all") {
                every { todoService.findAll("all") } returns emptyList()

                mockMvc.get("/todos?status=all")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.length()") { value(0) }
                    }
            }

            it("status=active") {
                val t = TodoFixture.create(id = 1L, title = "Active", completed = false)
                every { todoService.findAll("active") } returns listOf(t)

                mockMvc.get("/todos?status=active")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$[0].completed") { value(false) }
                    }
            }

            it("status=completed") {
                val t = TodoFixture.create(id = 1L, title = "Done", completed = true)
                every { todoService.findAll("completed") } returns listOf(t)

                mockMvc.get("/todos?status=completed")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$[0].completed") { value(true) }
                    }
            }

            it("잘못된 status 값은 400") {
                every { todoService.findAll("weird") } throws IllegalArgumentException("Invalid status: weird")

                mockMvc.get("/todos?status=weird")
                    .andExpect {
                        status { isBadRequest() }
                        jsonPath("$.message") { exists() }
                    }
            }
        }

        describe("GET /todos/{id}") {
            it("단건 조회 성공") {
                every { todoService.findById(1L) } returns
                    TodoFixture.create(
                        id = 1L,
                        title = "A",
                        dueDate = LocalDate.of(2026, 5, 1),
                    )

                mockMvc.get("/todos/1")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.id") { value(1) }
                        jsonPath("$.title") { value("A") }
                        jsonPath("$.dueDate") { value("2026-05-01") }
                    }
            }

            it("없으면 404 + message") {
                every { todoService.findById(99L) } throws TodoNotFoundException(99L)

                mockMvc.get("/todos/99")
                    .andExpect {
                        status { isNotFound() }
                        jsonPath("$.message") { exists() }
                    }
            }
        }

        describe("POST /todos") {
            it("생성 성공 시 201 (dueDate 있음)") {
                val created =
                    TodoFixture.create(
                        id = 10L,
                        title = "New",
                        dueDate = LocalDate.of(2026, 5, 10),
                    )
                every {
                    todoService.create(title = "New", dueDate = LocalDate.of(2026, 5, 10))
                } returns created

                mockMvc.post("/todos") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "New", "dueDate" to "2026-05-10"),
                        )
                }.andExpect {
                    status { isCreated() }
                    jsonPath("$.id") { value(10) }
                    jsonPath("$.title") { value("New") }
                    jsonPath("$.dueDate") { value("2026-05-10") }
                    jsonPath("$.completed") { value(false) }
                }
            }

            it("생성 성공 시 201 (dueDate null)") {
                val created = TodoFixture.create(id = 11L, title = "NoDue", dueDate = null)
                every { todoService.create(title = "NoDue", dueDate = null) } returns created

                mockMvc.post("/todos") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "NoDue", "dueDate" to null),
                        )
                }.andExpect {
                    status { isCreated() }
                    jsonPath("$.id") { value(11) }
                    jsonPath("$.dueDate") { doesNotExist() }
                }
            }

            it("title 공백 시 400") {
                mockMvc.post("/todos") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("title" to "   ", "dueDate" to null))
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.title") { exists() }
                }
            }

            it("title 200자 초과 시 400") {
                val tooLong = "a".repeat(201)
                mockMvc.post("/todos") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("title" to tooLong, "dueDate" to null))
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.title") { exists() }
                }
            }
        }

        describe("PUT /todos/{id}") {
            it("전체 교체 성공") {
                val updated =
                    TodoFixture.create(
                        id = 1L,
                        title = "Renamed",
                        completed = true,
                        dueDate = LocalDate.of(2026, 6, 1),
                    )
                every {
                    todoService.update(
                        id = 1L,
                        title = "Renamed",
                        completed = true,
                        dueDate = LocalDate.of(2026, 6, 1),
                    )
                } returns updated

                mockMvc.put("/todos/1") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf(
                                "title" to "Renamed",
                                "completed" to true,
                                "dueDate" to "2026-06-01",
                            ),
                        )
                }.andExpect {
                    status { isOk() }
                    jsonPath("$.title") { value("Renamed") }
                    jsonPath("$.completed") { value(true) }
                    jsonPath("$.dueDate") { value("2026-06-01") }
                }
            }

            it("dueDate null 로 전체 교체") {
                val updated = TodoFixture.create(id = 1L, title = "T", completed = false, dueDate = null)
                every {
                    todoService.update(id = 1L, title = "T", completed = false, dueDate = null)
                } returns updated

                mockMvc.put("/todos/1") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "T", "completed" to false, "dueDate" to null),
                        )
                }.andExpect {
                    status { isOk() }
                    jsonPath("$.dueDate") { doesNotExist() }
                }
            }

            it("없으면 404") {
                every {
                    todoService.update(id = 99L, title = any(), completed = any(), dueDate = any())
                } throws TodoNotFoundException(99L)

                mockMvc.put("/todos/99") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "X", "completed" to false, "dueDate" to null),
                        )
                }.andExpect {
                    status { isNotFound() }
                }
            }

            it("title 공백 시 400") {
                mockMvc.put("/todos/1") {
                    contentType = MediaType.APPLICATION_JSON
                    content =
                        objectMapper.writeValueAsString(
                            mapOf("title" to "", "completed" to false, "dueDate" to null),
                        )
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.title") { exists() }
                }
            }
        }

        describe("PATCH /todos/{id}/toggle") {
            it("완료 반전 성공") {
                val toggled = TodoFixture.create(id = 1L, completed = true)
                every { todoService.toggle(1L) } returns toggled

                mockMvc.patch("/todos/1/toggle")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.id") { value(1) }
                        jsonPath("$.completed") { value(true) }
                    }
            }

            it("없으면 404") {
                every { todoService.toggle(99L) } throws TodoNotFoundException(99L)

                mockMvc.patch("/todos/99/toggle")
                    .andExpect {
                        status { isNotFound() }
                    }
            }
        }

        describe("DELETE /todos/{id}") {
            it("삭제 성공 시 204") {
                every { todoService.delete(1L) } just runs

                mockMvc.delete("/todos/1")
                    .andExpect {
                        status { isNoContent() }
                    }

                verify { todoService.delete(1L) }
            }

            it("없으면 404") {
                every { todoService.delete(99L) } throws TodoNotFoundException(99L)

                mockMvc.delete("/todos/99")
                    .andExpect {
                        status { isNotFound() }
                    }
            }
        }
    })
