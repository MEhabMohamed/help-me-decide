# Help Me Decide — Full Stack Authentication & Home Cooking Recommender

A production-ready full-stack web application built with **Vite + React + TypeScript** on the frontend and **NestJS + TypeScript + MongoDB** on the backend.

## Key Features

- **Complete Authentication & Session Lifecycle**:
  - **Sign Up** (`POST /api/auth/register`): Strict client-side & server-side DTO validation per specification:
    - **Email**: Valid email format.
    - **Name**: Minimum length of 3 characters.
    - **Password**: Minimum length of 8 characters, at least 1 letter (`A-Z` or `a-z`), at least 1 number (`0-9`), and at least 1 special character (`!@#$%^&*...`).
  - **Sign In** (`POST /api/auth/login`): Email & password authentication with `bcrypt` hash verification, issuing JWT Access + Refresh tokens (both in response DTO and `httpOnly` cookies).
  - **Google Sign-In** (`POST /api/auth/google`): OAuth2 integration via Google Identity Services (`initTokenClient`), verifying user identity with Google and issuing the same JWT Access + Refresh tokens and cookies as standard sign-in.
  - **3-Step Reset Password Gateway**:
    1. **Email Verification & OTP Dispatch** (`POST /api/auth/forgot-password`): Verifies the email belongs to an existing account first, generates a 6-digit OTP (`crypto.randomInt`), stores its SHA-256 hash in MongoDB (`password_resets` collection with TTL index), and emails the user an HTML message containing the OTP and a direct redirect link (`/?view=verify-otp&email=...`).
    2. **OTP Verification** (`POST /api/auth/verify-otp`): Verifies the 6-digit OTP against the stored hash and marks the reset record as verified.
    3. **New Password Update** (`POST /api/auth/reset-password`): Validates `newPassword` and `confirmPassword` against the exact same password DTO rules as Sign Up, confirms they match, hashes the new password with `bcrypt`, updates the user in MongoDB, and invalidates the OTP.
  - **Show/Hide Password Toggle**: Every password input across Sign In, Sign Up, New Password, and Confirm Password includes an accessible eye-icon visibility toggle.
  - **Protected Application Page & Logout**: Displays `"Welcome to the application."`, user profile badge, and Logout button (`POST /api/auth/logout`).
- **Help Me Decide — Home Cooking Recommender (`QuestionLoop` + `ResultCard` + `HistoryLog`)**:
  - Focused exclusively on the **Home Cooking** workflow (`I Will Cook`).
  - Interactive 5-step wizard:
    1. **Dietary Restrictions**: `Vegetarian`, `Vegan`, `Jewish Kosher` (`يهودي كوشر` — no shellfish/pork and no meat + dairy mixing), `None`, or `Other` (custom input).
    2. **Allergies**: Multi-select `Gluten`, `Seafood`, `Nuts`, `Dairy`, `None`, or `Other`.
    3. **Cuisine**: `Egyptian`, `Italian`, `Mexican`, `Chinese`, `Indian`, `American`, `Japanese`, `Mediterranean`, `Any`, or `Other`.
    4. **Group Type**: `Solo` or `Group`.
    5. **Budget & Currency Switcher (`USD` / `EGP`)**: Enter your cooking budget in either **USD (`$`)** or **EGP (`E£`)**, switchable at any time in the header or budget step.
  - Live recipes fetched from **TheMealDB API** (zero mock data), strictly filtered against Haram ingredients, boycotted brands, and all selected dietary, allergy, and budget constraints.
  - **Bilingual UI & Recipe Translator**: Instant switcher between **English (`en`, LTR)** and **Egyptian Arabic (`ar`, RTL)** with section & recipe translation.
  - **Dark / Light / System Theme**: Defaults to the operating system's preferred color scheme (`prefers-color-scheme`) with a 3-state toggle (`System` -> `Dark` -> `Light`).
  - **Responsive Mobile View**: Fluid layouts and breakpoints (`<= 768px`, `<= 480px`) for mobile and tablet screens.

---

## Project Structure

```text
help-me-decide/
├── .gitignore
├── README.md
├── AI.md
├── backend/                  # NestJS + MongoDB + TypeScript API (Port 5000)
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── pkg/              # App-independent packages: Mongo client, Nodemailer SMTP, time utils (toMs/toSec)
│   │   ├── lib/              # App infrastructure: MongoModule & MongoLifecycle, Env, Logger, AuthGuard, cookies
│   │   └── app/              # Domain modules: auth/, user/, cooking/, health/ (with Request & Response DTOs)
│   └── play/                 # Internal live DB & E2E endpoint tests (gitignored)
└── frontend/                 # Vite + React + TypeScript SPA (Port 5173)
    ├── .env.example
    ├── package.json
    └── src/
        ├── components/       # SignInPortal, ForgotPasswordFlow, QuestionLoop, ResultCard, HistoryLog
        ├── i18n/             # i18next + react-i18next configuration & JSON locale files (en.json, ar.json)
        ├── lib/              # Typed API client with automatic token refresh
        └── types/            # Frontend Request & Response DTO interfaces
```

