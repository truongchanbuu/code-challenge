# Online Classroom Management

A web app to manage classes, students, instructors, lessons, and notifications. Built with **React + Vite + Tailwind (DaisyUI)** on the frontend and **Node.js (Express) + Firebase Admin/Firestore** on the backend. Uses **JWT** auth (OTP flow optional), **Zod** for validation, **TanStack Query** for data fetching, and **Socket.IO** for realtime updates.

> This README is a starter tailored to your current codebase and discussions. Tweak any placeholder (🔧) to match your repo exactly.

---

## ✨ Features

- Instructor & Student roles; profile management (username, email, phone, role)
- Secure auth: JWT (access/refresh), optional email/SMS OTP verification
- Student list for instructors with **search, sort, pagination, cursor** support
- Realtime status/notifications with **Socket.IO**
- UI built with **Vite + React + Tailwind + DaisyUI**, minimal, keyboard‑friendly
- Robust validation via **Zod** (shared types and DTOs)
- Firestore data model optimized for prefix search and pagination

---

## 🗂 Repository Structure (suggested)

> Adjust to your actual folders.

```
.
├─ frontend/
│  └─ web/
├─ backend/
│  └─ api/                 # Node.js (Express) + Firebase Admin + Firestore
├─ docs/
    └─ README.md
    └─ screenshots/ # screenshots
```

If you use a simpler layout:

```
frontend/   # React app
backend/   # Express API
```

---

## 🔧 Prerequisites

- **Node.js** ≥ 18.x and **npm** (or pnpm/yarn)
- **Service account JSON** for Firebase Admin (server only)
- (Optional) **Twilio** or any SMS provider for OTP

---

## ⚙️ Environment Variables

Create `.env.local` & `.env` files for both **backend** and **frontend**.

### `backend/.env`

```
PORT=port

GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

CORS_ORIGIN=http://your-domaint:your-port
FE_URL=http://your-domaint:your-port

OTP_SECRET=your-otp-secret
OTP_TTL_IN_MINS=5
OTP_MAX_ATTEMPTS=5
RESEND_COOLDOWN=30

TWILIO_FROM=phone-number
TWILIO_MSID=message-severvice-id
TWILIO_SID=sender-id
TWILIO_TOKEN=token-id

EMAIL_FROM=email-from
GMAIL_USER=gmail-account
GMAIL_APP_PASSWORD=google-app-password
TOKEN_SECRET=your-secret

JWT_SECRET=your-secret
JWT_ACCESS_TOKEN_TTL=7200
JWT_REFRESH_TOKEN_TTL=2592000
```

> Place your **serviceAccountKey.json** in `backend/serviceAccountKey.json` (git‑ignored).

### `frontend/.env.local`

```
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=/socket.io
```

---

## 🚀 Getting Started

### 1) Install dependencies

```bash
npm install
# or: npm install / yarn
```

### 2) Dev servers

**Backend**

```bash
cd backend
npm run dev
# starts Express on http://localhost:3000
```

**Frontend**

```bash
cd frontend
npm run dev
# opens Vite dev server on http://localhost:4000
```

> Ensure `VITE_API_BASE_URL` points to your API URL. (This is proxy path)

---

## 🧱 API Overview (selected)

Base URL: `{VITE_API_BASE_URL}` (e.g., `/api`)

### Auth

- Each page is protected based on user roles (Instructor, Student, Admin, etc.).
- Unauthorized users or those with expired sessions are automatically redirected to the login page.
- Protected routes use authentication guards to check for valid JWT tokens before granting access.
- If the access token is missing or expired, the user is logged out and prompted to sign in again.

- `POST /auth/createAccessCode` — Create access code
- `POST /auth/validateAccessCode` — Verify OTP and receive tokens
- `POST /auth/logout` — Revoke refresh token

### Profile

- `GET /me` — Get current user
- `PUT /me` — Update `username` (immediate) or `email/phone` (OTP confirmation flow)

### Instructor — Students list

- `GET /instructor/students`
  - Query params:
    - `query` (prefix search by username/email/phone)
    - `pageSize` (default 20, max 100)
    - `sort` in `username_asc | username_desc | createdAt_desc`
    - `cursor` (opaque string from previous page)
  - Returns paginated students added by the instructor.
