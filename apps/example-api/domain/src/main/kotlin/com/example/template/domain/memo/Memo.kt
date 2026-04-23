package com.example.template.domain.memo

import com.example.template.domain.common.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.util.UUID

@Entity
@Table(name = "memos")
class Memo(
    @Column(nullable = false, length = 100)
    var title: String,
    @Column(nullable = true, length = 5000)
    var content: String?,
) : BaseEntity() {
    // MySQL 에서 CHAR(36) 로 저장하기 위한 명시적 매핑.
    // Hibernate 가 기본으로 BINARY(16) 으로 저장하는 것을 막는다 (docs/tech-stack/backend.md §2.1).
    @Id
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(columnDefinition = "CHAR(36)", nullable = false, updatable = false, length = 36)
    var id: UUID = UUID.randomUUID()

    fun update(
        title: String,
        content: String?,
    ) {
        this.title = title
        this.content = content
    }
}
