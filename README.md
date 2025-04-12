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

## 🧩 Running the App and Command-Line Options

Once you’ve built the binary (e.g. `todoapp.exe` or `todoapp`), you can run it directly from the terminal or PowerShell.

### ▶️ Basic Usage

This will:

- Start the HTTP server on port `8000`.
- Launch your default browser pointing to `http://localhost:8000`.
- Show HTTP request logs in the terminal.

### ⚙️ Available Flags

| Flag            | Type   | Default | Description                                |
|-----------------|--------|---------|--------------------------------------------|
| `--port`        | int    | `8000`  | Port to run the server on                  |
| `--openbrowser` | bool   | `true`  | Automatically open the browser on start    |
| `--showlogs`    | bool   | `true`  | Display HTTP request logs in the console   |

### ✅ Examples

#### Run on a different port (e.g. 9000):

```sh
    ./todoapp --port 9000
```

#### Run without opening the browser:

```sh
    ./todoapp --openbrowser=false
```

#### Run silently (no logs, no browser):

```sh
    ./todoapp --showlogs=false --openbrowser=false
```

### 💡 Notes on Terminal Compatibility

- All flags follow **GNU-style syntax**: `--flag value` or `--flag=value`.
- This works in **Bash, Zsh, PowerShell, and CMD**.
- In PowerShell or CMD, prefer using `=` for clarity:

.\todoapp.exe --port=9000 --openbrowser=false --showlogs=false


## 🏷️ How to create a new release

To trigger a build for all platforms and publish a new release:

1. Commit your changes and push them to the `main` branch.
2. Create a new version tag locally and push it:

```bash
git tag v1.0.0
git push origin v1.0.0
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
