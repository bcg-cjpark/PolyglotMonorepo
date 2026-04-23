package com.example.template.config

import org.springframework.http.HttpStatus
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice

/**
 * JSON 역직렬화 실패 (FAIL_ON_MISSING_CREATOR_PROPERTIES 포함) 를 400 으로 통일.
 * 각 Controller 의 @ExceptionHandler 와 응답 포맷 ({message}) 을 일치시킨다.
 */
@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(HttpMessageNotReadableException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleMessageNotReadable(e: HttpMessageNotReadableException): Map<String, String> {
        return mapOf("message" to "요청 payload 가 올바르지 않습니다.")
    }
}
