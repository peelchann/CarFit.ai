"""
CarFit Studio - API Backend (VroomRoom)
=======================================

AI-powered car customization using Gemini 3 Pro Image (Nano Banana Pro).

MODEL: gemini-3-pro-image-preview
SDK: google-genai (unified SDK for Google AI Studio and Vertex AI)

ENDPOINTS:
- GET  /api/health     - Health check
- GET  /api/parts      - Get all part categories and options
- POST /api/generate   - Generate AI preview image
- GET  /api/test-gemini - Test Gemini API connection
"""

import os
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Literal

# Try to import NEW Google GenAI SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None
    types = None

app = FastAPI(title="CarFit API", version="0.7.0")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ENVIRONMENT VARIABLES
# ============================================

# For Google AI Studio (simple API key auth)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# For Vertex AI (project-based auth) - optional
GOOGLE_CLOUD_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT_ID", "")
GOOGLE_CLOUD_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

# ============================================
# MODEL CONFIGURATION
# ============================================

# Gemini 3 Pro Image (Nano Banana Pro) - CORRECT MODEL ID
IMAGE_MODEL = "gemini-3-pro-image-preview"

# Fallback text model
TEXT_MODEL = "gemini-2.0-flash-exp"


# ============================================
# DATA MODELS
# ============================================

PartCategoryId = Literal['wrap', 'roof', 'body']

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
    car_image: str           # Base64 encoded car image (Image 1)
    part_image: str          # Base64 encoded part image (Image 2)
    part_name: str           # Name of the part
    part_category: str       # Category: wheels, roof, or body
    part_description: str    # Description of the part

class GenerateResponse(BaseModel):
    status: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    message: Optional[str] = None


# ============================================
# HARDCODED PARTS DATA
# ============================================

PART_CATEGORIES: List[PartCategory] = [
    PartCategory(id='wrap', label='Car Wraps', 
                 description='Transform your car with vinyl wraps.', icon='🎨'),
    PartCategory(id='roof', label='Roof Storage', 
                 description='Add roof boxes, racks, or baskets.', icon='📦'),
    PartCategory(id='body', label='Body Style Accent', 
                 description='Front lip, side skirts, or spoiler.', icon='🏎️'),
]

