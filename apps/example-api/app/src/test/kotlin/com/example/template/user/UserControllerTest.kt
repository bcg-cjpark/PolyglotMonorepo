package com.example.template.user

import com.example.template.domain.user.UserEmailDuplicatedException
import com.example.template.domain.user.UserFixture
import com.example.template.domain.user.UserNotFoundException
import com.example.template.domain.user.UserService
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
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class UserControllerTest(
    @Autowired private val mockMvc: MockMvc,
    @Autowired private val objectMapper: ObjectMapper,
    @MockkBean private val userService: UserService,
) : DescribeSpec({
        extensions(SpringExtension)

        describe("GET /users") {
            it("빈 리스트 반환") {
                every { userService.findAll() } returns emptyList()

                mockMvc.get("/users")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.length()") { value(0) }
                    }
            }

            it("사용자 목록을 createdAt 최신순으로 반환") {
                val u1 = UserFixture.create(id = 2L, email = "a@example.com", name = "A")
                val u2 = UserFixture.create(id = 1L, email = "b@example.com", name = "B")
                every { userService.findAll() } returns listOf(u1, u2)

                mockMvc.get("/users")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$[0].id") { value(2) }
                        jsonPath("$[0].email") { value("a@example.com") }
                        jsonPath("$[1].id") { value(1) }
                    }
            }
        }

        describe("GET /users/{id}") {
            it("단건 조회 성공") {
                every { userService.findById(1L) } returns UserFixture.create(id = 1L)

                mockMvc.get("/users/1")
                    .andExpect {
                        status { isOk() }
                        jsonPath("$.id") { value(1) }
                        jsonPath("$.email") { value("user@example.com") }
                    }
            }

            it("없으면 404 + message") {
                every { userService.findById(99L) } throws UserNotFoundException(99L)

                mockMvc.get("/users/99")
                    .andExpect {
                        status { isNotFound() }
                        jsonPath("$.message") { exists() }
                    }
            }
        }

        describe("POST /users") {
            it("생성 성공 시 201") {
                val created = UserFixture.create(id = 10L, email = "new@example.com", name = "New")
                every { userService.create(email = "new@example.com", name = "New") } returns created

                mockMvc.post("/users") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("email" to "new@example.com", "name" to "New"))
                }.andExpect {
                    status { isCreated() }
                    jsonPath("$.id") { value(10) }
                    jsonPath("$.email") { value("new@example.com") }
                }
            }

            it("이메일 형식 위반 시 400") {
                mockMvc.post("/users") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("email" to "invalid", "name" to "New"))
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.email") { exists() }
                }
            }

            it("name 공백 시 400") {
                mockMvc.post("/users") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("email" to "x@example.com", "name" to "   "))
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.errors.name") { exists() }
                }
            }

            it("이메일 중복 시 409") {
                every { userService.create(email = "dup@example.com", name = "Dup") } throws
                    UserEmailDuplicatedException("dup@example.com")

                mockMvc.post("/users") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("email" to "dup@example.com", "name" to "Dup"))
                }.andExpect {
                    status { isConflict() }
                    jsonPath("$.message") { value("이미 사용 중인 이메일입니다.") }
                }
            }
        }

        describe("PUT /users/{id}") {
            it("전체 교체 성공") {
                val updated = UserFixture.create(id = 1L, email = "new@example.com", name = "Renamed")
                every { userService.update(id = 1L, email = "new@example.com", name = "Renamed") } returns updated

                mockMvc.put("/users/1") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("email" to "new@example.com", "name" to "Renamed"))
                }.andExpect {
                    status { isOk() }
                    jsonPath("$.email") { value("new@example.com") }
                    jsonPath("$.name") { value("Renamed") }
                }
            }

            it("없으면 404") {
                every { userService.update(id = 99L, email = any(), name = any()) } throws UserNotFoundException(99L)

                mockMvc.put("/users/99") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("email" to "x@example.com", "name" to "X"))
                }.andExpect {
                    status { isNotFound() }
                }
            }

            it("다른 유저 이메일과 중복 시 409") {
                every { userService.update(id = 1L, email = "taken@example.com", name = "N") } throws
                    UserEmailDuplicatedException("taken@example.com")

                mockMvc.put("/users/1") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(mapOf("email" to "taken@example.com", "name" to "N"))
                }.andExpect {
                    status { isConflict() }
                    jsonPath("$.message") { value("이미 사용 중인 이메일입니다.") }
                }
            }
        }

        describe("DELETE /users/{id}") {
            it("삭제 성공 시 204") {
                every { userService.delete(1L) } just runs

                mockMvc.delete("/users/1")
                    .andExpect {
                        status { isNoContent() }
                    }

                verify { userService.delete(1L) }
            }

            it("없으면 404") {
                every { userService.delete(99L) } throws UserNotFoundException(99L)

                mockMvc.delete("/users/99")
                    .andExpect {
                        status { isNotFound() }
                    }
            }
        }
    })
