package com.example.template.user

import com.example.template.domain.user.User
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class UserResponse(
    val id: Long,
    val email: String,
    val name: String,
) {
    companion object {
        fun from(user: User): UserResponse = UserResponse(id = user.id, email = user.email, name = user.name)
    }
}

data class CreateUserRequest(
    @field:Email @field:NotBlank val email: String,
    @field:NotBlank val name: String,
)

data class UpdateUserRequest(
    @field:NotBlank val name: String,
)
