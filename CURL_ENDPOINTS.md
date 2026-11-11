# Help Me Decide — Postman cURL Endpoints Reference

You can import any of these `cURL` commands directly into **Postman** via **Import -> Paste Raw Text**.

> **Base URL**: `http://localhost:5000/api`
> **Note**: Replace `<ACCESS_TOKEN>`, `<REFRESH_TOKEN>`, and `<HISTORY_ID>` with the values returned from the Sign Up / Login / History responses.

---

## 1. Health Check

### `GET /api/health`
```bash
curl --location --request GET 'http://localhost:5000/api/health'
```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 Sign Up — `POST /api/auth/register`
Creates a new user account (Name >= 3 chars, valid Email, Password >= 8 chars with at least 1 letter, 1 number, and 1 special character) and returns `accessToken`, `refreshToken`, and `user`.

```bash
curl --location --request POST 'http://localhost:5000/api/auth/register' \
--header 'Content-Type: application/json' \
--header 'Idempotency-Key: register-req-001' \
--data-raw '{
  "name": "Ahmed Mohamed",
  "email": "ahmed.mohamed@example.com",
  "password": "StrongPassword@123"
}'
```

---

### 2.2 Sign In — `POST /api/auth/login`
Authenticates an existing user and issues `accessToken` and `refreshToken` (both in the JSON response and as `httpOnly` cookies).

```bash
curl --location --request POST 'http://localhost:5000/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "ahmed.mohamed@example.com",
  "password": "StrongPassword@123"
}'
```

---

### 2.3 Google OAuth2 Sign-In — `POST /api/auth/google`
Authenticates or registers a user using a Google OAuth2 `accessToken` (or `idToken`) and issues the application's `accessToken` and `refreshToken`.

```bash
curl --location --request POST 'http://localhost:5000/api/auth/google' \
--header 'Content-Type: application/json' \
--data-raw '{
  "accessToken": "ya29.a0AfH6SMBx_your_google_oauth_access_token"
}'
```

---

### 2.4 Forgot Password (Step 1: Verify Email & Send 6-Digit OTP) — `POST /api/auth/forgot-password`
Verifies that the email belongs to an existing user, stores a hashed 6-digit OTP in MongoDB, and sends an email with the OTP and redirect link (`/auth/verify-otp?email=...`).
*(Requires `Idempotency-Key` header — strict idempotency enforced via Redis).*

```bash
curl --location --request POST 'http://localhost:5000/api/auth/forgot-password' \
--header 'Content-Type: application/json' \
--header 'Idempotency-Key: forgot-pwd-req-001' \
--data-raw '{
  "email": "ahmed.mohamed@example.com"
}'
```

---

### 2.5 Verify OTP (Step 2: Verify 6-Digit OTP) — `POST /api/auth/verify-otp`
Verifies the 6-digit OTP sent to the user's email and marks the reset record as verified.

```bash
curl --location --request POST 'http://localhost:5000/api/auth/verify-otp' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "ahmed.mohamed@example.com",
  "otp": "123456"
}'
```

---

### 2.6 Reset Password (Step 3: Set & Hash New Password) — `POST /api/auth/reset-password`
Validates `newPassword` and `confirmPassword` against the password policy, confirms they match, hashes the new password with `bcrypt`, and updates the user in MongoDB.

```bash
curl --location --request POST 'http://localhost:5000/api/auth/reset-password' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "ahmed.mohamed@example.com",
  "otp": "123456",
  "newPassword": "NewStrongPassword@456",
  "confirmPassword": "NewStrongPassword@456"
}'
```

---

### 2.7 Refresh Access Token — `POST /api/auth/refresh`
Issues a new `accessToken` using a valid `refreshToken`.

```bash
curl --location --request POST 'http://localhost:5000/api/auth/refresh' \
--header 'Content-Type: application/json' \
--data-raw '{
  "refreshToken": "<REFRESH_TOKEN>"
}'
```

---

### 2.8 Current Authenticated User (via Auth Route) — `GET /api/auth/me`
Returns the authenticated user's profile.

```bash
curl --location --request GET 'http://localhost:5000/api/auth/me' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

### 2.9 Logout — `POST /api/auth/logout`
Clears `access_token` and `refresh_token` cookies and ends the session.

```bash
curl --location --request POST 'http://localhost:5000/api/auth/logout' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

## 3. User Profile Endpoints (`/api/users`)

