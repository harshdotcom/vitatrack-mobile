# vitatrack.ai Mobile App

This is the React Native mobile application for vitatrack.ai, built using Expo.

## Technologies Used

- **Framework**: React Native with Expo (SDK 52)
- **Routing**: Expo Router
- **State Management**: Zustand
- **API Client**: Axios
- **Forms & Validation**: React Hook Form + Zod
- **Animations**: Reanimated & Moti

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- `npm` (comes with Node.js)
- For testing on a physical device, download the **Expo Go** app on your iOS or Android device.

## Getting Started

1. **Install dependencies**
   Make sure you are in the `mobile` directory, then run:
   ```bash
   npm install
   ```

2. **Configure the backend URL** (see [Backend Configuration](#backend-configuration) below)

3. **Start the development server**
   ```bash
   npx expo start --clear
   ```
   This will display a QR code in the terminal.

## How to Run the App

Once the development server is running, you have a few options:

- **Physical device**: Open Expo Go and scan the QR code. Your device and computer must be on the **same Wi-Fi network**.
- **Android Emulator**: Press `a` in the terminal (requires Android Studio).
- **iOS Simulator**: Press `i` in the terminal (requires macOS and Xcode).
- **Web Browser**: Press `w` in the terminal.

---

## Backend Configuration

All API settings live in one file:

```
src/api/endpoints.ts
```

### Changing the Backend Port

Open `src/api/endpoints.ts` and update the `BASE_URL`:

```ts
// Android Emulator (localhost on your machine maps to 10.0.2.2)
BASE_URL: 'http://10.0.2.2:8082/api/v1',

// Physical device — replace with your machine's local IP and port
// BASE_URL: 'http://192.168.1.100:8082/api/v1',

// Production
// BASE_URL: 'https://vitatrack-ai.onrender.com/api/v1',
```

> **Tip — finding your local IP:**
> - **Windows**: run `ipconfig` → look for IPv4 Address
> - **Mac/Linux**: run `ifconfig` → look for `inet` under your Wi-Fi adapter

| Scenario | URL to use |
|---|---|
| Android Emulator | `http://10.0.2.2:<port>/api/v1` |
| iOS Simulator | `http://localhost:<port>/api/v1` |
| Physical device (same Wi-Fi) | `http://<your-machine-ip>:<port>/api/v1` |
| Production | `https://vitatrack-ai.onrender.com/api/v1` |

After changing the URL, restart the bundler with `--clear`:
```bash
npx expo start --clear
```

---

## API Endpoints Reference

Base URL: `http://10.0.2.2:8082/api/v1` *(default for Android Emulator)*

### Authentication — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/login` | Login with email & password |
| POST | `/users/signup` | Register a new account |
| POST | `/users/verify-otp` | Verify OTP after signup |
| POST | `/users/resend-otp` | Resend OTP |
| POST | `/users/forgot-password` | Request password reset |
| POST | `/users/reset-password` | Set new password |
| POST | `/users/google` | Login / signup via Google |

### User Details — Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user-details/usage` | Get usage stats |
| GET | `/user-details/ai-credits` | Get remaining AI credits |
| POST | `/user-details/update` | Update user profile |

### Files — Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/files/upload` | Upload a file |
| GET | `/files/{id}` | Get file by ID |
| GET | `/files/ocr/{id}` | Get OCR text for a file |
| GET | `/files/ai/{id}` | Get AI analysis for a file |

### Documents — Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List all documents |
| POST | `/documents` | Create a document |
| GET | `/documents/calendar` | Get documents by date |
| GET | `/documents/{id}` | Get document by ID |
| POST | `/documents/update/{id}` | Update a document |
| DELETE | `/documents/{id}` | Delete a document |

### Health Metrics — Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/health-metric/save` | Save a health metric |
| GET | `/health-metric/{id}` | Get health metric by ID |

> **Authentication**: Protected routes expect an `Authorization: Bearer <token>` header. The app handles this automatically via an Axios request interceptor — the token is stored securely using `expo-secure-store`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `project is incompatible with this version of Expo Go` | Make sure `expo` is pinned to `~52.0.46` in `package.json` |
| `TurboModuleRegistry / PlatformConstants` error | Ensure `"newArchEnabled": false` is set in `app.json` |
| `expo-asset cannot be found` | Run `npm install` — `expo-asset` must be present |
| Bundler cache stale after config changes | Run `npx expo start --clear` |
| API calls fail on physical device | Use your machine's local IP, not `10.0.2.2` or `localhost` |
| API calls fail on Android Emulator | Use `10.0.2.2` instead of `localhost` |
