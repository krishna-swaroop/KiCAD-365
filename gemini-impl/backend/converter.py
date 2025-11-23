"""
STEP to GLB Converter for KiCAD 3D Models
Converts STEP files to GLB format using kicad-cli for web viewing
"""
import subprocess
import shlex
from pathlib import Path
import hashlib

def get_cache_path(step_file_path: Path) -> Path:
    """Generate a cache path for the GLB file based on STEP file hash"""
    # Use project directory / .cache / filename.glb
    cache_dir = step_file_path.parent.parent / ".cache" / "3d-models"
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename based on original name
    glb_filename = step_file_path.stem + ".glb"
    return cache_dir / glb_filename

def convert_step_to_glb(pcb_file_path: Path, output_glb_path: Path) -> bool:
    """
    Convert PCB to GLB using kicad-cli.
    Returns True if successful, False otherwise.
    """
    try:
        cmd = [
            "kicad-cli", "pcb", "export", "glb",
            "--output", str(output_glb_path),
            str(pcb_file_path)
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 60 second timeout
        )
        
        if result.returncode == 0 and output_glb_path.exists():
            return True
        else:
            print(f"GLB export failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("GLB conversion timed out")
        return False
    except Exception as e:
        print(f"GLB conversion error: {str(e)}")
        return False

def convert_step_to_vrml(pcb_file_path: Path, output_vrml_path: Path) -> bool:
    """
    Fallback: Convert PCB to VRML using kicad-cli.
    Returns True if successful, False otherwise.
    """
    try:
        cmd = [
            "kicad-cli", "pcb", "export", "vrml",
            "--output", str(output_vrml_path),
            str(pcb_file_path)
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0 and output_vrml_path.exists():
            return True
        else:
            print(f"VRML export failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"VRML conversion error: {str(e)}")
        return False

def get_3d_model(pcb_file_path: Path) -> Path | None:
    """
    Get GLB model for a KiCAD PCB file.
    Converts if needed, uses cache if available.
    Returns path to GLB file or None if conversion failed.
    """
    if not pcb_file_path.exists():
        return None
    
    # Check cache first
    cache_glb_path = get_cache_path(pcb_file_path)
    
    # If cached GLB exists and is newer than source, return it
    if cache_glb_path.exists():
        if cache_glb_path.stat().st_mtime > pcb_file_path.stat().st_mtime:
            return cache_glb_path
    
    # Convert to GLB
    if convert_step_to_glb(pcb_file_path, cache_glb_path):
        return cache_glb_path
    
    # Fallback to VRML (not implemented for Three.js yet)
    # vrml_path = cache_glb_path.with_suffix('.wrl')
    # if convert_step_to_vrml(pcb_file_path, vrml_path):
    #     return vrml_path
    
    return None
