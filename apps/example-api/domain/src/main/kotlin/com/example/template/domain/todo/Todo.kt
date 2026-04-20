package com.example.template.domain.todo

import com.example.template.domain.common.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDate

@Entity
@Table(name = "todos")
class Todo(
    @Column(nullable = false, length = 200)
    var title: String,
    @Column(nullable = true, length = 2000)
    var description: String? = null,
    @Column(nullable = false)
    var completed: Boolean = false,
    @Column(name = "due_date", nullable = true)
    var dueDate: LocalDate? = null,
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0

    fun update(
        title: String? = null,
        description: String? = null,
        dueDate: LocalDate? = null,
    ) {
        if (title != null) this.title = title
        if (description != null) this.description = description
        if (dueDate != null) this.dueDate = dueDate
    }

    fun toggle() {
        this.completed = !this.completed
    }
}
