"""
CarFit Studio - API Backend
===========================

This is the FastAPI backend for CarFit Studio (VroomRoom).
Deployed as a Vercel Serverless Function.

ENDPOINTS:
- GET  /api/health     - Health check
- GET  /api/parts      - Get all part categories and options
- GET  /api/categories - Get part categories only
- POST /api/generate   - Generate AI preview image
- GET  /api/test-gemini - Test Gemini API connection
"""

import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Literal

# Try to import Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

app = FastAPI(title="CarFit API", version="0.2.0")

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


# ============================================
# DATA MODELS
# ============================================

PartCategoryId = Literal['wheels', 'roof', 'body']

class PartCategory(BaseModel):
    id: PartCategoryId
    label: str
    description: str
    icon: str

class PartOption(BaseModel):
    id: str
    categoryId: PartCategoryId
    name: str
    description: str
    imagePath: str
    price: int

class GenerateRequest(BaseModel):
    image_url: str
    part_id: str  # Can be comma-separated for multiple parts
    prompt: str = "car customization, photorealistic, 8k"

class GenerateResponse(BaseModel):
    status: str
    image_url: Optional[str] = None
    message: Optional[str] = None


# ============================================
# HARDCODED DATA
# These match the frontend constants in /lib/parts-data.ts
# ============================================

PART_CATEGORIES: List[PartCategory] = [
    PartCategory(
        id='wheels',
        label='Wheels & Rims',
        description='Change the design of your wheels.',
        icon='🛞'
    ),
    PartCategory(
        id='roof',
        label='Roof Storage',
        description='Add roof boxes, racks, or baskets.',
        icon='📦'
    ),
    PartCategory(
        id='body',
        label='Body Style Accent',
        description='Front lip, side skirts, or spoiler.',
        icon='🏎️'
    ),
]

PART_OPTIONS: List[PartOption] = [
    # ==========================================
    # WHEELS - 3 options
    # ==========================================
    PartOption(
        id='wheel_sport_black_01',
        categoryId='wheels',
        name='Sport Black Alloy',
        description='Aggressive black multi-spoke sports wheel.',
        imagePath='/parts/wheels/wheel_sport_black_01.png',
        price=299
    ),
    PartOption(
        id='wheel_lux_silver_02',
        categoryId='wheels',
        name='Luxury Silver Multi-Spoke',
        description='Clean silver multi-spoke design for a premium look.',
        imagePath='/parts/wheels/wheel_lux_silver_02.png',
        price=349
    ),
    PartOption(
        id='wheel_offroad_bronze_03',
        categoryId='wheels',
        name='Off-Road Bronze Deep Dish',
        description='Chunky off-road wheel in bronze finish.',
        imagePath='/parts/wheels/wheel_offroad_bronze_03.png',
        price=399
    ),

    # ==========================================
    # ROOF STORAGE - 3 options
    # ==========================================
    PartOption(
        id='roof_box_black_01',
        categoryId='roof',
        name='Matte Black Roof Box',
        description='Sleek roof box for extra storage.',
        imagePath='/parts/roof/roof_box_black_01.png',
        price=449
    ),
    PartOption(
        id='roof_rack_silver_02',
        categoryId='roof',
        name='Silver Roof Rack Rails',
        description='Low-profile roof rails for mounting gear.',
        imagePath='/parts/roof/roof_rack_silver_02.png',
        price=199
    ),
    PartOption(
        id='roof_basket_black_03',
        categoryId='roof',
        name='Black Roof Basket',
        description='Open basket for camping and outdoor trips.',
        imagePath='/parts/roof/roof_basket_black_03.png',
        price=279
    ),

    # ==========================================
    # BODY STYLE ACCENT - 3 options
    # ==========================================
    PartOption(
        id='body_frontlip_black_01',
        categoryId='body',
        name='Black Front Lip Spoiler',
        description='Low front lip to sharpen the front view.',
        imagePath='/parts/body/body_frontlip_black_01.png',
        price=189
    ),
    PartOption(
        id='body_sideskirt_color_02',
        categoryId='body',
        name='Color-Matched Side Skirts',
        description='Side skirts that extend the body line.',
        imagePath='/parts/body/body_sideskirt_color_02.png',
        price=249
    ),
    PartOption(
        id='body_spoiler_black_03',
        categoryId='body',
        name='Subtle Rear Roof Spoiler',
        description='Clean rear spoiler for a sportier silhouette.',
        imagePath='/parts/body/body_spoiler_black_03.png',
        price=179
    ),
]


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "CarFit Backend",
        "version": "0.2.0",
        "gemini_available": GEMINI_AVAILABLE,
        "gemini_configured": bool(GEMINI_API_KEY)
    }


@app.get("/api/categories")
def get_categories():
    """Get all part categories."""
    return {
        "categories": [cat.model_dump() for cat in PART_CATEGORIES]
    }


@app.get("/api/parts")
def get_parts():
    """
    Get all part options grouped by category.
    
    Returns both categories and parts for easy frontend consumption.
    """
    return {
        "categories": [cat.model_dump() for cat in PART_CATEGORIES],
        "parts": [part.model_dump() for part in PART_OPTIONS]
    }


@app.get("/api/parts/{category_id}")
def get_parts_by_category(category_id: PartCategoryId):
    """Get parts for a specific category."""
    category = next((c for c in PART_CATEGORIES if c.id == category_id), None)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{category_id}' not found")
    
    parts = [p for p in PART_OPTIONS if p.categoryId == category_id]
    return {
        "category": category.model_dump(),
        "parts": [p.model_dump() for p in parts]
    }


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """
    Generate an AI preview image using Google Gemini.
    
    In demo mode (no API key), returns a placeholder image.
    """
    
    if GEMINI_AVAILABLE and GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            full_prompt = f"""
            You are an expert automotive visualization AI. 
            Generate a photorealistic image of a car with the following modifications:
            
            {request.prompt}
            
            Requirements:
            - Maintain the original car's body shape and color
            - Apply the modifications realistically
            - Match lighting and perspective of the original photo
            - High quality, 8K resolution appearance
            - Cinematic automotive photography style
            - Professional car magazine quality
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
            # Fall through to demo response
    
    # Return demo response when Gemini is not available
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
