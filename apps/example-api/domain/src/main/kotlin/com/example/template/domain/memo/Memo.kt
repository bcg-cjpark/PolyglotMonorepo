package com.example.template.domain.memo

import com.example.template.domain.common.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "memos")
class Memo(
    @Column(nullable = false, length = 100)
    var title: String,
    @Column(nullable = true, length = 5000)
    var content: String? = null,
    @Id
    @Column(nullable = false, updatable = false, columnDefinition = "CHAR(36)")
    val id: UUID = UUID.randomUUID(),
) : BaseEntity() {
    fun update(
        title: String,
        content: String?,
    ) {
        this.title = title
        this.content = content
    }
}
