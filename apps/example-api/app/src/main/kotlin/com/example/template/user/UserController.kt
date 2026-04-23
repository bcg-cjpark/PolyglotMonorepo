package com.example.template.user

import com.example.template.domain.user.UserEmailDuplicatedException
import com.example.template.domain.user.UserNotFoundException
import com.example.template.domain.user.UserService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users")
class UserController(
    private val userService: UserService,
) {
    @GetMapping
    fun list(): List<UserResponse> = userService.findAll().map(UserResponse::from)

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: Long,
    ): UserResponse = UserResponse.from(userService.findById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody @Valid request: CreateUserRequest,
    ): UserResponse = UserResponse.from(userService.create(email = request.email, name = request.name))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody @Valid request: UpdateUserRequest,
    ): UserResponse =
        UserResponse.from(
            userService.update(id = id, email = request.email, name = request.name),
        )

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        userService.delete(id)
        return ResponseEntity.noContent().build()
    }

    @ExceptionHandler(UserNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(e: UserNotFoundException): Map<String, String?> = mapOf("message" to e.message)

    @ExceptionHandler(UserEmailDuplicatedException::class)
    @ResponseStatus(HttpStatus.CONFLICT)
    fun handleDuplicatedEmail(e: UserEmailDuplicatedException): Map<String, String> = mapOf("message" to "이미 사용 중인 이메일입니다.")

    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleValidation(e: MethodArgumentNotValidException): Map<String, Any> {
        val fieldErrors =
            e.bindingResult.fieldErrors.associate { fe ->
                fe.field to (fe.defaultMessage ?: "invalid")
            }
        return mapOf(
            "message" to "입력값이 올바르지 않습니다.",
            "errors" to fieldErrors,
        )
    }
}
