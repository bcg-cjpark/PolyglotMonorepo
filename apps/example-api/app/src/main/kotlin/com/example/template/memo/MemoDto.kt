package com.example.template.memo

import com.example.template.domain.memo.Memo
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.domain.Page
import java.time.LocalDateTime
import java.util.UUID

data class MemoResponse(
    val id: UUID,
    val title: String,
    val content: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun from(memo: Memo): MemoResponse =
            MemoResponse(
                id = memo.id,
                title = memo.title,
                content = memo.content,
                createdAt = memo.createdAt,
                updatedAt = memo.updatedAt,
            )
    }
}

data class CreateMemoRequest(
    @field:NotBlank
    @field:Size(min = 1, max = 100)
    val title: String,
    @field:Size(max = 5000)
    val content: String? = null,
)

data class UpdateMemoRequest(
    @field:NotBlank
    @field:Size(min = 1, max = 100)
    val title: String,
    @field:Size(max = 5000)
    val content: String?,
)

data class PageResponse<T>(
    val content: List<T>,
    val totalElements: Long,
    val totalPages: Int,
    val page: Int,
    val size: Int,
) {
    companion object {
        fun <E, R> from(
            page: Page<E>,
            mapper: (E) -> R,
        ): PageResponse<R> =
            PageResponse(
                content = page.content.map(mapper),
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size,
            )
    }
}