- `POST /instructor/assignLesson` - Create lesson and assign for students. Realtime in-app notification for online users and email notification for assigned students.
- `GET /instructor/currentAssignments` - Get current assignments that assigned for students.
- `PUT/DELETE /instructor/:phoneNumber` - Update/Delete students that added by instructor.

### Student

- `GET /student/myLessons` - Get all lessons that are assigned.
- `POST /student/markLessonDone` - Mark lessons as `done`

### Notification

- Contains routes that manage the user's in-app/email notification, send notification and integrate realtime receiver for immediate notifications.

### Chat (Unimplement)

- This feature has not been implemented.

---

## 🧩 Data & Validation

- **Zod** schemas for DTO contracts (client + server)
  - `User`, `Student`, `Instructor`, `Assignment`, `Lesson`, `UpdateProfileDTO`, etc.
- Phone normalization utility for consistent indexing (`+84…` E.164)
- Optional lowercased fields for prefix search (`usernameLower`, `emailLower`) — and use composite index + `startAt/endAt` patterns.

---

## 🧠 Frontend Notes

- React + **TanStack Query** (query keys structured, `staleTime` tuned)
- UI library: **DaisyUI** theme tokens configured
- Components: `ProfileModal`, `StudentsTable`, `InstructorDashboard`, `SmsSigninForm`, `EmailSigninForm`, `PasswordSigninForm`, etc.
- State helpers: `zustand` for UI/session bits
- Error boundary + toast notifications (e.g., Sonner) for UX

### Example: fetching current user

```ts
const {{ data: currentUser }} = useQuery({
  queryKey: ["me"],
  queryFn: getProfile,
  staleTime: 5 * 60_000,
});
```

---

## 🔐 Security

- JWT access/refresh with HS256 (keep `JWT_SECRET` safe)
- Rate‑limit OTP requests and max attempts (`OTP_MAX_ATTEMPTS`)
- Validate inputs with Zod on **both** client and server

---

## 🔌 Realtime (Socket.IO)

- Client connects after authentication and emits status updates (online/offline).
- Server authenticates sockets using access tokens (JWT) and assigns each user to dedicated rooms based on user ID and phone number.
- Presence events are broadcast when users connect or disconnect, enabling realtime online status tracking.
- The server can emit events to individual users, phone numbers, or custom rooms (e.g., lesson assignment notifications).
- Lesson assignment triggers realtime notifications to all relevant students via Socket.IO.

---

## 🛠 Development Scripts (examples)

**backend/package.json** (snippet)

```json
{{
  "scripts": {
    "dev": "npx tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}}
```

**frontend/package.json** (snippet)

```json
{{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}}
```

---

## 🧪 Testing

- All API endpoints were manually tested using Postman to verify authentication, data validation, and business logic.
- Common flows (login, OTP verification, student management, lesson assignment, notifications) were exercised with real data.
- Realtime features (Socket.IO) were tested by connecting multiple clients and observing presence and notification events.
- Any issues found during manual testing were fixed and retested.

---

## 📸 Screenshots & Demo (placeholders)

- `docs/screenshots/` — UI shots (Dashboard, Students table, Profile modal)
- Demo video link: 🔧 [(Google Drive)](https://drive.google.com/drive/folders/1FLGtOyuP9zLPzNoFdWRdFIVdvrY1PHxc?usp=sharing)

---

## 📚 Useful Commands & Snippets

- Generate 6‑digit OTP: `getOtp6Code()`; hash: `hashHmacOtp(userId, otp, OTP_SECRET)`
- Date helpers: `expiresAtFromNow(minutes)`
- Phone helpers: `normalizePhone(raw)` → `+84…`
- Error handling: `AppError(message, status, code)`
- Email & SMS notifier to send OTP & notification to users.

---

## 📬 Contact / Support

- All codes & resources can be found in GitHub and Google Drive:
- GitHub (Code): https://github.com/truongchanbuu/code-challenge
- Google Drive (Video Demo + Screenshot): https://drive.google.com/drive/folders/1FLGtOyuP9zLPzNoFdWRdFIVdvrY1PHxc?usp=sharing
- Email: truongchanbuu0512@gmail.com - Phone: 0941600508
- LinkedIn: https://www.linkedin.com/in/buutruong/
