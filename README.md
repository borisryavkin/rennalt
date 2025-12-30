# QR Scanner KMP

Kotlin Multiplatform project with an Android QR scanner app that saves scan history.

## Modules
- `androidApp`: Android app (Compose + CameraX + ML Kit)
- `shared`: Shared Kotlin module with scan record model and Android history storage

## Run (Android)
1. Open the project in Android Studio.
2. Sync Gradle.
3. Run the `androidApp` configuration on a device or emulator with a camera.

Scan history is stored locally using Android DataStore.