PART_OPTIONS: List[PartOption] = [
    # CAR WRAPS
    PartOption(id='wrap_matte_black_01', categoryId='wrap', name='Matte Black Wrap',
               description='Sleek matte black finish for a stealthy look.',
               imagePath='/parts/wrap/wrap_matte_black_01.png', price=2499),
    PartOption(id='wrap_satin_chrome_02', categoryId='wrap', name='Satin Chrome Silver',
               description='Mirror-like satin chrome for head-turning style.',
               imagePath='/parts/wrap/wrap_satin_chrome_02.png', price=3499),
    PartOption(id='wrap_color_shift_03', categoryId='wrap', name='Color Shift Purple-Blue',
               description='Chameleon wrap that shifts colors in the light.',
               imagePath='/parts/wrap/wrap_color_shift_03.png', price=3999),
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
# IMAGE GENERATION PROMPT - GEMINI 3 PRO (NANO BANANA PRO)
# ============================================
"""
PROMPT ENGINEERING FOR CAR CUSTOMIZATION
========================================

CORE PRINCIPLE: 
- Image 1 (user's car) = SACRED - never change angle, position, size, background
- Image 2 (part reference) = STYLE ONLY - extract appearance, ignore everything else

The AI must generate a photo that looks like Image 1 was edited, NOT like Image 2.
"""

def get_car_customization_prompt(part_name: str, part_category: str, ai_prompt_description: str) -> str:
    """
    Generate a precise prompt for Gemini 3 Pro Image (Nano Banana Pro).
    
    Args:
        part_name: Display name of the part (e.g., "Urban Camo")
        part_category: Category ID ('wrap', 'roof', 'body')
        ai_prompt_description: Detailed AI description (e.g., "wrapped in geometric camouflage...")
    
    The prompt uses the ai_prompt_description to tell Gemini exactly what modification to apply.
    """
    
    # Category-specific installation instructions
    category_instructions = {
        'wrap': {
            'task': 'Apply the vinyl wrap design to the car body',
            'where_to_apply': 'Cover ALL painted body panels: hood, roof, doors, fenders, bumpers, trunk. Follow every body line and contour.',
            'preserve': 'Keep windows transparent, headlights/taillights unchanged, wheels/tires unchanged, grille/badges/trim unchanged.',
            'lighting': 'Match wrap reflections to existing light direction. Matte = diffuse light, Gloss = sharp reflections.',
        },
        'roof': {
            'task': 'Install the roof accessory on top of the vehicle',
            'where_to_apply': 'Mount on the roof surface, centered horizontally, positioned appropriately front-to-back. Scale to match roof size.',
            'preserve': 'Keep entire car body, color, windows, lights, wheels exactly as in the original photo.',
            'lighting': 'Cast realistic shadow from accessory onto roof. Match shadow direction to existing shadows.',
        },
        'body': {
            'task': 'Install the body kit component on the vehicle',
            'where_to_apply': 'FRONT SPLITTER: bottom of front bumper. SIDE STEPS: along rocker panels. REAR WING: top rear of roof. Scale to match car dimensions.',
            'preserve': 'Keep car body color unchanged, all lights/windows/wheels unchanged.',
            'lighting': 'Add subtle shadow where component meets car body. Match reflections to existing light sources.',
        },
    }
    
    spec = category_instructions.get(part_category, category_instructions['body'])
    
    return f"""You are a professional automotive photo editor. Edit the customer's car photo.

=== STRICT RULES ===

IMAGE 1 (Customer's Car) is SACRED:
• SAME exact camera angle and perspective
• SAME exact car position, size, and framing in the photo
• SAME exact background, environment, ground surface
• SAME exact lighting direction and shadows
• SAME exact car make, model, and body shape
• The output MUST look like this specific photo was edited

IMAGE 2 (Part Reference) is for STYLE ONLY:
• IGNORE the camera angle
• IGNORE the car make/model shown
• IGNORE the background
• ONLY extract the visual appearance of the part

=== YOUR TASK ===

Modify the car in IMAGE 1 so it appears {ai_prompt_description}.

{spec['task']}:
• {spec['where_to_apply']}

Preserve unchanged:
• {spec['preserve']}

Lighting:
• {spec['lighting']}

=== OUTPUT REQUIREMENTS ===

Generate ONE photorealistic image where:
1. The car is the EXACT same vehicle from IMAGE 1
2. The car is in the EXACT same position/angle as IMAGE 1
3. The background is EXACTLY the same as IMAGE 1
4. The modification ({part_name}) is realistically applied as if professionally installed

DO NOT:
❌ Change the camera angle
❌ Change the car model
❌ Change the background
❌ Change the car's position or size in frame
❌ Show the reference car from IMAGE 2

Generate the edited photo now."""


# ============================================
# HELPER: Detect MIME type from base64 data
# ============================================

def detect_mime_type(base64_data: str) -> str:
    """Detect MIME type from base64 image data based on magic bytes."""
    try:
        decoded = base64.b64decode(base64_data[:32])
        if decoded[:4] == b'\x89PNG':
            return "image/png"
        elif decoded[:3] == b'\xff\xd8\xff':
            return "image/jpeg"
        elif decoded[:4] == b'RIFF' and len(decoded) > 11 and decoded[8:12] == b'WEBP':
            return "image/webp"
        else:
            return "image/png"
    except Exception:
        return "image/png"


# ============================================
# CORE: Generate car preview with Gemini 3 Pro Image
# ============================================

async def generate_car_preview(
    base_car_image: str,
    parts_image: str,
    prompt: str
) -> dict:
    """
    Generate an edited car image using Gemini 3 Pro Image (gemini-3-pro-image-preview).
    
    Uses the google-genai SDK with:
    - For API Key auth: genai.Client(api_key=...)
    - For Vertex AI: genai.Client(vertexai=True, project=..., location=...)
    
    Config includes response_modalities=['IMAGE'] for image generation.
    """
    
    if not GENAI_AVAILABLE:
        raise Exception("google-genai package not available. Install with: pip install google-genai")
    
    # Strip data URI prefix if present
    if base_car_image.startswith("data:"):
        base_car_image = base_car_image.split(",", 1)[1]
    if parts_image.startswith("data:"):
        parts_image = parts_image.split(",", 1)[1]
    
    # Detect MIME types
    car_mime_type = detect_mime_type(base_car_image)
    part_mime_type = detect_mime_type(parts_image)
    
    # Initialize client based on available credentials
    if GOOGLE_CLOUD_PROJECT_ID:
        # Use Vertex AI (project-based auth)
        client = genai.Client(
            vertexai=True,
            project=GOOGLE_CLOUD_PROJECT_ID,
            location=GOOGLE_CLOUD_LOCATION
        )
    elif GEMINI_API_KEY:
        # Use Google AI Studio (API key auth)
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        raise Exception("No credentials configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT_ID")
    
    # Build content parts - CAR IMAGE FIRST with explicit composition instructions
    contents = [
        {
            "role": "user",
            "parts": [
                {"text": "=== CUSTOMER'S CAR PHOTO (FIRST IMAGE) ===\nThis photo defines the OUTPUT composition. Keep this EXACT angle, background, and car shape:"},
                {
                    "inline_data": {
                        "mime_type": car_mime_type,
                        "data": base_car_image
                    }
                },
                {"text": "\n\n=== PART REFERENCE (SECOND IMAGE) ===\nONLY extract the part's appearance. IGNORE this image's angle/background/car model:"},
                {
                    "inline_data": {
                        "mime_type": part_mime_type,
                        "data": parts_image
                    }
                },
                {"text": f"\n\n{prompt}\n\nFINAL CHECK: Your output must have the SAME camera angle, background, and car shape as the FIRST IMAGE. Only the part appearance comes from the second image."}
            ]
        }
    ]
    
    # Generate with response_modalities=['IMAGE'] for image output
    response = client.models.generate_content(
        model=IMAGE_MODEL,
        contents=contents,
        config={
            "response_modalities": ["IMAGE"]
        }
    )
    
    # Extract the image from response
    candidates = response.candidates
    if not candidates or len(candidates) == 0:
        raise Exception("No candidates returned from model")
    
    # Find the image part in the response
    for part in candidates[0].content.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
            mime_type = part.inline_data.mime_type or "image/png"
            image_data = part.inline_data.data
            
            # Convert to base64 if it's bytes
            if isinstance(image_data, bytes):
                image_b64 = base64.b64encode(image_data).decode('utf-8')
            else:
                image_b64 = image_data
            
            return {
                "status": "success",
                "image_base64": f"data:{mime_type};base64,{image_b64}"
            }
        
        # Check for text response (fallback)
        if hasattr(part, 'text') and part.text:
            return {
                "status": "text_response",
                "message": part.text
            }
    
    raise Exception("No image data found in response")


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "CarFit Backend (VroomRoom)",
        "version": "0.7.0",
        "image_model": IMAGE_MODEL,
        "text_model": TEXT_MODEL,
        "genai_available": GENAI_AVAILABLE,
        "auth_mode": "vertex_ai" if GOOGLE_CLOUD_PROJECT_ID else ("api_key" if GEMINI_API_KEY else "none"),
        "project_id": GOOGLE_CLOUD_PROJECT_ID[:10] + "..." if GOOGLE_CLOUD_PROJECT_ID else None,
        "location": GOOGLE_CLOUD_LOCATION if GOOGLE_CLOUD_PROJECT_ID else None
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
    Generate a photorealistic car customization image using Gemini 3 Pro Image.
    
    Model: gemini-3-pro-image-preview (Nano Banana Pro)
    Config: response_modalities=['IMAGE']
    
    Returns generated image as base64 or error message.
    """
    
    if not GENAI_AVAILABLE:
        return GenerateResponse(
            status="error", 
            message="google-genai package not installed. Run: pip install google-genai"
        )
    
    if not GEMINI_API_KEY and not GOOGLE_CLOUD_PROJECT_ID:
        return GenerateResponse(
            status="demo",
            image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
            message="Demo mode: Configure GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT_ID for real AI generation."
        )
    
    try:
        # Generate the prompt
        prompt = get_car_customization_prompt(
            request.part_name,
            request.part_category,
            request.part_description
        )
        
        # Call Gemini 3 Pro Image
        result = await generate_car_preview(
            base_car_image=request.car_image,
            parts_image=request.part_image,
            prompt=prompt
        )
        
        if result["status"] == "success":
            return GenerateResponse(
                status="success",
                image_base64=result["image_base64"],
                message=f"Successfully generated {request.part_name} installation preview"
            )
        else:
            return GenerateResponse(
                status=result["status"],
                message=result.get("message", "Generation completed"),
                image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800"
            )
        
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini 3 Pro Image error: {error_msg}")
        
        # Handle specific errors
        if "429" in error_msg or "quota" in error_msg.lower():
            return GenerateResponse(
                status="rate_limited",
                message="Rate limit reached. Please wait a moment and try again."
            )
        
        if "404" in error_msg or "not found" in error_msg.lower():
            return GenerateResponse(
                status="model_unavailable",
                message=f"Model {IMAGE_MODEL} not available. Check Vertex AI API access and region.",
                image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800"
            )
        
        if "permission" in error_msg.lower() or "403" in error_msg:
            return GenerateResponse(
                status="permission_denied",
                message="Permission denied. Ensure Vertex AI API is enabled and service account has 'Vertex AI User' role."
            )
        
        if "400" in error_msg:
            return GenerateResponse(
                status="bad_request",
                message=f"API configuration error: {error_msg}"
            )
        
        return GenerateResponse(
            status="error",
            message=f"Generation failed: {error_msg}"
        )


@app.get("/api/test-gemini")
async def test_gemini():
    """Test Gemini API connection."""
    if not GENAI_AVAILABLE:
        return {"error": "google-genai package not installed. Run: pip install google-genai"}
    
    if not GEMINI_API_KEY and not GOOGLE_CLOUD_PROJECT_ID:
        return {"error": "No credentials configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT_ID"}
    
    try:
        # Initialize client
        if GOOGLE_CLOUD_PROJECT_ID:
            client = genai.Client(
                vertexai=True,
                project=GOOGLE_CLOUD_PROJECT_ID,
                location=GOOGLE_CLOUD_LOCATION
            )
            auth_mode = "vertex_ai"
        else:
            client = genai.Client(api_key=GEMINI_API_KEY)
            auth_mode = "api_key"
        
        # Test with text model first
        response = client.models.generate_content(
            model=TEXT_MODEL,
            contents=[{"role": "user", "parts": [{"text": "Say 'Gemini is ready!' in one sentence."}]}]
        )
        
        return {
            "status": "success",
            "auth_mode": auth_mode,
            "image_model": IMAGE_MODEL,
            "text_model": TEXT_MODEL,
            "test_response": response.candidates[0].content.parts[0].text if response.candidates else "No response"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


# Vercel serverless handler
