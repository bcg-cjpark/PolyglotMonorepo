package com.example.template.user

import com.example.template.domain.user.UserFixture
import com.example.template.domain.user.UserService
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
class UserControllerTest(
    @Autowired private val mockMvc: MockMvc,
    @MockkBean private val userService: UserService,
) : DescribeSpec({
        extensions(SpringExtension)

        describe("GET /users") {
            it("returns list of users") {
                every { userService.findAll() } returns listOf(UserFixture.create())

                mockMvc.get("/users")
                    .andExpect {
                        status { isOk() }
                    }
            }
        }
    })
