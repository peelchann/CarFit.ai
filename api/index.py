"""
CarFit Studio - API Backend (VroomRoom)
=======================================

AI-powered car customization using Gemini 2.0 Flash for image generation.

ENDPOINTS:
- GET  /api/health     - Health check
- GET  /api/parts      - Get all part categories and options
- POST /api/generate   - Generate AI preview image
- GET  /api/test-gemini - Test Gemini API connection

MODEL: gemini-2.0-flash (configurable to gemini-2.0-pro for higher quality)
"""

import os
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Literal

# Try to import Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    from google.generativeai.types import GenerationConfig
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    GenerationConfig = None

app = FastAPI(title="CarFit API", version="0.4.0")

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
# MODEL CONFIGURATION (Configurable)
# ============================================

# Default: gemini-2.0-flash for speed and cost
# Upgrade to: gemini-2.0-pro for higher quality
IMAGE_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.0-flash-exp")


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
    car_image: str      # Base64 encoded car image
    part_image: str     # Base64 encoded part image
    part_name: str      # Name of the part
    part_category: str  # Category: wheels, roof, or body
    part_description: str

class GenerateResponse(BaseModel):
    status: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    message: Optional[str] = None


# ============================================
# HARDCODED PARTS DATA
# ============================================

PART_CATEGORIES: List[PartCategory] = [
    PartCategory(id='wheels', label='Wheels & Rims', 
                 description='Change the design of your wheels.', icon='🛞'),
    PartCategory(id='roof', label='Roof Storage', 
                 description='Add roof boxes, racks, or baskets.', icon='📦'),
    PartCategory(id='body', label='Body Style Accent', 
                 description='Front lip, side skirts, or spoiler.', icon='🏎️'),
]

PART_OPTIONS: List[PartOption] = [
    # WHEELS
    PartOption(id='wheel_sport_black_01', categoryId='wheels', name='Sport Black Alloy',
               description='Aggressive black multi-spoke sports wheel.',
               imagePath='/parts/wheels/wheel_sport_black_01.png', price=299),
    PartOption(id='wheel_lux_silver_02', categoryId='wheels', name='Luxury Silver Multi-Spoke',
               description='Clean silver multi-spoke design for a premium look.',
               imagePath='/parts/wheels/wheel_lux_silver_02.png', price=349),
    PartOption(id='wheel_offroad_bronze_03', categoryId='wheels', name='Off-Road Bronze Deep Dish',
               description='Chunky off-road wheel in bronze finish.',
               imagePath='/parts/wheels/wheel_offroad_bronze_03.png', price=399),
    # ROOF
    PartOption(id='roof_box_black_01', categoryId='roof', name='Matte Black Roof Box',
               description='Sleek roof box for extra storage.',
               imagePath='/parts/roof/roof_box_black_01.png', price=449),
    PartOption(id='roof_rack_silver_02', categoryId='roof', name='Silver Roof Rack Rails',
               description='Low-profile roof rails for mounting gear.',
               imagePath='/parts/roof/roof_rack_silver_02.png', price=199),
    PartOption(id='roof_basket_black_03', categoryId='roof', name='Black Roof Basket',
               description='Open basket for camping and outdoor trips.',
               imagePath='/parts/roof/roof_basket_black_03.png', price=279),
    # BODY
    PartOption(id='body_frontlip_black_01', categoryId='body', name='Black Front Lip Spoiler',
               description='Low front lip to sharpen the front view.',
               imagePath='/parts/body/body_frontlip_black_01.png', price=189),
    PartOption(id='body_sideskirt_color_02', categoryId='body', name='Color-Matched Side Skirts',
               description='Side skirts that extend the body line.',
               imagePath='/parts/body/body_sideskirt_color_02.png', price=249),
    PartOption(id='body_spoiler_black_03', categoryId='body', name='Subtle Rear Roof Spoiler',
               description='Clean rear spoiler for a sportier silhouette.',
               imagePath='/parts/body/body_spoiler_black_03.png', price=179),
]


# ============================================
# IMAGE GENERATION PROMPT
# ============================================

def get_blend_prompt(part_name: str, part_category: str, part_description: str) -> str:
    """
    Generate prompt for blending the part onto the car realistically.
    """
    category_instructions = {
        'wheels': "Replace ALL visible wheels with the new wheel design. Match perspective, add realistic tire sidewalls, proper shadows under wheels.",
        'roof': "Mount the roof accessory centered on the car's roof. Follow roof curvature, add mounting hardware, apply proper shadows.",
        'body': "Integrate the body part seamlessly. For front lips: attach to bumper. For side skirts: along door panels. For spoilers: on trunk/roof edge."
    }
    
    instruction = category_instructions.get(part_category, category_instructions['body'])
    
    return f"""
Generate a photorealistic image of this car with the {part_name} installed.

TASK: Blend the {part_name} ({part_description}) onto the car from Image 1, using Image 2 as reference for the part's appearance.

{instruction}

REQUIREMENTS:
- Keep the car's original color, make, model, and background EXACTLY as in Image 1
- Match lighting, shadows, and reflections to the original photo
- The part should look factory-installed, not photoshopped
- Output a single high-quality photorealistic image
- Do NOT add text, watermarks, or labels
"""


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "CarFit Backend (VroomRoom)",
        "version": "0.4.0",
        "image_model": IMAGE_MODEL,
        "gemini_available": GEMINI_AVAILABLE,
        "gemini_configured": bool(GEMINI_API_KEY)
    }


