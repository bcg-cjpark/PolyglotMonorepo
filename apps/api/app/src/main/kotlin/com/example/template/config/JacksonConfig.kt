package com.example.template.config

import com.fasterxml.jackson.databind.DeserializationFeature
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

/**
 * PUT 전체 교체 계약을 강제하기 위해 Creator(생성자) 파라미터 누락 시 역직렬화 실패.
 * @field:JsonProperty(required = true) 와 함께 동작.
 * PRD docs/prd/{todo,memo}.md 의 "PUT 전체 교체" 규칙 구현 보강.
 */
@Configuration
class JacksonConfig {
    @Bean
    fun jacksonCustomizer(): Jackson2ObjectMapperBuilderCustomizer =
        Jackson2ObjectMapperBuilderCustomizer { builder ->
            builder.featuresToEnable(DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES)
        }
}
