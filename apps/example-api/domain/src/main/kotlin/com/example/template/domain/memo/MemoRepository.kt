package com.example.template.domain.memo

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface MemoRepository : JpaRepository<Memo, UUID>
