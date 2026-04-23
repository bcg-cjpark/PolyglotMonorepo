package com.example.template.domain.todo

import org.springframework.data.jpa.repository.JpaRepository

interface TodoRepository : JpaRepository<Todo, Long> {
    fun findAllByOrderByCreatedAtDesc(): List<Todo>

    fun findAllByCompletedFalseOrderByCreatedAtDesc(): List<Todo>

    fun findAllByCompletedTrueOrderByCreatedAtDesc(): List<Todo>
}
