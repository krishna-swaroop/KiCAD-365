# Hosting KiCAD-365 on a Local Network

This guide explains how to make your KiCAD-365 instance accessible to other devices on the same local network (LAN).

## Prerequisites
- Both backend and frontend are installed and working (see [README.md](../README.md))
- All devices are connected to the same network (Wi-Fi or Ethernet)

## Step 1: Find Your Machine's IP Address

### On macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for an address like `192.168.1.55` or `10.0.0.5`.

### On Windows:
```powershell
ipconfig
```
Look for the "IPv4 Address" under your active network adapter (e.g., `192.168.1.55`).

## Step 2: Start the Backend Server

The backend must bind to `0.0.0.0` to accept connections from other devices:

### macOS/Linux:
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Windows (PowerShell):
```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Step 3: Start the Frontend Server

The frontend must also bind to `0.0.0.0`:

```bash
cd kicad-frontend
npm run dev -- --host 0.0.0.0
```

Vite will display two URLs:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.55:5173/
```

The **Network** address is what other devices will use.

## Step 4: Access from Other Devices

On any device connected to the same network:
1. Open a web browser
2. Navigate to `http://YOUR_IP:5173` (e.g., `http://192.168.1.55:5173`)

## Troubleshooting

### Cannot access from other devices
- **Firewall**: Ensure ports `8000` (backend) and `5173` (frontend) are allowed through your firewall.
  - **macOS**: System Settings → Network → Firewall → Allow incoming connections for Python and Node.
  - **Windows**: Windows Defender Firewall → Allow an app → Add Python and Node.js.
- **Network**: Confirm all devices are on the same network (not guest Wi-Fi).

### "Backend Offline" error on remote device
- Verify the backend is running with `--host 0.0.0.0`
- Check that port `8000` is accessible: `curl http://YOUR_IP:8000/` from another device

### CORS errors
- The backend has been configured to allow all origins (`*`) for local network use.
- If you still see CORS errors, ensure you restarted the backend after updating `main.py`.
