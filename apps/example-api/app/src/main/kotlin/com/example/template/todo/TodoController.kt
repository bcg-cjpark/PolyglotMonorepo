package com.example.template.todo

import com.example.template.domain.todo.TodoNotFoundException
import com.example.template.domain.todo.TodoService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/todos")
class TodoController(
    private val todoService: TodoService,
) {
    @GetMapping
    fun list(
        @RequestParam(defaultValue = "all") status: String,
    ): List<TodoResponse> = todoService.findAll(status).map(TodoResponse::from)

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: Long,
    ): TodoResponse = TodoResponse.from(todoService.findById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody @Valid request: CreateTodoRequest,
    ): TodoResponse = TodoResponse.from(todoService.create(title = request.title, dueDate = request.dueDate))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody @Valid request: UpdateTodoRequest,
    ): TodoResponse =
        TodoResponse.from(
            todoService.update(
                id = id,
                title = request.title,
                completed = request.completed,
                dueDate = request.dueDate,
            ),
        )

    @PatchMapping("/{id}/toggle")
    fun toggle(
        @PathVariable id: Long,
    ): TodoResponse = TodoResponse.from(todoService.toggle(id))

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        todoService.delete(id)
        return ResponseEntity.noContent().build()
    }

    @ExceptionHandler(TodoNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(e: TodoNotFoundException): Map<String, String?> = mapOf("message" to e.message)

    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleIllegalArgument(e: IllegalArgumentException): Map<String, String?> = mapOf("message" to (e.message ?: "잘못된 요청입니다."))

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
