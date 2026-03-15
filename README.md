# 🚀 How to Run DevTube

To run DevTube, you will need to open **two terminals**.

### 1. Start the Backend Server
In your first terminal, navigate to the `server` directory and start the Node process:
```bash
cd server
npm run dev
```
*Note: Ensure you have added your `GEMINI_API_KEY` to `server/.env` first.*

### 2. Start the Frontend Application
In your second terminal, stay in the root project directory and start the Vite dev server:
```bash
npm run dev
```

### 🛑 Troubleshooting "Port Busy" Errors
If you see `EADDRINUSE: address already in use :::5000`, it means a previous session is still hanging. You can clear it by running:
**Windows (PowerShell):**
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```
**Mac/Linux:**
```bash
lsof -i :5000 -t | xargs kill -9
```

### 🌐 Access the App
Once both are running, open your browser to the URL shown in the frontend terminal (usually `http://localhost:5173` or similar).
