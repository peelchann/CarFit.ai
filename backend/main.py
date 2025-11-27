import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import replicate

# Debug logging
try:
    with open("backend_startup.log", "w") as f:
        f.write("Backend module loaded\n")
except Exception:
    pass

app = FastAPI(title="CarFit API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    image_url: str
    part_id: str
    prompt: str = "car with new wheels, cinematic lighting, 8k"

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "CarFit Backend"}

@app.get("/api/parts")
def get_parts():
    # Mock data for MVP
    return {
        "parts": [
            {
                "id": "wheel-01",
                "name": "Sport Rim X1",
                "category": "wheels",
                "price": 299,
                "image": "/parts/wheel-01.png"
            },
            {
                "id": "wheel-02",
                "name": "Classic Spoke",
                "category": "wheels",
                "price": 249,
                "image": "/parts/wheel-02.png"
            }
        ]
    }

@app.post("/api/generate")
async def generate_image(request: GenerateRequest):
    if not os.environ.get("REPLICATE_API_TOKEN"):
        # For MVP demo without key, return a mock
        return {
            "status": "mocked",
            "image_url": "https://replicate.delivery/pbxt/L02047.../out-0.png",
            "message": "REPLICATE_API_TOKEN not set, returning mock image."
        }
    
    try:
        # Using Stable Diffusion XL as a base model for now
        # In real app, this would be a specific ControlNet or Inpainting pipeline
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "prompt": request.prompt,
                "image": request.image_url,
                "strength": 0.75 # How much to respect original image
            }
        )
        # Output is usually a list of URLs
        return {"status": "success", "image_url": output[0]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    try:
        with open("backend_run.log", "w") as f:
            f.write("Starting uvicorn...\n")
        uvicorn.run(app, host="127.0.0.1", port=8000)
    except Exception as e:
        with open("backend_error.log", "w") as f:
            f.write(f"Error: {str(e)}\n")
