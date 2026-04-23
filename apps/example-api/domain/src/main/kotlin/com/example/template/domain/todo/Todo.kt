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
    @Column(nullable = false)
    var completed: Boolean = false,
    @Column(name = "due_date", nullable = true)
    var dueDate: LocalDate? = null,
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0

    fun update(
        title: String,
        completed: Boolean,
        dueDate: LocalDate?,
    ) {
        this.title = title
        this.completed = completed
        this.dueDate = dueDate
    }

    fun toggle() {
        this.completed = !this.completed
    }
}
