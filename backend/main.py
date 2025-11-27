import os
import sys
import base64
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Try to import Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not installed. Run: pip install google-generativeai")

# Try to import Replicate as fallback
try:
    import replicate
    REPLICATE_AVAILABLE = True
except ImportError:
    REPLICATE_AVAILABLE = False

app = FastAPI(title="CarFit API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API if key is available
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAp5Tjw7_qH8h_TzpPbEJaW9yhYNa0HpR0")
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class GenerateRequest(BaseModel):
    image_url: str  # Can be base64 data URI or URL
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
        "gemini_configured": bool(GEMINI_API_KEY),
        "replicate_available": REPLICATE_AVAILABLE
    }

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
    """
    Generate an AI image using Google Gemini (Nano Banana Pro) or Replicate as fallback.
    
    The image_url can be:
    - A base64 data URI (data:image/jpeg;base64,...)
    - A public URL to an image
    """
    
    # Try Gemini first (Nano Banana Pro)
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            # Use Gemini's image generation model
            # Note: Gemini 2.0 Flash has image generation capabilities
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Create a detailed prompt for car customization
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
            
            # If the image is a base64 data URI, extract the image data
            if request.image_url.startswith("data:image"):
                # Extract base64 data
                header, base64_data = request.image_url.split(",", 1)
                image_bytes = base64.b64decode(base64_data)
                
                # Create image part for Gemini
                image_part = {
                    "mime_type": "image/jpeg",
                    "data": base64_data
                }
                
                # Generate with image context
                response = model.generate_content([
                    full_prompt,
                    image_part
                ])
            else:
                # For URL-based images, just use the prompt
                response = model.generate_content(full_prompt)
            
            # Note: Gemini 2.0 Flash can generate images, but the response format
            # may vary. For now, we'll return the text response.
            # In production, you'd use the Imagen API for actual image generation.
            
            return GenerateResponse(
                status="gemini_response",
                message=response.text if hasattr(response, 'text') else "Image generation initiated",
                image_url=None  # Gemini text model doesn't return images directly
            )
            
        except Exception as e:
            print(f"Gemini error: {str(e)}")
            # Fall through to Replicate or mock
    
    # Try Replicate as fallback
    if REPLICATE_AVAILABLE and os.environ.get("REPLICATE_API_TOKEN"):
        try:
            output = replicate.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input={
                    "prompt": request.prompt,
                    "image": request.image_url,
                    "strength": 0.75
                }
            )
            return GenerateResponse(
                status="success",
                image_url=output[0] if output else None
            )
        except Exception as e:
            print(f"Replicate error: {str(e)}")
    
    # Return mock response if no AI service is available
    return GenerateResponse(
        status="mocked",
        image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
        message="Demo mode: Using placeholder image. Configure GEMINI_API_KEY or REPLICATE_API_TOKEN for real AI generation."
    )

@app.get("/api/test-gemini")
async def test_gemini():
    """Test endpoint to verify Gemini API connection"""
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

if __name__ == "__main__":
    print("Starting CarFit Backend...")
    print(f"Gemini Available: {GEMINI_AVAILABLE}")
    print(f"Gemini API Key Set: {bool(GEMINI_API_KEY)}")
    print(f"Replicate Available: {REPLICATE_AVAILABLE}")
    uvicorn.run(app, host="127.0.0.1", port=8000)
