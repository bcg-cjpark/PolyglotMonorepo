package com.example.template.domain.user

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository,
) {
    fun findAll(): List<User> = userRepository.findAll()

    fun findById(id: Long): User =
        userRepository.findById(id).orElseThrow {
            UserNotFoundException("User not found: id=$id")
        }

    @Transactional
    fun create(
        email: String,
        name: String,
    ): User {
        if (userRepository.existsByEmail(email)) {
            throw DuplicateEmailException("Email already exists: $email")
        }
        return userRepository.save(User(email = email, name = name))
    }

    @Transactional
    fun update(
        id: Long,
        name: String,
    ): User {
        val user = findById(id)
        user.update(name)
        return user
    }

    @Transactional
    fun delete(id: Long) {
        val user = findById(id)
        userRepository.delete(user)
    }
}

class UserNotFoundException(message: String) : RuntimeException(message)

class DuplicateEmailException(message: String) : RuntimeException(message)
