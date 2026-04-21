package com.example.template.domain.memo

import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class MemoService(
    private val memoRepository: MemoRepository,
) {
    fun list(
        page: Int,
        size: Int,
    ): Page<Memo> = memoRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))

    fun findById(id: UUID): Memo =
        memoRepository.findById(id).orElseThrow {
            MemoNotFoundException(id)
        }

    @Transactional
    fun create(
        title: String,
        content: String?,
    ): Memo {
        require(title.trim().isNotBlank()) { "title must not be blank" }
        return memoRepository.save(
            Memo(
                title = title,
                content = content,
            ),
        )
    }

    @Transactional
    fun update(
        id: UUID,
        title: String,
        content: String?,
    ): Memo {
        require(title.trim().isNotBlank()) { "title must not be blank" }
        val memo = findById(id)
        memo.update(title = title, content = content)
        return memo
    }

    @Transactional
    fun delete(id: UUID) {
        val memo = findById(id)
        memoRepository.delete(memo)
    }
}

class MemoNotFoundException(id: UUID) : RuntimeException("Memo not found: $id")
