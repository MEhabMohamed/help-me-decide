# AI Usage & Engineering Report (`AI.md`)

This document details how AI assistance (Google Antigravity) was used to design, scaffold, adapt, and refine the **Help Me Decide** full-stack application, grounded in three prior reference projects (**`core-service`**, **`what-toeat-app`**, and **`analytics-service`**) and refined through iterative engineering reviews.

---

## 1. Initial Prompting & Reference-Driven Foundation

The application was built by first instructing the AI to read the assignment PDF specification, form an `implementation_plan.md` for review before writing code, and synthesize existing production patterns from three prior projects:
- **`dir\quickbite\core-service`** (Express + TypeScript authentication, security middleware, helpers, guards, error handling, time utilities, and idempotency)
- **`dir\what-toeat-app`** (Google OAuth2 sign-in flow and smart recipe recommendation questionnaire)
- **`dir\quickbite\analytics-service`** (MongoDB connection pooling and idempotent index lifecycle)

### Core Prompt Instructions Given to the AI
> *"Read the PDF for the needed instructions to build a new project, please form an implementation plan first so I can revise it. For frontend use Vite, for backend as demanded use NestJS. For the backend structure regarding the needed functionality refer to `dir\quickbite\core-service` where it has in `auth` the required login, register, and reset password functionality, also use the helper functions and authenticators, and use similar `app.use` dependencies for the related points.*
> *Form a `.env` file, `.env.example` to demonstrate the needed environmental variables, and `.gitignore` to have `node_modules`, `.env`, and other secret files ignored by git.*
> *Also refer to `dir\what-toeat-app` to implement the Google Sign-In method and add the needed credentials from the `.env` file in it, and connect the method to the same behavior regarding forming access and refresh tokens as the `core-service` project.*
> *Regarding the reset password gateway, I want it to go as follows: user clicks forgot password, it goes to a page where the user provides his email, the email gets checked to be his email first, after confirming, an OTP is sent to the email, then the email contains a redirect link where the user can add the OTP, the OTP gets verified, then he gets redirected to a page to add a new password and confirm password inputs, if matching, the password gets updated and hashed to be stored in the database, also I want the password inputs to have a show password button.*
> *Build the required request and response DTOs for every endpoint.*
> *Adjust the app sections to be applicable to mobile view.*
> *Make an internal testing folder that has testing files to test the endpoints and the app functionality and put them in `.gitignore`."*

---

## 2. Resulting Application Structure (Synthesized from the Reference Services)

After inspecting `core-service`, `analytics-service`, and `what-toeat-app`, the project was organized into a clean layered architecture separating app-independent packages (`pkg/`), application infrastructure (`lib/`), domain modules (`app/`), internal live test scripts (`play/`), and the Vite + React TypeScript SPA (`frontend/`):

