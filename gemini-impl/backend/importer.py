import os
import shutil
import zipfile
import tarfile
from fastapi import UploadFile, HTTPException
from pathlib import Path
import uuid
import logging
from git import Repo, GitCommandError
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure absolute path for robustness
BASE_DIR = Path(__file__).parent.parent
PROJECTS_DIR = BASE_DIR / "data" / "projects"
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

async def save_project_archive(file: UploadFile) -> str:
    project_id = str(uuid.uuid4())
    project_path = PROJECTS_DIR / project_id
    
    try:
        # Create temporary file
        temp_path = project_path.with_suffix(".tmp")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract
        project_path.mkdir(exist_ok=True)
        
        if file.filename.endswith(".zip"):
            with zipfile.ZipFile(temp_path, 'r') as zip_ref:
                zip_ref.extractall(project_path)
        elif file.filename.endswith((".tar", ".tar.gz")):
            with tarfile.open(temp_path, 'r') as tar_ref:
                tar_ref.extractall(project_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
        os.remove(temp_path)
        return project_id
        
    except Exception as e:
        if project_path.exists():
            shutil.rmtree(project_path)
        if temp_path.exists():
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process archive: {str(e)}")

def clone_repository(repo_url: str) -> dict:
    project_id = str(uuid.uuid4())
    project_path = PROJECTS_DIR / project_id
    
    try:
        logger.info(f"Cloning repository: {repo_url}")
        Repo.clone_from(repo_url, project_path)
        
        # Determine name
        name = project_id
        for item in project_path.rglob("*.kicad_pro"):
            name = item.stem
            break
        
        return {
            "id": project_id,
            "name": name,
            "repository_url": repo_url,
            "sync_status": "success",
        }
        
    except GitCommandError as e:
        if project_path.exists():
            shutil.rmtree(project_path)
        raise HTTPException(status_code=400, detail=f"Git Error: {e.stderr if hasattr(e, 'stderr') else str(e)}")
    except Exception as e:
        if project_path.exists():
            shutil.rmtree(project_path)
        raise HTTPException(status_code=500, detail=f"Clone failed: {str(e)}")

def sync_repository(project_id: str) -> dict:
    project_path = PROJECTS_DIR / project_id
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        repo = Repo(project_path)
        repo.remotes.origin.pull()
        return {"id": project_id, "sync_status": "success"}
    except Exception as e:
        logger.error(f"Sync error: {e}")
        return {"id": project_id, "sync_status": "error", "error_message": str(e)}

def list_projects():
    projects = []
    if not PROJECTS_DIR.exists():
        return []
        
    for project_id in os.listdir(PROJECTS_DIR):
        path = PROJECTS_DIR / project_id
        if path.is_dir():
            name = project_id
            for item in path.rglob("*.kicad_pro"):
                name = item.stem
                break
            
            is_git_repo = (path / ".git").exists()
            
            # Find thumbnail in assets/
            thumbnail_url = None
            assets_dir = path / "assets"
            if assets_dir.is_dir():
                png_files = list(assets_dir.rglob("*.png"))
                if png_files:
                    # Return relative path for API usage
                    thumbnail_url = str(png_files[0].relative_to(path))
            
            projects.append({
                "id": project_id,
                "name": name,
                "path": str(path),
                "is_git_repo": is_git_repo,
                "thumbnail_url": thumbnail_url,
                "sync_status": "success" # Default
            })
    return projects