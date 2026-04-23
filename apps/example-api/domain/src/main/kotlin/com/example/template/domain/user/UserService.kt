package com.example.template.domain.user

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository,
) {
    fun findAll(): List<User> = userRepository.findAllByOrderByCreatedAtDesc()

    fun findById(id: Long): User =
        userRepository.findById(id).orElseThrow {
            UserNotFoundException(id)
        }

    @Transactional
    fun create(
        email: String,
        name: String,
    ): User {
        if (userRepository.existsByEmail(email)) {
            throw UserEmailDuplicatedException(email)
        }
        return userRepository.save(User(email = email, name = name))
    }

    @Transactional
    fun update(
        id: Long,
        email: String,
        name: String,
    ): User {
        val user = findById(id)
        if (user.email != email && userRepository.existsByEmailAndIdNot(email, id)) {
            throw UserEmailDuplicatedException(email)
        }
        user.update(email = email, name = name)
        return user
    }

    @Transactional
    fun delete(id: Long) {
        val user = findById(id)
        userRepository.delete(user)
    }
}

class UserNotFoundException(id: Long) : RuntimeException("User not found: id=$id")

class UserEmailDuplicatedException(email: String) : RuntimeException("Email already exists: $email")
