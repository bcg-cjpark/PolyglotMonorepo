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
                    .requestMatchers("/users/**").permitAll()
                    .requestMatchers("/todos/**").permitAll()
                    .requestMatchers("/api/memos/**").permitAll()
                    .anyRequest().authenticated()
            }
            .build()
}