```text
help-me-decide/
├── .gitignore                        # Ignores node_modules/, dist/, .env*, and play/
├── README.md                         # Setup, dependencies, local MongoDB & .env guide
├── AI.md                             # AI Usage & Engineering Report
├── play/                             # Internal live DB & E2E integration tests (gitignored)
│   ├── test-db-connection.ts
│   └── test-endpoints.ts
├── backend/                          # NestJS + TypeScript + MongoDB Backend (Port 5000)
│   ├── .env                          # Local runtime configuration (gitignored)
│   ├── .env.example                  # Documented environment variable template
│   ├── package.json
│   ├── tsconfig.json
│   ├── play/                         # Backend test runner scripts (gitignored)
│   │   ├── test-db-connection.ts
│   │   └── test-endpoints.ts
│   └── src/
│       ├── main.ts                   # NestJS bootstrap + core-service app.use middleware stack
│       ├── app.module.ts             # Root NestJS module
│       ├── pkg/                      # Strictly app-independent, reusable packages (no app/env imports)
│       │   ├── cache/
│       │   │   ├── cache.interface.ts
│       │   │   └── redis.ts          # RedisCacheProvider (ioredis) matching core-service
│       │   ├── email/
│       │   │   ├── email.interface.ts
│       │   │   └── nodemailer.ts
│       │   ├── mongo/
│       │   │   └── client.ts         # Pure MongoClient connection/ping/disconnect wrapper
│       │   └── utils/
│       │       └── times.ts          # toMs & toSec time conversion utilities
│       ├── lib/                      # Application-level infrastructure & NestJS/Express wiring
│       │   ├── auth/
│       │   │   ├── errors.ts
│       │   │   └── guard.ts          # JwtAuthGuard (Cookie + Bearer token support)
│       │   ├── cache/
│       │   │   └── init.ts           # RedisCacheProvider initialization with env.redis
│       │   ├── config/
│       │   │   └── env.ts            # Zod-validated environment configuration
│       │   ├── correlation/
│       │   │   └── correlationId.ts  # X-Correlation-Id middleware
│       │   ├── email/
│       │   │   └── init.ts           # Nodemailer SMTP initialization
│       │   ├── error/
│       │   │   ├── AppError.ts
│       │   │   └── errorHandler.filter.ts
│       │   ├── http/
│       │   │   └── response.ts       # Standardized sendSuccess & httpStatus helpers
│       │   ├── idempotency/
│       │   │   └── idempotency.ts    # Idempotency-Key HTTP middleware (using toSec.day(1))
│       │   ├── logger/
│       │   │   └── logger.ts         # Structured JSON logger
│       │   ├── mongo/
│       │   │   └── mongo.module.ts   # NestJS @Global() MongoModule, MongoLifecycle & ensureIndexes
│       │   ├── types/
│       │   │   └── express.d.ts
│       │   ├── utils/
│       │   │   └── cookie.ts         # setAuthCookies & clearAuthCookies (using toMs)
│       │   └── validation/
│       │       └── validate.ts       # class-validator DTO validation helper
│       └── app/                      # Domain Modules (Controller -> Service -> Repository -> Entity/DTO)
│           ├── auth/
│           │   ├── auth.module.ts
│           │   ├── errors.ts
│           │   ├── utils.ts          # bcrypt hashing, JWT sign/verify, 6-digit OTP & SHA-256 hash
│           │   ├── controller/auth.controller.ts
│           │   ├── dto/auth.request.dto.ts
│           │   ├── dto/auth.response.dto.ts
│           │   ├── entity/password-reset.entity.ts
│           │   ├── repository/password-reset.repo.ts
│           │   ├── service/auth.service.ts
│           │   └── templates/reset-password.template.ts
│           ├── user/
│           │   ├── user.module.ts
│           │   ├── errors.ts
│           │   ├── controller/user.controller.ts
│           │   ├── dto/user.request.dto.ts
│           │   ├── dto/user.response.dto.ts
│           │   ├── entity/user.entity.ts
│           │   ├── repository/user.repo.ts
│           │   └── service/user.service.ts
│           ├── cooking/
│           │   ├── cooking.module.ts
│           │   ├── controller/cooking.controller.ts
│           │   ├── dto/cooking.request.dto.ts
│           │   ├── dto/cooking.response.dto.ts
│           │   ├── entity/meal-history.entity.ts
│           │   ├── repository/meal-history.repo.ts
│           │   └── service/cooking.service.ts
│           └── health/
│               └── health.controller.ts
└── frontend/                         # Vite + React + TypeScript SPA (Port 5173)
    ├── .env
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx                  # Initializes i18next before mounting App
        ├── App.tsx
        ├── index.css                 # Responsive design, Dark/Light/System themes & red/green password shading
        ├── i18n/                     # i18next + react-i18next internationalization
        │   ├── i18n.ts
        │   └── locales/
        │       ├── en.json
        │       └── ar.json
        ├── lib/
        │   └── api.ts                # Typed fetch wrapper with automatic token refresh
        ├── types/
        │   └── api.dto.ts            # Frontend Request & Response DTO interfaces
        └── components/
            ├── SignInPortal.tsx      # Sign In, Sign Up, Google OAuth & live password checklist
            ├── ForgotPasswordFlow.tsx# 3-Step Reset Password Gateway (Email -> OTP -> New/Confirm Password)
            ├── QuestionLoop.tsx      # 5-Step Home Cooking Wizard with USD/EGP currency switcher
            ├── ResultCard.tsx        # Bilingual recipe card, cost estimate, ingredients & instructions
            └── HistoryLog.tsx        # Saved cooking recommendations history
```

