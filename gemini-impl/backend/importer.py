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

# ... existing setup code ...
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
PROJECTS_DIR = BASE_DIR / "data" / "projects"
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

# ... existing save_project_archive ...
async def save_project_archive(file: UploadFile) -> str:
    project_id = str(uuid.uuid4())
    project_path = PROJECTS_DIR / project_id
    
    try:
        # Create temporary file to store upload
        temp_path = project_path.with_suffix(".tmp")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract archive
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

# ... existing clone_repository ...
def clone_repository(repo_url: str) -> dict:
    project_id = str(uuid.uuid4())
    project_path = PROJECTS_DIR / project_id
    
    try:
        logger.info(f"Cloning repository: {repo_url}")
        Repo.clone_from(repo_url, project_path)
        
        # Extract name from URL for immediate return
        name = repo_url.rstrip('/').split('/')[-1]
        if name.endswith('.git'):
            name = name[:-4]
            
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

# ... existing sync_repository ...
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

# ... existing list_projects ...
def list_projects():
    projects = []
    if not PROJECTS_DIR.exists():
        return []
        
    for project_id in os.listdir(PROJECTS_DIR):
        path = PROJECTS_DIR / project_id
        if path.is_dir():
            # Default to project_id
            name = project_id
            is_git_repo = (path / ".git").exists()
            
            # Strategy 1: Try to get name from Git Remote URL (Highest Priority)
            if is_git_repo:
                try:
                    repo = Repo(path)
                    url = repo.remotes.origin.url
                    # Extract last part of URL
                    git_name = url.rstrip('/').split('/')[-1]
                    if git_name.endswith('.git'):
                        git_name = git_name[:-4]
                    name = git_name
                except Exception:
                    # Fallback if git config is unreadable
                    pass
            
            # Strategy 2: If not a git repo (or failed), try .kicad_pro file
            if name == project_id: 
                for item in path.rglob("*.kicad_pro"):
                    name = item.stem
                    break
            
            # UPDATED LOGIC: Find thumbnail in assets/renders/thumbnail-*.png
            thumbnail_url = None
            renders_dir = path / "assets" / "renders"
            
            if renders_dir.is_dir():
                png_files = list(renders_dir.glob("thumbnail-*.png"))
                if not png_files:
                     png_files = list(renders_dir.glob("*.png"))
                
                if not png_files:
                    assets_dir = path / "assets"
                    if assets_dir.is_dir():
                        png_files = list(assets_dir.glob("*.png"))

                if png_files:
                    thumbnail_url = str(png_files[0].relative_to(path))
            
            projects.append({
                "id": project_id,
                "name": name,
                "path": str(path),
                "is_git_repo": is_git_repo,
                "thumbnail_url": thumbnail_url,
                "sync_status": "success" 
            })
    return projects

def delete_project(project_id: str):
    """Permanently delete a project from the filesystem."""
    project_path = PROJECTS_DIR / project_id
    if not project_path.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        shutil.rmtree(project_path)
        logger.info(f"Deleted project: {project_id}")
        return {"message": "Project deleted successfully", "id": project_id}
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")