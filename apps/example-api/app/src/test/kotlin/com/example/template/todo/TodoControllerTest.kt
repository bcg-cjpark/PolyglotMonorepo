package com.example.template.todo

import com.example.template.domain.todo.TodoFixture
import com.example.template.domain.todo.TodoService
import com.example.template.domain.todo.TodoStatus
import com.ninjasquad.springmockk.MockkBean
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.extensions.spring.SpringExtension
import io.mockk.every
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class TodoControllerTest(
    @Autowired private val mockMvc: MockMvc,
    @MockkBean private val todoService: TodoService,
) : DescribeSpec({
        extensions(SpringExtension)

        describe("GET /todos") {
            it("returns list of todos") {
                every { todoService.list(TodoStatus.ALL) } returns listOf(TodoFixture.create())

                mockMvc.get("/todos")
                    .andExpect {
                        status { isOk() }
                    }
            }
        }
    })