---

## NPM Dependencies & Installation

### 1. Backend Dependencies (`backend/package.json`)

Install all backend dependencies from the `backend/` folder:

```bash
cd backend
npm install
```

Or if installing packages manually from scratch:

```bash
# Production Dependencies
npm install @nestjs/common @nestjs/core @nestjs/platform-express bcrypt class-transformer class-validator cookie-parser cors dotenv express helmet jsonwebtoken mongodb nodemailer reflect-metadata rxjs uuid zod

# Development & Type Dependencies
npm install -D @types/bcrypt @types/cookie-parser @types/cors @types/express @types/jsonwebtoken @types/node @types/nodemailer ts-node tsx typescript
```

| Package | Purpose |
| :--- | :--- |
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `express`, `reflect-metadata`, `rxjs` | Core NestJS framework, decorators, guards, DI container, and Express HTTP adapter |
| `mongodb` | Official MongoDB Node.js driver (connection pooling, ping check, idempotent index creation) |
| `bcrypt` | Password hashing and verification (`SALT_ROUNDS = 10`) |
| `jsonwebtoken` | Signing and verifying JWT Access (`ACCESS_SECRET`) and Refresh (`REFRESH_SECRET`) tokens |
| `class-validator`, `class-transformer` | Request DTO validation decorators (`@IsEmail`, `@MinLength`, `@IsPdfCompliantPassword`, etc.) and class transformation |
| `zod` | Runtime environment variable schema validation (`env.ts`) |
| `uuid` | Generating `X-Correlation-Id` request tracing UUIDs |
| `nodemailer` | Sending HTML password-reset OTP emails via Gmail SMTP |
| `helmet`, `cors`, `cookie-parser` | Security headers, Cross-Origin Resource Sharing with credentials, and `httpOnly` cookie parsing |
| `dotenv` | Loading environment variables from `.env` |
| `tsx`, `ts-node`, `typescript` | TypeScript compiler and runner for development and E2E testing |

---

### 2. Frontend Dependencies (`frontend/package.json`)

Install all frontend dependencies from the `frontend/` folder:

```bash
cd frontend
npm install
```

Or if installing packages manually from scratch:

```bash
# Production Dependencies
npm install react react-dom i18next react-i18next lucide-react

# Development & Build Dependencies
npm install -D @types/react @types/react-dom @vitejs/plugin-react typescript vite
```

| Package | Purpose |
| :--- | :--- |
| `react`, `react-dom` | Core React 19 UI library |
| `i18next`, `react-i18next` | Internationalization (`i18n`) framework for English (`en`, LTR) and Egyptian Arabic (`ar`, RTL) |
| `lucide-react` | Icons for the questionnaire tiles, password eye toggles, green checklist ticks, currency switcher, and theme controls |
| `vite`, `@vitejs/plugin-react` | Lightning-fast frontend dev server (Port `5173`) and production bundler |
| `typescript` | Static type checking across all frontend components and DTOs |

---

## How to Obtain `.env` Credentials from Related Websites

Copy `.env.example` to `.env` in both `backend/` and `frontend/`:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Below is the step-by-step guide to obtaining each credential from its official provider:

### 1. Local MongoDB Configuration (`MONGO_URI`, `MONGO_DB`)
1. Ensure a local **MongoDB Community Server** (or Docker container) is running on `mongodb://localhost:27017`:
   - **Windows / macOS / Linux Service**: Ensure your local `mongod` (`27017`) service is started.
   - **Or via Docker**:
     ```bash
     docker run -d --name mongodb -p 27017:27017 mongo:7
     ```
2. Configure `backend/.env` with your local MongoDB settings:
   ```env
   MONGO_URI=mongodb://localhost:27017
   MONGO_DB=help_me_decide
   ```
   *(The `help_me_decide` database and all required indexes are created automatically on first run.)*

---

