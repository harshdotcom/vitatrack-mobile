# vitatrack.ai Mobile

React Native CLI app for `vitatrack.ai`.

This project is not built with Expo. Use React Native CLI commands only.

## Requirements

- Node.js 18 or newer
- npm
- Android Studio with Android SDK
- A running Android emulator or a physical Android device
- JDK required for React Native Android builds
- macOS + Xcode + CocoaPods only if you want to run iOS

Official setup guide:

```text
https://reactnative.dev/docs/set-up-your-environment
```

## Install

```bash
npm install
```

For iOS on macOS:

```bash
npm run pods
```

## Update API Endpoint

The backend base URL is defined in:

```text
src/api/endpoints.ts
```

Update the `BASE_URL` value there before running the app.

Current shape:

```ts
const BASE_URL = 'http://YOUR_HOST:8082/api/v1';
```

Use the correct host for your environment:

### Android Emulator

```ts
const BASE_URL = 'http://10.0.2.2:8082/api/v1';
```

### iOS Simulator

```ts
const BASE_URL = 'http://localhost:8082/api/v1';
```

### Physical Device

Use your computer's local network IP address:

```ts
const BASE_URL = 'http://192.168.1.22:8082/api/v1';
```

Notes:

- Keep the port and `/api/v1` suffix unchanged unless the backend contract changes.
- For a physical device, make sure the phone and backend machine are on the same network.
- If the backend host changes, update only `BASE_URL` in `src/api/endpoints.ts`.

## Run on Android

Start the emulator first.

Terminal 1:

```bash
npm start -- --reset-cache
```

Terminal 2:

```bash
adb reverse tcp:8081 tcp:8081
npm run android
```

## Run on iOS

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
npm start                  # Start Metro
npm start -- --reset-cache # Start Metro with a clean cache
npm run android            # Build and run Android
npm run ios                # Build and run iOS
npm run pods               # Install iOS pods
npm run lint               # Run ESLint
npm test                   # Run tests
npx tsc --noEmit           # Check TypeScript
```

## Project Structure

```text
index.js
  -> Registers the React Native app

App.tsx
  -> Application root
  -> Navigation setup
  -> Auth bootstrap

src/api/
  -> Axios setup
  -> API endpoint constants

src/components/
  -> Reusable UI components

src/hooks/
  -> Shared hooks

src/navigation/
  -> Route types

src/screens/
  -> Auth screens
  -> Dashboard screens

src/services/
  -> API service layer

src/store/
  -> Zustand state

src/theme/
  -> Colors, spacing, typography

src/types/
  -> Shared TypeScript types

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

### Backend is not reachable on Android emulator

Use this endpoint in `src/api/endpoints.ts`:

```ts
const BASE_URL = 'http://10.0.2.2:8082/api/v1';
```

### Metro is not running

```bash
npm start -- --reset-cache
```

### Android app is not connecting to Metro

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.vitaltrack.ai/.MainActivity
```

### Native build cache issue

```bash
cd android
gradlew clean
cd ..
npm run android
```

### Android install says insufficient storage

```bash
adb uninstall com.vitaltrack.ai
adb shell pm trim-caches 1G
```

If needed, wipe the emulator from Android Studio Device Manager.

## Notes

- Do not use Expo Go.
- Do not run `expo start`.
- Keep Metro running while using the app.
- For Android emulator, use `10.0.2.2` for a backend running on your machine.
