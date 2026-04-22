# vitatrack.ai Mobile

React Native CLI app for vitatrack.ai.

This is **not an Expo project**. Use React Native CLI commands only.

## Requirements

Install these first:

- Node.js 18 or newer
- npm
- Android Studio
- Android SDK
- Android emulator or Android phone
- JDK for React Native Android builds
- macOS + Xcode + CocoaPods only if you want to run iOS

React Native setup guide:

```text
https://reactnative.dev/docs/set-up-your-environment
```

## Install

From the project folder:

```bash
npm install
```

For iOS on macOS:

```bash
npm run pods
```

## API Setup

API base URL is here:

```text
src/api/endpoints.ts
```

For Android emulator, use:

```ts
const BASE_URL = 'http://10.0.2.2:8082/api/v1';
```

For iOS simulator, use:

```ts
const BASE_URL = 'http://localhost:8082/api/v1';
```

For a real phone, use your computer IP:

```ts
const BASE_URL = 'http://YOUR_LOCAL_IP:8082/api/v1';
```

Example:

```ts
const BASE_URL = 'http://192.168.1.22:8082/api/v1';
```

## Start Android

Open Android emulator first.

Terminal 1:

```bash
npm start -- --reset-cache
```

Keep this terminal open.

Terminal 2:

```bash
adb reverse tcp:8081 tcp:8081
npm run android
```

## Start iOS

iOS works only on macOS.

```bash
npm run pods
npm start -- --reset-cache
```

In another terminal:

```bash
npm run ios
```

## Useful Commands

```bash
npm start                 # Start Metro
npm start -- --reset-cache # Start Metro with clean cache
npm run android           # Build and run Android
npm run ios               # Build and run iOS
npm run pods              # Install iOS pods
npm run lint              # Run lint
npm test                  # Run tests
npx tsc --noEmit          # Check TypeScript
```

## Architecture

```text
index.js
  -> Registers the React Native app

App.tsx
  -> Main app root
  -> Sets up React Navigation
  -> Loads saved auth state

src/navigation/
  -> Route types

src/screens/
  -> App screens
  -> Auth screens
  -> Dashboard screens

src/components/
  -> Reusable UI components

src/hooks/
  -> Shared React hooks

src/store/
  -> Zustand state store

src/services/
  -> API service functions

src/api/
  -> Axios setup
  -> API endpoint constants

src/theme/
  -> Colors, spacing, typography

src/types/
  -> TypeScript app types

android/
  -> Native Android project

ios/
  -> Native iOS project
```

## Main Libraries

- React Native CLI
- React Navigation
- Zustand
- Axios
- React Hook Form
- Zod
- Reanimated
- Moti
- AsyncStorage
- React Native Image Picker
- React Native Linear Gradient
- React Native Vector Icons

## Common Fixes

### App is blank on Android

Metro is usually not running.

Run:

```bash
npm start -- --reset-cache
```

Then:

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.vitaltrack.ai/.MainActivity
```

### Android install says insufficient storage

Free emulator storage:

```bash
adb uninstall com.vitaltrack.ai
adb shell pm trim-caches 1G
```

If it still fails, open Android Studio Device Manager and use **Wipe Data**.

### Android cannot call backend

Use this URL in `src/api/endpoints.ts`:

```ts
const BASE_URL = 'http://10.0.2.2:8082/api/v1';
```

### Metro port issue

If port `8081` is stuck, stop old Node/Metro processes and run:

```bash
npm start -- --reset-cache
```

### Native build cache issue

Clean Android:

```bash
cd android
gradlew clean
cd ..
npm run android
```

## Notes

- Do not use Expo Go.
- Do not run `expo start`.
- Keep Metro running while using the app.
- For Android emulator, always use `10.0.2.2` for your local backend.
