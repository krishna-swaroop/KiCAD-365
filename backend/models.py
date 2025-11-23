from pydantic import BaseModel
from typing import Optional, List

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class Project(BaseModel):
    id: str
    path: str
    name: str
    description: Optional[str] = None
    is_git_repo: bool
    thumbnail_url: Optional[str] = None
    sync_status: Optional[str] = "unknown"

    class Config:
        from_attributes = True

class ProjectList(BaseModel):
    projects: List[Project]