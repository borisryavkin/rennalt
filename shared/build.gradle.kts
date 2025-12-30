plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
    id("com.android.library")
}

kotlin {
    androidTarget()

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
            }
        }
        val androidMain by getting {
            dependencies {
                implementation("androidx.datastore:datastore-preferences:1.1.1")
            }
        }
    }
}

android {
    namespace = "com.example.qrscanner.shared"
    compileSdk = 34

    defaultConfig {
        minSdk = 24
    }
}