---

## 3. Which Parts of the Code Were AI-Assisted

1. **Cross-Project Adaptation into NestJS & React TypeScript**:
   - Ported `core-service`'s authentication flows, JWT/cookie utilities, `AppError`, `correlationId`, `idempotency`, `NodemailerProvider`, and `times.ts` into a modular NestJS backend.
   - Ported `analytics-service`'s MongoDB connection pool (`pkg/mongo/client.ts`) and startup index creation (`lib/mongo/mongo.module.ts`) to Node.js/TypeScript.
   - Ported `what-toeat-app`'s Google OAuth2 login and TheMealDB cooking recommendation engine into strict TypeScript services and React components.
2. **DTOs & Validation Decorators**:
   - Generated Request and Response DTO classes (`auth.request.dto.ts`, `auth.response.dto.ts`, `user.request.dto.ts`, `user.response.dto.ts`, `cooking.request.dto.ts`, `cooking.response.dto.ts`) and shared frontend DTO interfaces (`frontend/src/types/api.dto.ts`).
3. **Responsive UI, Bilingual Translations & Live E2E Tests**:
   - Built mobile-responsive CSS (`<= 768px` and `<= 480px` breakpoints), English/Egyptian Arabic translations, and live E2E test suites (`play/test-db-connection.ts` and `play/test-endpoints.ts`).

---

## 4. Rework, Code Review Comments & Engineering Adjustments

During plan revisions and code reviews, several important engineering adjustments were directed and implemented:

1. **Unifying Password DTO Validation Across Sign Up & Reset Password (`@IsPdfCompliantPassword`)**:
   - *Initial Reference Behavior*: `core-service` validated passwords with `minSymbols: 0`.
   - *Adjustment*: Enforced the PDF specification (minimum 8 characters, at least 1 letter, at least 1 number, and at least 1 special character) via a shared `@IsPdfCompliantPassword()` decorator applied identically to both `RegisterRequestDTO` (Sign Up) and `ResetPasswordRequestDTO` (Reset Password `newPassword` and `confirmPassword`).

2. **Interactive Password Specification Checklists with Red/Green Input Shading & Green Tick Marks**:
   - *User Review Adjustment*: Requested that the password specification checklist appear on **Sign Up**, **Reset Password (`New Password`)**, and **Reset Password (`Confirm Password`)** with live visual feedback:
     - As soon as the user starts typing a password, the input field is **shaded in red** (`.input-invalid`).
     - Beside each condition line in the checklist, a **green tick mark (`✓`)** appears as soon as that specific condition is met.
     - Once all conditions are met (including password match on Confirm Password), the password input field transitions to **shaded in green** (`.input-valid`).

3. **3-Step Reset Password Gateway with Email Existence Check & Redirect Link**:
   - *Initial Reference Behavior*: `core-service` silently returned `200 OK` on unknown emails and combined OTP verification with password update in a single request.
   - *Adjustment*: Split the gateway into three explicit steps:
     1. `POST /api/auth/forgot-password`: Checks that the email exists in MongoDB first, stores a hashed 6-digit OTP, and sends an HTML email containing both the OTP and a direct redirect link (`/?view=verify-otp&email=...`).
     2. `POST /api/auth/verify-otp`: Verifies the 6-digit OTP and stamps `verified_at` in MongoDB before transitioning the UI to the New Password step.
     3. `POST /api/auth/reset-password`: Validates `newPassword` and `confirmPassword` against the PDF password rules, confirms `newPassword === confirmPassword`, hashes the password with `bcrypt`, updates the user document, and marks the OTP as consumed.

