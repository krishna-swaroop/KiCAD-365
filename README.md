# KiCAD-365

A web-based platform for viewing, managing, and collaborating on KiCAD hardware projects.

## Features
- **Project Management**: View and manage KiCAD projects.
- **Interactive BoM**: Integrated Interactive HTML BoM viewer.
- **File Preview**: Preview Markdown, CSV, and PDF files.
- **3D Viewer**: (Coming Soon) View 3D models of PCBs.
- **Git Integration**: Sync projects directly from Git repositories.

## Getting Started

### Documentation
- [Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md)
- [Windows Hosting Guide](./docs/WINDOWS_HOSTING.md)
- [Local Network Hosting Guide](./docs/LOCAL_NETWORK_HOSTING.md)

> For best results, ensure your KiCAD Project Repositories follow the recommended [folder structure](./docs/FOLDER_STRUCTURE.md).

### Quick Start (macOS/Linux)

1. **Backend**:
   ```bash
   cd backend
   
   # Create and activate virtual environment
   python -m venv .venv
   source .venv/bin/activate
   
   # Install dependencies
   pip3 install -r requirements.txt

   # Run the backend server
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend**:
   ```bash
   cd kicad-frontend
   
   # Install Dependencies
   npm install
   
   # Run the frontend server
   npm run dev
   ```

3. **Access**: Open [http://localhost:5173](http://localhost:5173)

> Refer to [Windows Hosting Guide](./docs/WINDOWS_HOSTING.md) for Windows hosting instructions.

## Contributing

Contributions are welcome! Please see the [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest enhancements.

> This has been mostly vibe-coded over a sleepless weekend. Expect some difficulties setting things up

**Huge Shoutout to ![@theacodes](https://github.com/theacodes) for their work on the ![KiCanvas Project](https://github.com/theacodes/kicanvas)**
