# KijiTalk auth service

Django + Django REST Framework + SimpleJWT service that owns **sign-in for KijiTalk**:
sign-up, login, Google sign-in, sessions, password change and reset, and email
verification. It was built from the `python_auth-main` starter template.

The Node API (`backend/`) still owns learner profiles: class, streak, XP and
subscription. It trusts the short-lived access tokens issued here, which share an
HS256 secret, and matches each login to its profile by email.

```
web / mobile ──login──▶ auth-service (Django, :8100)  ──▶ Postgres schema "auth"
     │                        │ access token (15 min)
     └──Bearer access──▶ backend (Node, :4001)        ──▶ Postgres schema "public"
```

## How sessions work

| | Web | Mobile |
|---|---|---|
| Access token | in memory only, 15 min | in memory only, 15 min |
| Refresh token | `kt_refresh` **httpOnly** cookie, path `/api/auth/` | device keychain (`expo-secure-store`) |
| Client header | `X-KT-Client: web` | `X-KT-Client: mobile` |

- Each refresh token **rotates on every use**, and the old one is blacklisted, so a stolen token works at most once.
- Logout, password change and password reset **blacklist the sessions** involved. Password change and reset sign out every other device.
- Refresh and logout require the `X-KT-Client` header. A browser can only send it cross-origin after a CORS preflight, which blocks forged requests.

## Existing users

Accounts created before this service exist only in the Node API's `public.users` table, with bcrypt hashes.
- **Login:** the first time such a learner signs in, the old password is checked and the account is carried over. It's re-hashed with Django's hasher.
- **Forgot password:** this also works for accounts that haven't been carried over yet.
- **Sign-up:** a new sign-up can never claim an email that already has an old account.

## Endpoints (`/api/auth/`)

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `providers/` | — | which sign-in methods are on |
| POST | `register/` | — | `email, password, display_name` → session; sends a verification email |
| POST | `login/` | — | `email, password` → session |
| POST | `google/` | — | `id_token` → session (needs `GOOGLE_CLIENT_ID`) |
| POST | `token/refresh/` | cookie / `refresh` | rotate → new session |
| POST | `logout/` | cookie / `refresh` | revoke this session |
| GET | `me/` | Bearer | login account |
| POST | `change-password/` | Bearer | `old_password, new_password`; signs out other devices |
| POST | `password/forgot/` | — | `email` → reset link (same answer whether or not the account exists) |
| POST | `password/reset/` | — | `uid, token, new_password` |
| POST | `email/verify/` | — | `token` from the email link |
| POST | `email/resend/` | Bearer | send the verification link again |

Every error has the shape `{"error": "...", "fields"?: {...}}`.

## Run locally (Windows)

```powershell
cd auth-service
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env   # set DATABASE_URL (same as backend/.env) and AUTH_JWT_SECRET (same value in backend/.env)
.venv\Scripts\python manage.py ensure_auth_schema   # creates the "auth" schema, once
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py runserver 8100
```

The web app reads `NEXT_PUBLIC_AUTH_URL` (default `http://localhost:8100`), and the mobile app reads `EXPO_PUBLIC_AUTH_URL`.

**Emails:** they print to the server console by default. For real mail, set `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` and the `EMAIL_HOST*` values.

**Tests:**
```powershell
.venv\Scripts\python manage.py test apps.accounts
```

**Admin panel:** run `python manage.py createsuperuser`, then open `/admin/`.

## Fixed from the template
- `requirements.txt` was saved as UTF-16, which breaks `pip install`. It's now UTF-8.
- `settings.py` used a non-existent `MAILERS` setting, so no email was ever sent. It now uses `EMAIL_BACKEND`.
- The duplicate `accounts_backup` app was dropped.