4. **Home Cooking Recommender Refinements (Jewish Kosher, USD/EGP Switcher, Theme & Arabic RTL)**:
   - *User Review Adjustments*:
     - Removed the restaurant ordering flow from `what-toeat-app` to focus exclusively on the **Home Cooking** (`I Will Cook`) workflow.
     - Corrected the mistranslated `"Koshary"` dietary option from the prototype to **Jewish Kosher** (`يهودي كوشر`), enforcing both no pork/shellfish and no mixing of meat and dairy (*Basar bechalav*) in `CookingService`.
     - Added an interactive **USD (`$`) / EGP (`E£`) currency switcher** so users can enter their budget and view estimated recipe costs in either currency.
     - Preserved **System Preferred Theme (`prefers-color-scheme`)** by default with manual Dark/Light mode toggling, alongside full **English (`en`)** and **Egyptian Arabic (`ar`, RTL)** support.

5. **Switching MongoDB from Cloud (Atlas) to Local Server (`mongodb://localhost:27017`)**:
   - *User Review Adjustment*: Switched the database configuration from MongoDB Atlas (`mongodb+srv://...`) to the local MongoDB server at `mongodb://localhost:27017`, removed the unneeded `MONGO_USER` and `MONGO_PASS` credentials from `backend/.env`, `backend/.env.example`, and `backend/src/lib/config/env.ts`, and updated all documentation (`README.md`, `AI.md`) and test scripts (`play/`).

6. **Enforcing `toSec` and `toMs` Time Utilities Across All Time Calculations**:
   - *Inline Code Review Comment on `mongo.module.ts`*:
     > *"I want all the time calculations like here to be used with toSec or to toMs from time utils depending on the amount"* (on `expireAfterSeconds: 24 * 60 * 60`).
   - *Adjustment*: Replaced all raw arithmetic time literals across the codebase with `toSec` and `toMs` from `backend/src/pkg/utils/times.ts`:
     - `expireAfterSeconds: toSec.day(1)` on the `password_resets` TTL index.
     - `connectTimeoutMS: toMs.second(10)` and `serverSelectionTimeoutMS: toMs.second(10)` in `pkg/mongo/client.ts`.
     - `ACCESS_EXPIRES_IN` (`String(toSec.hour(1))`) and `REFRESH_EXPIRES_IN` (`String(toSec.day(7))`) defaults in `lib/config/env.ts`.
     - `toMs.minute(10)` for OTP expiration in `auth.service.ts` and `play/test-endpoints.ts`.

7. **Strict `pkg/` Layer Independence (`pkg/mongo/client.ts` vs. `lib/mongo/mongo.module.ts`)**:
   - *Inline Code Review Comment on `mongo.module.ts`*:
     > *"do not use modules that export app code inside pkg, pkg should be independent where it can used on any app regardless, so this MongoLifeCycle should be transferred to lib"* (on `export class MongoLifecycle implements OnModuleInit, OnModuleDestroy`).
   - *Adjustment*: Refactored `backend/src/pkg/mongo/client.ts` into a pure, framework-agnostic connection wrapper (`MongoConnection`) with zero application, environment, logger, or NestJS dependencies so it can be dropped into any project. Transferred `MongoLifecycle`, `MongoModule`, `MONGO_CLIENT`, `MONGO_DB`, `Collections`, and `ensureIndexes()` into `backend/src/lib/mongo/mongo.module.ts`.

8. **Redis Caching for HTTP Request Idempotency (`pkg/cache/redis.ts`, `lib/cache/init.ts`, `lib/idempotency/idempotency.ts`)**:
   - *Inline Code Review Comment on `memory-cache.ts`*:
     > *"this is dummy caching using a coding Map, this shouldn't be like this, use redis for caching just like core-service, and add the adjustment to AI.md"* (on `private readonly store = new Map<string, CacheEntry>();`).
   - *Adjustment*: Deleted `memory-cache.ts` and replaced it with `RedisCacheProvider` (`backend/src/pkg/cache/redis.ts` using `ioredis`), configured via `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` in `backend/src/lib/config/env.ts` and initialized in `backend/src/lib/cache/init.ts` identically to `core-service`. `idempotency.ts` caches `2xx` responses in Redis for `toSec.day(1)`.

