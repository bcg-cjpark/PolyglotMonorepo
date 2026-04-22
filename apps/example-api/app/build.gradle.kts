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
