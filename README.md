# rennalt ⚡️📷

My Kotlin Multiplatform playground for scanning QR codes and keeping a local scan diary on both Android and iOS. Fast, tiny, and a little nerdy. 😄

## Name lore 🧩
I didn’t want to call it “evolt scanner” because the main product already owns that name. So I flipped “scanner” → “rennacs” and tucked “evolt” in the middle. Boom: **rennalt**. A tiny word puzzle, a tiny rebellion. 🔤⚡️

## What it does ✨
- Live camera preview + QR detection
- Local scan history with timestamps
- One-tap “clear history” when I need a clean slate 🧼

## Built with 🔧
- Kotlin Multiplatform (shared models + storage)
- Android: Jetpack Compose, CameraX, ML Kit
- iOS: SwiftUI, AVFoundation
- Android storage: DataStore

## Project map 🗺️
- `androidApp`: Android UI + camera pipeline
- `iosApp`: iOS UI + camera pipeline
- `shared`: Shared Kotlin module for records + storage helpers

## What you need 🧰
- Android Studio Iguana+
- Xcode 15+
- A device or emulator/simulator with a camera

## Run it (Android) 🤖
1. Open the project in Android Studio.
2. Sync Gradle.
3. Run the `androidApp` configuration on a device or emulator with a camera.

## Run it (iOS) 🍎
1. Open `iosApp/QrScannerIOS.xcodeproj` in Xcode.
2. Select a device or simulator.
3. Run the app.

## Notes & quirks 📝
- Camera permission is required to scan.
- Scan history is stored locally (Android via DataStore).
