package com.example.template.todo

import com.example.template.domain.todo.TodoService
import com.example.template.domain.todo.TodoStatus
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.WebDataBinder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.InitBinder
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.beans.PropertyEditorSupport

@RestController
@RequestMapping("/todos")
class TodoController(
    private val todoService: TodoService,
) {
    @InitBinder
    fun initBinder(binder: WebDataBinder) {
        binder.registerCustomEditor(
            TodoStatus::class.java,
            object : PropertyEditorSupport() {
                override fun setAsText(text: String?) {
                    value = text?.takeIf { it.isNotBlank() }?.uppercase()?.let(TodoStatus::valueOf)
                }
            },
        )
    }

    @GetMapping
    fun list(
        @RequestParam(defaultValue = "ALL") status: TodoStatus,
    ): List<TodoResponse> = todoService.list(status).map(TodoResponse::from)

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: Long,
    ): TodoResponse = TodoResponse.from(todoService.findById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody @Valid request: CreateTodoRequest,
    ): TodoResponse =
        TodoResponse.from(
            todoService.create(
                title = request.title,
                description = request.description,
                dueDate = request.dueDate,
            ),
        )

    @PatchMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody @Valid request: UpdateTodoRequest,
    ): TodoResponse =
        TodoResponse.from(
            todoService.update(
                id = id,
                title = request.title,
                description = request.description,
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
}
