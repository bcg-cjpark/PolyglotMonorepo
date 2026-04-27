import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring) apply false
    alias(libs.plugins.kotlin.jpa) apply false
    alias(libs.plugins.spring.boot) apply false
    alias(libs.plugins.spring.dependency.management) apply false
    alias(libs.plugins.ktlint)
}

val javaVersion = JavaVersion.VERSION_21

allprojects {
    group = "com.example.template"
    version = "2.0.0"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jlleitschuh.gradle.ktlint")

    java {
        sourceCompatibility = javaVersion
        targetCompatibility = javaVersion
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(21))
        }
    }

    tasks.withType<KotlinCompile> {
        kotlinOptions {
            freeCompilerArgs += "-Xjsr305=strict"
            jvmTarget = javaVersion.toString()
        }
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }

    dependencies {
        val libs = rootProject.libs
        implementation(libs.kotlin.reflect)

        testImplementation(libs.kotest.runner)
        testImplementation(libs.kotest.assertions)
        testImplementation(libs.mockk)
    }
}

// Type-safe accessor for version catalog in subprojects
val Project.libs: org.gradle.accessors.dm.LibrariesForLibs
    get() = the()
