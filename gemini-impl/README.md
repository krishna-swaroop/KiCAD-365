# KiCAD-365

A web-based platform for viewing, managing, and collaborating on KiCAD hardware projects.

## Features
- **Project Management**: View and manage KiCAD projects.
- **Interactive BoM**: Integrated Interactive HTML BoM viewer.
- **File Preview**: Preview Markdown, CSV, and PDF files.
- **3D Viewer**: (Coming Soon) View 3D models of PCBs.
- **Git Integration**: Sync projects directly from Git repositories.

## Getting Started

### 📚 Documentation
- [Folder Structure](./docs/FOLDER_STRUCTURE.md)
- [Windows Hosting Guide](./docs/WINDOWS_HOSTING.md)
- [Local Network Hosting Guide](./docs/LOCAL_NETWORK_HOSTING.md)

### Quick Start (macOS/Linux)

1. **Backend**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd kicad-frontend
   npm install
   npm run dev
   ```

3. **Access**: Open [http://localhost:5173](http://localhost:5173)
