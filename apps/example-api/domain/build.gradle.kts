plugins {
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.kotlin.jpa)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    `java-test-fixtures`
}

tasks.getByName<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    enabled = false
}

tasks.getByName<Jar>("jar") {
    enabled = true
}

dependencies {
    api(libs.spring.boot.starter.data.jpa)

    runtimeOnly(libs.postgresql)
    runtimeOnly(libs.h2)

    implementation(libs.flyway.core)
    implementation(libs.flyway.postgresql)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.kotest.extensions.spring)
    testImplementation(libs.fixture.monkey.starter)
    testImplementation(libs.fixture.monkey.kotlin)

    testFixturesImplementation(libs.fixture.monkey.starter)
    testFixturesImplementation(libs.fixture.monkey.kotlin)
    testFixturesImplementation(libs.spring.boot.starter.data.jpa)
}