### 3.1 Get Current User Profile — `GET /api/users/me`
```bash
curl --location --request GET 'http://localhost:5000/api/users/me' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

### 3.2 Update User Profile — `PATCH /api/users/me`
```bash
curl --location --request PATCH 'http://localhost:5000/api/users/me' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <ACCESS_TOKEN>' \
--header 'Idempotency-Key: update-profile-001' \
--data-raw '{
  "name": "Ahmed M. Updated",
  "avatarUrl": "https://example.com/avatar.png"
}'
```

---

### 3.3 Delete User Account — `DELETE /api/users/me`
Deletes the authenticated user's account and clears auth cookies.

```bash
curl --location --request DELETE 'http://localhost:5000/api/users/me' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

## 4. Home Cooking Recommendation & History Endpoints (`/api/recommend`, `/api/history`)

### 4.1 Get Cooking Recommendation (USD Budget) — `POST /api/recommend`
Fetches a real recipe from TheMealDB matching dietary restrictions (`Vegetarian`, `Vegan`, `Jewish Kosher`, `None`, or custom), allergies, cuisine, group type (`solo` / `group`), and USD budget, returning both English (`en`) and gender-inclusive Arabic (`ar` with `ضع/ضعي` style instructions).

```bash
curl --location --request POST 'http://localhost:5000/api/recommend' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <ACCESS_TOKEN>' \
--data-raw '{
  "dietaryRestrictions": "Jewish Kosher",
  "allergies": "Seafood",
  "cuisine": "Mediterranean",
  "groupType": "solo",
  "budget": "25 USD",
  "currency": "USD",
  "lang": "ar",
  "seenIds": []
}'
```

---

### 4.2 Get Cooking Recommendation (EGP Budget) — `POST /api/recommend`
```bash
curl --location --request POST 'http://localhost:5000/api/recommend' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <ACCESS_TOKEN>' \
--data-raw '{
  "dietaryRestrictions": "None",
  "allergies": "None",
  "cuisine": "Egyptian",
  "groupType": "group",
  "budget": "250 EGP",
  "currency": "EGP",
  "lang": "ar",
  "seenIds": []
}'
```

---

### 4.3 Save Recipe Recommendation to History — `POST /api/history`
Saves a recipe recommendation to the user's history in MongoDB (`meal_history`). Sending the same `Idempotency-Key` deduplicates repeated requests via Redis.

```bash
curl --location --request POST 'http://localhost:5000/api/history' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <ACCESS_TOKEN>' \
--header 'Idempotency-Key: save-history-52772-25USD' \
--data-raw '{
  "dietaryRestrictions": "None",
  "allergies": "None",
  "cuisine": "Italian",
  "groupType": "solo",
  "budget": "20 USD",
  "recommendationName": "Spaghetti Carbonara",
  "recommendationDetails": {
    "type": "cooking",
    "recipe": {
      "en": {
        "id": "52772",
        "name": "Spaghetti Carbonara",
        "category": "Pasta",
        "area": "Italian",
        "instructions": "Boil pasta. Mix eggs and cheese.",
        "image": "https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg",
        "youtube": "",
        "ingredients": ["Spaghetti", "Eggs", "Parmesan"],
        "measurements": ["200g", "2", "50g"],
        "estimatedCost": "10 USD",
        "estimatedCostUsd": "10 USD",
        "estimatedCostEgp": "95 EGP"
      },
      "ar": {
        "id": "52772",
        "name": "سباجيتي كاربونارا",
        "category": "مكرونة",
        "area": "إيطالي",
        "instructions": "اسلق/اسلقي المكرونة. اخلط/اخلطي البيض والجبن.",
        "image": "https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg",
        "youtube": "",
        "ingredients": ["سباجيتي", "بيض", "بارميزان"],
        "measurements": ["200 جرام", "2", "50 جرام"],
        "estimatedCost": "10 USD",
        "estimatedCostUsd": "10 USD",
        "estimatedCostEgp": "95 EGP"
      }
    }
  }
}'
```

---

### 4.4 List Saved Cooking History — `GET /api/history`
```bash
curl --location --request GET 'http://localhost:5000/api/history' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

### 4.5 Delete Saved History Item — `DELETE /api/history/:id`
```bash
curl --location --request DELETE 'http://localhost:5000/api/history/<HISTORY_ID>' \
--header 'Authorization: Bearer <ACCESS_TOKEN>'
```