9. **Replacing Hardcoded Translations with `i18next` & `react-i18next`**:
   - *User Review Adjustment*:
     > *"instead of hardcode translation, I want you to use i18n library, and delete the hardcoded translation"*.
   - *Adjustment*:
     - Installed `i18next` and `react-i18next` on the frontend, created `frontend/src/i18n/i18n.ts` with structured JSON locale bundles (`frontend/src/i18n/locales/en.json` and `ar.json`), migrated all components (`App.tsx`, `SignInPortal.tsx`, `ForgotPasswordFlow.tsx`, `QuestionLoop.tsx`, `ResultCard.tsx`, `HistoryLog.tsx`) to use the `useTranslation()` hook (`t('...')` and `i18n.changeLanguage()`), and deleted `frontend/src/translations.ts` along with all inline language ternary strings.
     - Removed the hardcoded Arabic regex replacement table (`refineArabicTranslation`) from `backend/src/app/cooking/service/cooking.service.ts`.

10. **Replacing Deprecated `React.FormEvent` with `React.SubmitEvent` & `React.SyntheticEvent`**:
    - *Inline Code Review Comment on `ForgotPasswordFlow.tsx`*:
      > *"'FormEvent' is deprecated.ts(6385) ... FormEvent doesn't actually exist. You probably meant to use ChangeEvent, InputEvent, SubmitEvent, or just SyntheticEvent instead depending on the event type. check and handle in other parts using it."* (on `const handleSendOtp = async (e: React.FormEvent) => {`).
    - *Adjustment*: Replaced all occurrences of the deprecated `React.FormEvent` type across form and button handlers in `frontend/src/components/ForgotPasswordFlow.tsx` (`handleSendOtp` using `React.SyntheticEvent` as it handles both form `onSubmit` and button `onClick` for Resend OTP, and `handleVerifyOtp` / `handleResetPassword` using `React.SubmitEvent<HTMLFormElement>`) and `frontend/src/components/SignInPortal.tsx` (`handleSubmit` using `React.SubmitEvent<HTMLFormElement>`).

11. **Removing Hardcoded `.env` Fallbacks (`||`) & Never Hardcoding Credentials**:
    - *Inline Code Review Comment on `SignInPortal.tsx`*:
      > *"remove this || condition and never use hardcoded credentials used in .env, and add this to AI.md"* (on `import.meta.env.VITE_GOOGLE_CLIENT_ID || ...`).
    - *Adjustment*: Removed the `||` fallback credential from `SignInPortal.tsx` so `googleClientId` is read strictly from `import.meta.env.VITE_GOOGLE_CLIENT_ID`, and removed hardcoded `.env` fallback values in `frontend/src/lib/api.ts` and `backend/src/lib/config/env.ts` so configuration and credentials are sourced exclusively from `.env`.

12. **Removing Unused Code, Exports & Imports Across Backend and Frontend**:
    - *Inline Code Review Comment on `guard.ts`*:
      > *"where is this used?"* (on `export function authenticate(req: Request, _res: Response, next: NextFunction)`).
    - *Adjustment*:
      - Removed the unused Express `authenticate` function and its unused `NextFunction` / `Response` imports from `backend/src/lib/auth/guard.ts` (since all NestJS controllers use `@UseGuards(JwtAuthGuard)`).
      - Removed unused exports and properties across the backend: `UnAuthorisedError` in `backend/src/lib/auth/errors.ts`, `CACHE_PROVIDER` in `backend/src/lib/cache/init.ts`, unused status codes in `backend/src/lib/http/response.ts`, and the unused `private readonly` modifier on `config` in `backend/src/pkg/cache/redis.ts`.
      - Removed the unused `lang` prop and `Language` import from `frontend/src/components/QuestionLoop.tsx` (and its call site in `frontend/src/App.tsx`), as well as the unused `GoogleAuthRequestDTO` interface in `frontend/src/types/api.dto.ts`.
      - Enabled `"noUnusedLocals": true` and `"noUnusedParameters": true` in both `backend/tsconfig.json` and `frontend/tsconfig.json` to prevent unused code or imports at compile time.
