from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import importer  # Local import
import models    # Local import
import subprocess
import shlex
import os
import shutil
import mimetypes
from pathlib import Path

router = APIRouter()

# ... existing endpoints (get_projects, link_project) ...
@router.get("/projects", response_model=models.ProjectList)
async def get_projects():
    """List all available projects in the database."""
    projects_data = importer.list_projects()
    return {"projects": projects_data}

@router.post("/projects/link")
async def link_project(url: str):
    """Clone a Git repository and add it as a project."""
    return importer.clone_repository(url)

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Remove a project from the database."""
    return importer.delete_project(project_id)

# ... rest of the file ...
@router.get("/projects/{project_id}/file/{file_path:path}")
async def get_file_by_path(project_id: str, file_path: str):
    """Serve a specific file by its path within the project."""
    # Construct full path
    full_path = importer.PROJECTS_DIR / project_id / file_path
    
    # Verify file exists
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security check: ensure path is within project dir
    try:
        full_path.resolve().relative_to(importer.PROJECTS_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Determine media type explicitly
    media_type, _ = mimetypes.guess_type(full_path)
    if media_type is None:
        # Fallback for common types if guess fails
        suffix = full_path.suffix.lower()
        if suffix == '.png':
            media_type = 'image/png'
        elif suffix in ['.jpg', '.jpeg']:
            media_type = 'image/jpeg'
        elif suffix == '.svg':
            media_type = 'image/svg+xml'
        elif suffix == '.pdf':
            media_type = 'application/pdf'
        else:
            media_type = 'application/octet-stream'

    return FileResponse(full_path, media_type=media_type)

@router.get("/projects/{project_id}/tree")
async def get_project_tree(project_id: str):
    """Return file lists for specific output folders with nested structure."""
    project_path = importer.PROJECTS_DIR / project_id
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    def build_tree(dir_path: Path, relative_to: Path):
        tree = []
        if not dir_path.is_dir():
            return tree
            
        # Sort directories first, then files
        items = sorted(dir_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
        
        for item in items:
            # Skip hidden files/folders
            if item.name.startswith('.'):
                continue
                
            node = {
                "name": item.name,
                "path": str(item.relative_to(relative_to)),
                "type": "directory" if item.is_dir() else "file"
            }
            
            if item.is_dir():
                node["children"] = build_tree(item, relative_to)
                # Add directory even if empty to allow navigation
                tree.append(node)
            else:
                tree.append(node)
                
        return tree

    # Dynamic Discovery Logic
    result = {}
    
    # 1. Iterate over all top-level items in the project directory
    # Sort by name to keep consistent order
    for item in sorted(project_path.iterdir(), key=lambda x: x.name.lower()):
        # Skip hidden folders (.git) and the assets folder (thumbnails)
        if item.name.startswith('.') or item.name == 'assets':
            continue
            
        if item.is_dir():
            # Add folder as a category
            result[item.name] = build_tree(item, project_path)
        else:
            # Group root-level files under a special key if needed
            if "Root Files" not in result:
                result["Root Files"] = []
            
            result["Root Files"].append({
                "name": item.name,
                "path": str(item.relative_to(project_path)),
                "type": "file"
            })
            
    return result

@router.post("/projects/{project_id}/build")
async def sync_and_build(project_id: str):
    """Sync the repo and run the KiCAD jobset to regenerate outputs."""
    # 1. Sync
    importer.sync_repository(project_id)
    
    # 2. Build
    project_path = importer.PROJECTS_DIR / project_id
    jobset_path = project_path / "Outputs.kicad_jobset"
    
    if not jobset_path.is_file():
        return {"message": "Synced successfully. No 'Outputs.kicad_jobset' found to build."}
        
    # Check if kicad-cli exists
    if shutil.which("kicad-cli") is None:
            raise HTTPException(status_code=500, detail="kicad-cli not found on host server path.")

    # Find the .kicad_pro file dynamically
    pro_files = list(project_path.glob("*.kicad_pro"))
    if not pro_files:
        raise HTTPException(status_code=404, detail="No .kicad_pro file found in project root.")
    
    # Use the first found project file
    pro_file_path = pro_files[0]

    # Helper function to run a jobset output
    def run_jobset_output(output_id: str, description: str):
        cmd = [
            "kicad-cli", "jobset", "run",
            "-f", str(jobset_path),
            "--output", output_id,
            str(pro_file_path)
        ]
        
        result = subprocess.run(
            cmd, 
            shell=False, 
            cwd=str(project_path), 
            capture_output=True, 
            text=True
        )
        
        if result.returncode != 0:
            raise Exception(f"KiCAD CLI Error ({description}): {result.stderr}")

    try:
        # Define outputs to generate
        outputs = [
            ("28dab1d3-7bf2-4d8a-9723-bcdd14e1d814", "Design Outputs"),
            ("9e5c254b-cb26-4a49-beea-fa7af8a62903", "Manufacturing Outputs"),
            ("81c80ad4-e8b9-4c9a-8bed-df7864fdefc6 ", "Ray-Traced Renders")
        ]

        # Run each output
        for output_id, description in outputs:
            run_jobset_output(output_id, description)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Build failed: {str(e)}")
        
    return {"message": "Sync and build completed successfully"}