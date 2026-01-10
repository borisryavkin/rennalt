# rennalt ⚡️📷

My Kotlin Multiplatform app for scanning serial numbers of evolt machines on both Android and iOS. 😄

## Name lore 🧩
I didn’t want to call it “evolt scanner” because the main product already owns that name. So I flipped “scanner” → “rennacs” and tucked “evolt” in the middle. Boom: **rennalt**. 🔤⚡️

## What it does ✨
- Live camera preview + EV serial number detection
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
4. but if you're lazy here is the link to an apk https://drive.google.com/file/d/1dz1l5Ez7qIHOzzeiWTar-2WbrgaOUiCb/view?usp=share_link

## Run it (iOS) 🍎
1. Open `iosApp/QrScannerIOS.xcodeproj` in Xcode.
2. Select a device or simulator.
3. Run the app.

## Notes & quirks 📝
- Camera permission is required to scan.
- Scan history is stored locally (Android via DataStore).

## Images
<img width="1024" height="1024" alt="Icon-iOS-Default-minus-1024x1024@1x" src="https://github.com/user-attachments/assets/5766eca7-5ed9-47a2-bc3f-a6b945a22edb" />

https://github.com/user-attachments/assets/594f2165-4c84-4c3b-971c-d2143465c588


