package com.example.template.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain

@Configuration
class SecurityConfig {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it
                    .requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/health").permitAll()
                    .requestMatchers("/error").permitAll()
                    // 피처별 엔드포인트는 각 피처의 백엔드팀 구현 시점에 여기 추가.
                    // 예: .requestMatchers("/users/**").permitAll()
                    .anyRequest().authenticated()
            }
            .build()
}
