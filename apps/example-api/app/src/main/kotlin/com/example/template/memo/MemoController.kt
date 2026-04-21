package com.example.template.memo

import com.example.template.domain.memo.MemoNotFoundException
import com.example.template.domain.memo.MemoService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/memos")
class MemoController(
    private val memoService: MemoService,
) {
    @GetMapping
    fun list(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): PageResponse<MemoResponse> = PageResponse.from(memoService.list(page, size), MemoResponse::from)

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: UUID,
    ): MemoResponse = MemoResponse.from(memoService.findById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody @Valid request: CreateMemoRequest,
    ): MemoResponse =
        MemoResponse.from(
            memoService.create(
                title = request.title,
                content = request.content,
            ),
        )

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody @Valid request: UpdateMemoRequest,
    ): MemoResponse =
        MemoResponse.from(
            memoService.update(
                id = id,
                title = request.title,
                content = request.content,
            ),
        )

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: UUID,
    ): ResponseEntity<Void> {
        memoService.delete(id)
        return ResponseEntity.noContent().build()
    }

    @ExceptionHandler(MemoNotFoundException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(e: MemoNotFoundException): Map<String, String?> = mapOf("message" to e.message)
}
