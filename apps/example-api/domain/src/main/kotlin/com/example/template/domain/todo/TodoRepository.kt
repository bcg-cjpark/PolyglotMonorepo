package com.example.template.domain.todo

import org.springframework.data.jpa.repository.JpaRepository

interface TodoRepository : JpaRepository<Todo, Long> {
    fun findAllByCompleted(completed: Boolean): List<Todo>
}
