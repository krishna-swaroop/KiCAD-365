from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import importer
import models
import subprocess
import shlex
import os

router = APIRouter()

@router.get("/projects", response_model=models.ProjectList)
async def get_projects():
    projects_data = importer.list_projects()
    return {"projects": projects_data}

@router.post("/projects/link")
async def link_project(url: str):
    return importer.clone_repository(url)

@router.get("/projects/{project_id}/files")
async def get_project_files(project_id: str):
    # This is kept for compatibility if you need specific KiCanvas files
    pass 

@router.get("/projects/{project_id}/file/{file_path:path}")
async def get_file_by_path(project_id: str, file_path: str):
    """Serve a specific file by its path within the project."""
    full_path = importer.PROJECTS_DIR / project_id / file_path
    
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security check: ensure path is within project dir
    try:
        full_path.resolve().relative_to(importer.PROJECTS_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return FileResponse(full_path)

@router.get("/projects/{project_id}/tree")
async def get_project_tree(project_id: str):
    """Return file lists for specific output folders."""
    project_path = importer.PROJECTS_DIR / project_id
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    def list_files(subdir: str):
        sub_path = project_path / subdir
        if not sub_path.is_dir():
            return []
        # Return files relative to project root, e.g., "Design-Outputs/schematic.pdf"
        return [str(p.relative_to(project_path)) for p in sub_path.rglob("*") if p.is_file()]

    return {
        "design_outputs": list_files("Design-Outputs"),
        "manufacturing_outputs": list_files("Manufacturing-Outputs"),
        "docs": list_files("docs"),
        "simulations": list_files("simulations"),
    }

@router.post("/projects/{project_id}/build")
async def sync_and_build(project_id: str):
    # 1. Sync
    sync_result = importer.sync_repository(project_id)
    
    # 2. Build
    project_path = importer.PROJECTS_DIR / project_id
    jobset_path = project_path / "Outputs.kicad_jobset"
    
    if not jobset_path.is_file():
        # Soft failure: Sync worked, but no jobset to run
        return {"message": "Synced successfully. No 'Outputs.kicad_jobset' found to build."}
        
    try:
        # Check if kicad-cli exists
        if shutil.which("kicad-cli") is None:
             raise HTTPException(status_code=500, detail="kicad-cli not found on host server path.")

        cmd = f"kicad-cli jobset run {shlex.quote(str(jobset_path))}"
        
        # Run process
        result = subprocess.run(
            cmd, 
            shell=True, 
            cwd=str(project_path), 
            capture_output=True, 
            text=True
        )
        
        if result.returncode != 0:
            raise Exception(f"KiCAD CLI Error: {result.stderr}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Build failed: {str(e)}")
        
    return {"message": "Sync and build completed successfully"}