### 2. Google OAuth 2.0 Credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VITE_GOOGLE_CLIENT_ID`)
1. Go to the [Google Cloud Console (https://console.cloud.google.com/)](https://console.cloud.google.com/) and create or select a project.
2. Navigate to **APIs & Services** -> **OAuth consent screen**:
   - Select **External** user type, fill in the App Name (`Help Me Decide`), support email, and developer contact email, then save.
   - If your app is in "Testing" mode, add your Google email under **Test users**.
3. Navigate to **APIs & Services** -> **Credentials** -> click **+ Create Credentials** -> select **OAuth client ID**:
   - Choose **Web application** as the Application type.
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:5173`
     - `http://localhost:5000`
   - Under **Authorized redirect URIs**, add:
     - `http://localhost:5173`
   - Click **Create**.
4. Copy the generated **Client ID** (`xxxx.apps.googleusercontent.com`) and **Client Secret** (`GOCSPX-...`):
   - In `backend/.env`, set:
     ```env
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
     ```
   - In `frontend/.env`, set the exact same Client ID:
     ```env
     VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     ```

---

### 3. Gmail SMTP Credentials for Password Reset OTP Emails (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`)
1. Go to your [Google Account Security Page (https://myaccount.google.com/security)](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON** for your Google account.
3. Visit the [Google App Passwords Page (https://myaccount.google.com/apppasswords)](https://myaccount.google.com/apppasswords) (or search "App passwords" in your Google Account search bar).
4. Enter an app name (e.g., `Help Me Decide Mailer`) and click **Create**.
5. Google will display a 16-character App Password. Copy it (without spaces) and configure `backend/.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your16charapppassword
   ```

---

### 4. JWT Token Secrets (`ACCESS_SECRET`, `REFRESH_SECRET`, `ACCESS_EXPIRES_IN`, `REFRESH_EXPIRES_IN`)
1. Generate two strong random 64-character hex secrets using Node.js in your terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Set them in `backend/.env`:
   ```env
   ACCESS_SECRET=your_first_generated_64_char_hex_secret
   ACCESS_EXPIRES_IN=30m
   REFRESH_SECRET=your_second_generated_64_char_hex_secret
   REFRESH_EXPIRES_IN=7d
   ```

---

## Running the Application

### 1. Start the NestJS Backend Server (Port `5000`)

```bash
cd backend
npm run dev
```

Upon startup, the backend connects to the local MongoDB server (`mongodb://localhost:27017`), verifies connectivity with a `ping`, ensures all collection indexes (`uq_users_email`, `idx_users_google_id`, `idx_password_resets_user`, `idx_password_resets_email`, `idx_password_resets_ttl`, `idx_meal_history_user_date`), and listens at `http://localhost:5000`.

### 2. Start the Vite Frontend Server (Port `5173`)

Open a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Endpoints & DTO Summary

| Method | Endpoint | Auth | Request DTO | Response DTO | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | — | `{ status, timestamp }` | Health check |
| `POST` | `/api/auth/register` | Public | `RegisterRequestDTO` | `AuthResponseDTO` | Register user (validates name >= 3, email, password strength) |
| `POST` | `/api/auth/login` | Public | `LoginRequestDTO` | `AuthResponseDTO` | Authenticate user & set auth cookies |
| `POST` | `/api/auth/google` | Public | `GoogleAuthRequestDTO` | `AuthResponseDTO` | Verify Google OAuth token & issue JWTs |
| `POST` | `/api/auth/forgot-password` | Public | `ForgotPasswordRequestDTO` | `ForgotPasswordResponseDTO` | Verify user email exists & send 6-digit OTP email with redirect link |
| `POST` | `/api/auth/verify-otp` | Public | `VerifyOtpRequestDTO` | `VerifyOtpResponseDTO` | Verify 6-digit OTP code |
| `POST` | `/api/auth/reset-password` | Public | `ResetPasswordRequestDTO` | `ResetPasswordResponseDTO` | Validate & hash new password after OTP verification |
| `POST` | `/api/auth/refresh` | Public | `RefreshTokenRequestDTO` | `RefreshTokenResponseDTO` | Rotate access & refresh tokens |
| `POST` | `/api/auth/logout` | Public | — | `LogoutResponseDTO` | Clear auth cookies & end session |
| `GET` | `/api/users/me` | Bearer / Cookie | — | `UserResponseDTO` | Get current authenticated user profile |
| `DELETE` | `/api/users/me` | Bearer / Cookie | — | `DeleteUserResponseDTO` | Delete user account & cooking history |
| `POST` | `/api/recommend` | Bearer / Cookie | `RecommendRequestDTO` | `RecommendResponseDTO` | Fetch & filter real cooking recipe matching answers & USD/EGP budget |
| `GET` | `/api/history` | Bearer / Cookie | — | `HistoryListResponseDTO` | List user's saved cooking history |
| `POST` | `/api/history` | Bearer / Cookie | `CreateHistoryRequestDTO` | `HistoryItemResponseDTO` | Save cooking recommendation to history |
| `DELETE` | `/api/history/:id` | Bearer / Cookie | — | `DeleteHistoryResponseDTO` | Delete a saved history item |
