# AI Usage & Engineering Report (`AI.md`)

This document details how AI assistance (Google Antigravity) was used as a force multiplier in designing, scaffolding, adapting, and verifying the **Help Me Decide** full-stack application, in accordance with the **AI Usage Policy & Guidelines**.

---

## 1. Which Parts of the Code Were AI-Assisted

1. **Architecture Synthesis & Cross-Repository Adaptation**:
   - **Authentication & Middleware (`backend/src/app/auth`, `backend/src/lib`)**: Adapted from our existing Express/TypeScript reference project (`quickbite/core-service`) into a modular **NestJS** architecture while preserving its security primitives (`helmet`, `cors`, `cookie-parser`, `correlationId`, `AppError`, structured `Logger`, `bcrypt` password hashing, `jsonwebtoken` dual access/refresh tokens, HTTP-only cookies, and `NodemailerProvider`).
   - **MongoDB Connection Pool & Index Lifecycle (`backend/src/pkg/mongo/mongo.module.ts`)**: Adapted from our Go microservice reference (`quickbite/analytics-service/pkg/mongo/client.go` and `repository/indexes.go`) into a NestJS `@Global()` module configured for the local MongoDB server (`mongodb://localhost:27017`), with startup `ping` verification and idempotent `ensureIndexes()` execution on boot.
   - **Smart Cooking Recommender & Google OAuth (`backend/src/app/cooking`, `frontend/src/components`)**: Ported from our JavaScript prototype (`what-toeat-app`) into strict **TypeScript** with NestJS controllers/services and React TSX components, isolating the **Home Cooking** flow and removing the restaurant ordering flow.

2. **Boilerplate, DTOs & Validation Logic**:
   - Generated strict Request and Response DTO classes (`auth.request.dto.ts`, `auth.response.dto.ts`, `user.request.dto.ts`, `user.response.dto.ts`, `cooking.request.dto.ts`, `cooking.response.dto.ts`) and shared frontend TypeScript interfaces (`frontend/src/types/api.dto.ts`).
   - Created a shared custom `class-validator` decorator `@IsPdfCompliantPassword()` enforcing the exact PDF password specification (minimum 8 characters, at least 1 letter, at least 1 number, and at least 1 special character) across both Sign Up and Reset Password flows.

3. **Frontend UI, Theme System & Localization**:
   - Built responsive glassmorphism components in `frontend/src/index.css` supporting **System Preferred Theme (`prefers-color-scheme`)** by default alongside manual Dark/Light mode toggling, full **English and Egyptian Arabic (RTL)** translation dictionaries (`translations.ts`), and Show/Hide password toggle buttons.

4. **Live Integration Test Suite (`play/`)**:
   - Created end-to-end verification scripts (`play/test-db-connection.ts` and `play/test-endpoints.ts`) testing real local MongoDB (`mongodb://localhost:27017`) operations and live API endpoints without mock data.

---

## 2. What Prompts & Approaches Were Effective

- **Reference-Grounded Prompting**: Pointing the AI directly to concrete reference implementations (`core-service` for auth/middleware/helpers, `analytics-service` for MongoDB connection pooling and index management, and `what-toeat-app` for Google Sign-In and recipe recommendation logic) eliminated guesswork and ensured consistent engineering patterns across the stack.
- **Plan-First Iteration**: Requesting an `implementation_plan.md` artifact before code generation allowed rapid review and targeted course corrections (such as unifying the password DTO rules, replacing Koshary with Jewish Kosher dietary validation, switching budget calculations to USD, and maintaining system-preferred Dark/Light mode alongside Egyptian Arabic translations).
- **Explicit State-Machine Specification for Password Reset**: Defining the exact 3-step Reset Password Gateway (1: Verify email exists & send OTP + redirect link -> 2: Verify OTP via redirect page -> 3: Set & confirm new password with Show/Hide toggle) resulted in clean separation between `POST /api/auth/forgot-password`, `POST /api/auth/verify-otp`, and `POST /api/auth/reset-password`.

---

## 3. What Needed Rework, Correction, or Engineering Judgement

1. **Password Validation Rules (`core-service` vs. PDF Specification)**:
   - *Initial Reference Behavior*: `core-service` required uppercase + lowercase + number with `minSymbols: 0`.
   - *Adjustment*: The PDF task specification requires minimum 8 characters, at least one letter, at least one number, and **at least one special character**. We replaced the reference validator with a dedicated `@IsPdfCompliantPassword()` validator (`/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/`) and applied it identically to both `RegisterRequestDTO` and `ResetPasswordRequestDTO`, paired with a live interactive checklist on the frontend.

2. **3-Stage OTP Verification State in MongoDB**:
   - *Initial Reference Behavior*: `core-service` combined OTP check and password update into a single `/reset-password` step and silently returned `200` on unknown emails.
   - *Adjustment*: To support the multi-page Reset Password Gateway where the user first verifies their email exists, clicks a redirect link in their email to verify the OTP on a dedicated screen, and then transitions to the New/Confirm Password screen, we added a `verified_at` timestamp field on `password_resets` documents and a dedicated `POST /api/auth/verify-otp` endpoint, and enforced that `reset-password` checks both `verified_at` and `newPassword === confirmPassword`.

3. **Strict Dietary Filtering for Jewish Kosher & Custom Restrictions**:
   - *Initial Prototype Behavior*: `what-toeat-app` had a mistranslated label ("Koshary" instead of "Jewish Kosher") and only checked a basic list of non-kosher meats.
   - *Adjustment*: We updated the option to **Jewish Kosher** (`يهودي كوشر`) and enhanced `CookingService.getRecipeDetailsAndVerify` to enforce both Kosher prohibition of pork/shellfish AND the Kosher prohibition against mixing meat/poultry and dairy in the same recipe (*Basar bechalav*, while allowing pareve ingredients like coconut milk), as well as converting all budget filtering and cost estimates to **USD (`$`)**.

4. **Dual Cookie + Bearer Token Compatibility**:
   - *Adjustment*: While `core-service` relied solely on `req.cookies.access_token`, SPA frontends and automated API clients often pass `Authorization: Bearer <token>`. We engineered `JwtAuthGuard` (`backend/src/lib/auth/guard.ts`) to accept either the HTTP-only `access_token` cookie or the `Bearer` header, and built `frontend/src/lib/api.ts` to send `credentials: 'include'` and automatically refresh expired access tokens via `/api/auth/refresh`.

