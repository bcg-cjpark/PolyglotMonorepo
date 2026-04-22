plugins {
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.springdoc.openapi)
}

dependencies {
    implementation(project(":domain"))
    implementation(project(":security"))

    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.jackson.kotlin)

    implementation(libs.springdoc.openapi.starter)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.spring.security.test)
    testImplementation(libs.kotest.extensions.spring)
    testImplementation(libs.springmockk)
    testImplementation(testFixtures(project(":domain")))
}

openApi {
    apiDocsUrl.set("http://localhost:8080/v3/api-docs")
    outputDir.set(file("$buildDir"))
    outputFileName.set("openapi.json")
}

// Gradle daemon 은 client 의 사용자 정의 환경변수를 자식 JVM 에 자동 상속하지 않는다.
// `dev` 프로필이 참조하는 환경변수들을 providers.environmentVariable 경유로 명시 전달.
// (근거: docs/tech-stack/backend.md §2.4)
tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    listOf(
        "SPRING_PROFILES_ACTIVE",
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
        "JWT_SECRET",
        "API_PORT",
    ).forEach { name ->
        providers.environmentVariable(name).orNull?.let { value ->
            environment(name, value)
        }
    }
}
