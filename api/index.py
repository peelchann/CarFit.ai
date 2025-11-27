import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

# Try to import Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

app = FastAPI(title="CarFit API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class GenerateRequest(BaseModel):
    image_url: str
    part_id: str
    prompt: str = "car with new wheels, cinematic lighting, 8k"

class GenerateResponse(BaseModel):
    status: str
    image_url: Optional[str] = None
    message: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "CarFit Backend",
        "gemini_available": GEMINI_AVAILABLE,
        "gemini_configured": bool(GEMINI_API_KEY)
    }

@app.get("/api/parts")
def get_parts():
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
            },
            {
                "id": "wheel-03",
                "name": "Obsidian Black",
                "category": "wheels",
                "price": 399,
                "image": "/parts/wheel-03.png"
            },
            {
                "id": "wheel-04",
                "name": "Racing Gold",
                "category": "wheels",
                "price": 449,
                "image": "/parts/wheel-04.png"
            }
        ]
    }

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """Generate an AI image using Google Gemini."""
    
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            full_prompt = f"""
            You are an expert automotive visualization AI. 
            Generate a photorealistic image of a car with the following modifications:
            
            {request.prompt}
            
            Requirements:
            - Maintain the original car's body shape and color
            - Apply the new wheels/parts realistically
            - Match lighting and perspective
            - High quality, 8K resolution appearance
            - Cinematic automotive photography style
            """
            
            if request.image_url.startswith("data:image"):
                header, base64_data = request.image_url.split(",", 1)
                image_part = {
                    "mime_type": "image/jpeg",
                    "data": base64_data
                }
                response = model.generate_content([full_prompt, image_part])
            else:
                response = model.generate_content(full_prompt)
            
            return GenerateResponse(
                status="gemini_response",
                message=response.text if hasattr(response, 'text') else "Image generation initiated",
                image_url=None
            )
            
        except Exception as e:
            print(f"Gemini error: {str(e)}")
    
    # Return demo response
    return GenerateResponse(
        status="demo",
        image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
        message="Demo mode: Configure GEMINI_API_KEY for real AI generation."
    )

@app.get("/api/test-gemini")
async def test_gemini():
    """Test Gemini API connection."""
    if not GEMINI_AVAILABLE:
        return {"error": "google-generativeai package not installed"}
    
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not configured"}
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content("Say 'Hello from Gemini!' in one sentence.")
        return {
            "status": "success",
            "response": response.text,
            "model": "gemini-2.0-flash-exp"
        }
    except Exception as e:
        return {"error": str(e)}

# Vercel handler - export the FastAPI app directly
# Vercel's @vercel/python runtime handles FastAPI natively
