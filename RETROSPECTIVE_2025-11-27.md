# Retrospective: Local Development Issues & Fixes

**Date:** November 27, 2025  
**Project:** CarFit Studio MVP

---

## Summary

During local development setup, we encountered several blocking issues that prevented the frontend and backend from running correctly. This document captures the root causes and solutions for future reference.

---

## Issue 1: Node.js NVM Symlink Pointing to Wrong User

### Symptom
Every `npm` command failed with:
```
Error: EPERM: operation not permitted, lstat 'C:\Users\DanteTsang\AppData'
```

### Root Cause
The Node.js installation was managed by **NVM for Windows**, and the symlink at `C:\Program Files\nodejs` was pointing to another user's profile (`DanteTsang`) instead of the current user (`LarryChan`).

```powershell
# Checking the symlink target:
Get-Item "C:\Program Files\nodejs" | Select-Object -ExpandProperty Target
# Output: C:\Users\DanteTsang\AppData\Roaming\nvm\v18.17.1
```

### Impact
- `npm install` fails
- `npm run dev` fails
- Any npm-based command throws permission errors

### Solution (Workaround)
Run Next.js directly using the local `node_modules` binary instead of going through npm:
```powershell
cd frontend
.\node_modules\.bin\next dev
```

### Permanent Fix (Recommended)
1. Reinstall NVM for Windows under the current user profile.
2. Or reinstall Node.js directly (without NVM) from https://nodejs.org.
3. Ensure the `NVM_HOME` environment variable points to the correct user's AppData.

---

## Issue 2: Port Already in Use

### Symptom
```
⚠ Port 3000 is in use, trying 3001 instead.
```

### Root Cause
A previous instance of the development server (or another process) was still holding onto port 3000.

### Solution
1. Find the process using the port:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. Kill the process:
   ```powershell
   taskkill /PID <PID_NUMBER> /F
   ```
3. Restart the dev server.

---

## Issue 3: Missing `autoprefixer` Module

### Symptom
```
Error: Cannot find module 'autoprefixer'
```
Build failed, and the page showed a red "Build Error" overlay.

### Root Cause
The `postcss.config.js` file referenced `autoprefixer`, but the package was not installed in `node_modules`. Since `npm install` was broken (Issue 1), we couldn't install it.

### Solution
Simplified `postcss.config.js` to only use `tailwindcss` (which was already installed):

```javascript
// frontend/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
```

This removed the dependency on `autoprefixer` and allowed the build to succeed.

---

## Issue 4: Tailwind CSS Not Applying Styles

### Symptom
The page loaded but looked completely unstyled (raw HTML).

### Root Cause
1. Missing `postcss.config.js` initially.
2. Then, the config referenced a missing module (`autoprefixer`).

### Solution
Ensure `postcss.config.js` exists and only references installed plugins:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
  },
};
```

Also ensure `tailwind.config.js` has the correct content paths:
```javascript
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## Issue 5: Backend Server Not Starting

### Symptom
`curl http://localhost:8000/api/health` returned "connection refused".

### Root Cause
The backend server was not running. The command to start it was executed from the wrong directory.

### Solution
Always run uvicorn from the project root:
```powershell
cd C:\Users\LarryChan\CarFit
.\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
```

---

## Key Lessons Learned

1. **NVM Symlinks are User-Specific:** If you share a machine or clone a dev environment, NVM symlinks may point to another user's profile. Always verify with `Get-Item "C:\Program Files\nodejs"`.

2. **Kill Zombie Processes:** Before debugging "connection refused" errors, check if a previous server instance is still running on the port.

3. **Minimal PostCSS Config:** If `npm install` is broken, simplify `postcss.config.js` to only use packages that are already installed.

4. **Use Local Binaries:** When `npm` is broken, you can often run tools directly from `node_modules/.bin/`.

5. **Check Terminal Output:** Always read the full terminal output. The actual error message (e.g., "Cannot find module 'autoprefixer'") is usually buried in the stack trace.

---

## Current Working Setup

| Service  | URL                      | Command                                      |
|----------|--------------------------|----------------------------------------------|
| Frontend | http://localhost:3003    | `cd frontend; .\node_modules\.bin\next dev`  |
| Backend  | http://localhost:8000    | `.\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000` |

---

## Next Steps

1. **Fix NVM permanently** by reinstalling under the current user.
2. **Add `autoprefixer`** to `package.json` and run `npm install` once npm is fixed.
3. **Configure real AI** by adding a Replicate API token.

