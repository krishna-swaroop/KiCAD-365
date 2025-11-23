# Hosting KiCAD-365 on Windows

This guide provides step-by-step instructions for setting up and hosting the KiCAD-365 application on a Windows Workstation.

## Prerequisites

Before you begin, ensure you have the following software installed:

1.  **KiCAD (Version 8.0+)**:
    *   Download and install from [kicad.org](https://www.kicad.org/download/windows/).
    *   **Important**: During installation, ensure you select the option to add KiCAD to your system `PATH`. If you missed this, you'll need to add `C:\Program Files\KiCad\8.0\bin` (or your installation path) to your Environment Variables manually.
    *   Verify by opening Command Prompt (`cmd`) and typing `kicad-cli --version`.

2.  **Python (Version 3.10+)**:
    *   Download from [python.org](https://www.python.org/downloads/windows/).
    *   **Important**: Check the box "Add Python to PATH" during installation.

3.  **Node.js (LTS Version)**:
    *   Download from [nodejs.org](https://nodejs.org/).
    *   This includes `npm` which is required for the frontend.

4.  **Git**:
    *   Download from [git-scm.com](https://git-scm.com/download/win).

## Installation

### 1. Clone the Repository
Open PowerShell or Command Prompt and run:
```powershell
git clone https://github.com/Pixxel-Space/KiCAD-365-Dev.git
cd KiCAD-365-Dev/KiCAD-365
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment:

```powershell
cd gemini-impl/backend

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# For PowerShell:
.venv\Scripts\Activate.ps1
# For Command Prompt:
# .venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*Keep this terminal window open.*

### 3. Frontend Setup
Open a **new** terminal window, navigate to the frontend directory, and start the development server:

```powershell
cd gemini-impl/kicad-frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

### 4. Access the Application
Open your browser and navigate to:
[http://localhost:5173](http://localhost:5173)

## Troubleshooting

### "kicad-cli not found"
*   **Issue**: The backend fails to run "Sync & Build" with an error about `kicad-cli`.
*   **Fix**: Ensure KiCAD's `bin` folder is in your System PATH.
    1.  Search for "Edit the system environment variables" in Windows Search.
    2.  Click "Environment Variables".
    3.  Under "System variables", find `Path` and click "Edit".
    4.  Add a new entry: `C:\Program Files\KiCad\8.0\bin` (adjust version/path as needed).
    5.  Restart your terminal/IDE and the backend server.

### "Script is disabled on this system" (PowerShell)
*   **Issue**: Error when trying to activate the virtual environment (`.venv\Scripts\Activate.ps1`).
*   **Fix**: Run PowerShell as Administrator and execute:
    ```powershell
    Set-ExecutionPolicy RemoteSigned
    ```
    Or use Command Prompt (`cmd`) instead.

### Firewall Warnings
*   **Issue**: Windows Firewall may block Python or Node.js.
*   **Fix**: Click "Allow Access" if prompted to allow connections on Private networks.
