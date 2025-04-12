# SimpleToDo

SimpleToDo is a fullstack task management application, where users can create, edit, organize, and drag tasks between columns based on their status (pending, ongoing, completed, etc).

It consists of:

- A **React + TypeScript frontend**, using `@dnd-kit` for drag-and-drop functionality and `react-i18next` for internationalization.
- A **Go backend**, exposing a secure and efficient REST API with JWT authentication, advanced pagination, and modular business logic.
- The frontend is embedded inside the Go binary using `embed`, allowing for a simplified deployment as a standalone executable.

## 🚀 Build and package commands

1. **Clone this repository**:
```bash
git clone https://github.com/your-username/SimpleToDo.git
cd SimpleToDo
```

2. **Clone the frontend from the external repository**:
```bash
git clone https://github.com/your-username/frontend-repo.git web
cd web
npm install
npm run build
```

3. **Copy the built frontend into the backend project**:
```bash
rm -rf internal/frontend/dist
mkdir -p internal/frontend
cp -r web/dist internal/frontend/dist
```

4. **Build the backend binary**:
```bash
go build -o app ./cmd
```

5. **(Optional) Cross-platform builds**:
```bash
GOOS=windows GOARCH=amd64 go build -o build/app.exe ./cmd
GOOS=linux GOARCH=amd64 go build -o build/app ./cmd
GOOS=darwin GOARCH=amd64 go build -o build/app-mac ./cmd
```

> ⚠️ For macOS builds to be executable on actual macOS machines, you may need to build on a macOS runner (via GitHub Actions `macos-latest`) or sign the binary depending on your distribution method.

## 🏷️ How to create a new release

To trigger a build for all platforms and publish a new release:

1. Commit your changes and push them to the `main` branch.
2. Create a new version tag locally and push it:

```bash
git tag v1.2.0
git push origin v1.2.0
```

This will trigger the GitHub Actions workflow to build binaries for:
- ✅ Linux (amd64)
- ✅ Windows (amd64)
- ✅ macOS (amd64)

The generated binaries will be uploaded as artifacts attached to the release.

---

## 📦 Key Features

- JWT-based authentication
- User, project, and task management
- Dynamic filtering and advanced pagination
- Clean and responsive UI using Tailwind and Heroicons
- CI-ready with GitHub Actions integration

---

Ready to organize your tasks in a fast and elegant way? ✨
