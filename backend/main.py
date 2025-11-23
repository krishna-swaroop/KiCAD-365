from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import projects  # Import locally from the same folder

app = FastAPI(title="KiCAD-365 API", version="1.0.0")

# CORS configuration to allow the React Frontend
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://192.168.1.55:5173/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local network access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount the data directory to serve images/files directly if needed (optional security risk in prod)
# app.mount("/data", StaticFiles(directory="data"), name="data")

app.include_router(projects.router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "online", "system": "KiCAD Project Manager"}