# SimpleToDo

SimpleToDo is a fullstack task management application, where users can create, edit, organize, and drag tasks between
columns based on their status (pending, ongoing, completed, etc).

It consists of:

- A **React + TypeScript frontend**, using `@dnd-kit` for drag-and-drop functionality and `react-i18next` for
  internationalization.
- A **Go backend**, exposing a secure and efficient REST API with **JWT authentication stored in HTTP-only cookies**,
  advanced pagination, and modular business logic.
- The frontend is embedded inside the Go binary using `embed`, allowing for a simplified deployment as a standalone
  executable.

---

## 🔐 Authentication Model (JWT + HTTP-only Cookie)

The application uses **JWT** for authentication, but instead of sending the token in an `Authorization` header and
storing it in `localStorage`, the backend now issues a **HTTP-only cookie** that the browser sends automatically.

High-level flow:

1. **Login**
   - `POST /api/v1/auth/login` with email/password.
   - On success, the backend signs a JWT and sets it in a cookie named `auth_token`:
     - `HttpOnly: true` (not accessible from JavaScript).
     - `SameSite: Lax` by default (configurable for different deployments).
     - `Secure: false` in local development (should be `true` in production over HTTPS).
   - The response body no longer returns the raw token.

2. **Subsequent requests**
   - The frontend Axios client is configured with `withCredentials: true`.
   - The browser automatically sends `auth_token` on every request to the API origin.
   - Protected routes in the backend use a `JWTMiddleware` that reads the token from the cookie, validates it, and
     injects `user_id`, `user_email` and `user_role` into the Echo context.

3. **Current user session**
   - Frontend calls `GET /api/v1/auth/me` to retrieve basic information about the logged-in user.
   - This route is protected by the same JWT middleware and responds with `401` when the cookie is missing or invalid.
   - The React app stores the result in a lightweight `authStore` (Zustand) with fields like `isAuthenticated`, `user`
     and `isLoading`.

4. **Route protection on the frontend**
   - `PrivateRoute` and `PublicRoute` components consult `authStore` instead of reading tokens from `localStorage`.
   - `AdminRoute` checks the `role` field from `authStore.user` to allow or block access to admin-only sections.

5. **Logout**
   - `DELETE /api/v1/auth/logout` clears the cookie on the server by sending an expired `auth_token` cookie.
   - The frontend clears the auth store and redirects the user to the login page.

6. **Token expiration**
   - The JWT includes an `exp` claim (currently 72 hours by default).
   - When expired or invalid, the JWT middleware returns `401` for any protected route, and the frontend reacts by
     clearing the session and redirecting to `/auth` via the route guards.

---

## 📂 Project Structure

```text
├───.github
│   └───workflows
├───app
├───config
│   └───static
│       └───templates
├───db
├───docs
├───dto
│   ├───request
│   └───response
├───frontend
│   ├───dist
│   │   └───assets
│   ├───public
│   └───src
│       ├───assets
│       │   └───lottie
│       ├───components
│       ├───hooks
│       ├───i18n
│       │   └───locales
│       ├───pages
│       ├───schemas
│       ├───services
│       ├───store
│       └───utils
├───middleware
├───models
├───repository
├───router
│   └───v1
├───service
└───util
    ├───mailer
    └───mapper
```

---

## 🚀 Build & Run Locally

### 1. Build the backend

```bash
go build -o todoapp ./app
```

### 2. (Optional) Regenerate Swagger Documentation

```bash
swag init -d "./app,./router/v1,./dto/request,./dto/response" -o docs --parseDependency --parseDependencyLevel 3 --parseFuncBody
```

### 3. Run the app

```bash
./todoapp
```

---

## 📖 API Documentation (Swagger)

After running the app, open in your browser:

```text
http://localhost:8000/swagger/index.html#/
```

> Replace `localhost:8000` with your actual host and port if different.

---

## ⚙️ Environment Configuration

The application uses **environment variables** stored in `.env` under an application directory.  
By default, both `.env` and the SQLite database will be located under:

```text
$SIMPLETODO_HOME
```

