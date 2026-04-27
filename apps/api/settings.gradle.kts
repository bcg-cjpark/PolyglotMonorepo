plugins {
    // JDK 21 자동 다운로드 프로비저닝 (로컬에 JDK 21이 없어도 Gradle이 foojay에서 받아옴)
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}

rootProject.name = "api"

include(
    "domain",
    "security",
    "app",
)