@app.get("/api/categories")
def get_categories():
    return {"categories": [cat.model_dump() for cat in PART_CATEGORIES]}


@app.get("/api/parts")
def get_parts():
    return {
        "categories": [cat.model_dump() for cat in PART_CATEGORIES],
        "parts": [part.model_dump() for part in PART_OPTIONS]
    }


@app.get("/api/parts/{category_id}")
def get_parts_by_category(category_id: PartCategoryId):
    category = next((c for c in PART_CATEGORIES if c.id == category_id), None)
    if not category:
        raise HTTPException(status_code=404, detail=f"Category '{category_id}' not found")
    parts = [p for p in PART_OPTIONS if p.categoryId == category_id]
    return {"category": category.model_dump(), "parts": [p.model_dump() for p in parts]}


@app.post("/api/generate")
async def generate_image(request: GenerateRequest):
    """
    Generate a photorealistic car customization image.
    
    Uses Gemini multimodal model with:
    - Image 1: User's car photo
    - Image 2: Part to install
    - Text prompt: Blending instructions
    
    Returns generated image or analysis.
    """
    
    if not GEMINI_AVAILABLE:
        return GenerateResponse(status="error", message="Gemini AI package not available")
    
    if not GEMINI_API_KEY:
        return GenerateResponse(
            status="demo",
            image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
            message="Demo mode: Configure GEMINI_API_KEY for real AI generation."
        )
    
    try:
        # Initialize model - no response_mime_type for image generation
        # The model will return image data in the response parts
        model = genai.GenerativeModel(IMAGE_MODEL)
        
        # Prepare car image (Image 1)
        car_image_data = request.car_image
        if car_image_data.startswith("data:image"):
            _, car_image_data = car_image_data.split(",", 1)
        
        # Prepare part image (Image 2)
        part_image_data = request.part_image
        if part_image_data.startswith("data:image"):
            _, part_image_data = part_image_data.split(",", 1)
        
        # Create image parts for the API
        car_image_part = {"mime_type": "image/jpeg", "data": car_image_data}
        part_image_part = {"mime_type": "image/png", "data": part_image_data}
        
        # Generate the blending prompt
        prompt = get_blend_prompt(
            request.part_name, 
            request.part_category, 
            request.part_description
        )
        
        # Call Gemini with both images and prompt
        response = model.generate_content([
            "Image 1 (Car to modify):",
            car_image_part,
            "Image 2 (Part to install):",
            part_image_part,
            prompt
        ])
        
        # Process response
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            
            # Check for generated image in response
            for part in candidate.content.parts:
                # If model returns image data
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_data = part.inline_data.data
                    mime_type = part.inline_data.mime_type or "image/png"
                    image_b64 = base64.b64encode(image_data).decode('utf-8')
                    
                    return GenerateResponse(
                        status="success",
                        image_base64=f"data:{mime_type};base64,{image_b64}",
                        message=f"Generated {request.part_name} installation preview"
                    )
                
                # If model returns text (description of what it would generate)
                if hasattr(part, 'text') and part.text:
                    return GenerateResponse(
                        status="text_response",
                        message=part.text,
                        image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800"
                    )
        
        return GenerateResponse(
            status="no_output",
            message="Model did not return expected output. Try again."
        )
        
    except Exception as e:
        error_msg = str(e)
        print(f"Generation error: {error_msg}")
        
        if "429" in error_msg or "quota" in error_msg.lower():
            return GenerateResponse(status="rate_limited", message="Rate limit reached. Please wait and try again.")
        
        if "400" in error_msg:
            return GenerateResponse(status="bad_request", message=f"API error: {error_msg}")
        
        return GenerateResponse(status="error", message=f"Generation failed: {error_msg}")


@app.get("/api/test-gemini")
async def test_gemini():
    """Test Gemini API connection."""
    if not GEMINI_AVAILABLE:
        return {"error": "google-generativeai package not installed"}
    
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not configured"}
    
    try:
        model = genai.GenerativeModel(IMAGE_MODEL)
        response = model.generate_content("Say 'Gemini is ready!' in one short sentence.")
        
        return {
            "status": "success",
            "model": IMAGE_MODEL,
            "response": response.text if hasattr(response, 'text') else "Model ready"
        }
    except Exception as e:
        return {"status": "error", "model": IMAGE_MODEL, "error": str(e)}


# Vercel serverless handler
