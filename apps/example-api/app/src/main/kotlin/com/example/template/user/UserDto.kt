package com.example.template.user

import com.example.template.domain.user.User
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDateTime

data class UserResponse(
    val id: Long,
    val email: String,
    val name: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun from(user: User): UserResponse =
            UserResponse(
                id = user.id,
                email = user.email,
                name = user.name,
                createdAt = user.createdAt,
                updatedAt = user.updatedAt,
            )
    }
}

data class CreateUserRequest(
    @field:NotBlank
    @field:Email
    @field:Size(max = 255)
    val email: String,
    @field:NotBlank
    @field:Size(max = 100)
    val name: String,
)

data class UpdateUserRequest(
    @field:NotBlank
    @field:Email
    @field:Size(max = 255)
    @field:JsonProperty(required = true)
    val email: String,
    @field:NotBlank
    @field:Size(max = 100)
    @field:JsonProperty(required = true)
    val name: String,
)