If not set, it defaults to:

```text
~/SimpleToDo
```

### Example `.env`

```env
JWT_SECRET=your-secret-key
SCHEME=http
HOST=localhost
PORT=8000
BASE_URL=http://localhost:8000
OPEN_BROWSER=true
SHOW_LOGS=true
# Comma separated list of allowed origins for CORS (e.g. React dev server)
CORS_ORIGIN=http://localhost:5173

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASSWORD=pass
SMTP_FROM_EMAIL=app@example.com

ROOT_FIRSTNAME=Admin
ROOT_LASTNAME=User
ROOT_PHONE=+123456789
ROOT_EMAIL=admin@example.com
ROOT_USERNAME=admin
ROOT_PASSWORD=changeme

# Database configuration (SQLite or PostgreSQL)
DB_CLIENT=sqlite              # or postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=simpletodo
DB_SSL=false
TIMEZONE=UTC
```

> ⚠️ If values are missing, on first run you’ll be prompted interactively to fill them.  
> Simply pressing **Enter** will use safe defaults (where possible) so you can quickly try the app without full SMTP
> configuration.

### Frontend environment

The React frontend (Vite) expects a `.env` file in the `frontend` directory with at least:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The Axios client is configured as:

- `baseURL = ${VITE_API_BASE_URL}/api/v1`
- `withCredentials = true` (so cookies are sent automatically)

Ensure `CORS_ORIGIN` in the backend `.env` matches the frontend origin (e.g. `http://localhost:5173`).

---

## 🐳 Run with Docker Compose

A ready-to-use **docker-compose.yml** is provided:

```yaml
services:
  app:
    build: .
    container_name: simpletodo
    ports:
      - "8000:8000"
    env_file:
      - .env # Ensure this file exists in the same directory
    volumes:
      - ./data:/data
    restart: unless-stopped
```

### Steps:

1. Create a `.env` file in the project root (or copy an existing one).
2. Run:
   ```bash
   docker-compose up -d
   ```
3. Visit:  
   [http://localhost:8000](http://localhost:8000)

> When running behind HTTPS and a separate frontend domain, configure cookie flags (`Secure`, `SameSite`) and
> `CORS_ORIGIN` appropriately in `.env`.

---

## 📦 Versioning

- Current version: **1.0.3**
- Next release: will likely be **2.0.0** due to recent breaking changes.

### Tagging a Release

```bash
git tag v2.0.0
git push origin v2.0.0
```

---

## ⚡ CI/CD

- The repository includes **GitHub Actions** under `.github/workflows`.
- On each push or tag:
  - The project is built for **Linux, Windows, and macOS**.
  - Artifacts are attached to the GitHub Release.

---

## ✨ Key Features

- JWT-based authentication with HTTP-only cookies
- User, project, and task management
- Dynamic filtering and advanced pagination
- Clean and responsive UI using Tailwind and Heroicons
- Cross-platform binaries built automatically with CI/CD
- Ready-to-use Docker Compose setup

---

## 🌟 SimpleToDo Images

| <img src="docs/images/login.png" alt="Login" width="200"/> | <img src="docs/images/register.png" alt="Register" width="200"/> | <img src="docs/images/dashboard.png" alt="Dashboard" width="200"/> | <img src="docs/images/tasks.png" alt="Tasks" width="200"/> | <img src="docs/images/projects.png" alt="Projects" width="200"/> |
|------------------------------------------------------------|------------------------------------------------------------------|--------------------------------------------------------------------|------------------------------------------------------------------|--------------------------------------------------------------------|
| <img src="docs/images/profile.png" alt="Profile" width="200"/> | <img src="docs/images/light_tasks.png" alt="Light Tasks" width="200"/> | <img src="docs/images/swagger1.png" alt="Swagger UI 1" width="200"/> | <img src="docs/images/swagger2.png" alt="Swagger UI 2" width="200"/> | <img src="docs/images/terminal.png" alt="Terminal" width="200"/> |


----

Ready to organize your tasks in a fast and elegant way? 🚀
