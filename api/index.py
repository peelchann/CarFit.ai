"""
CarFit Studio - API Backend (VroomRoom)
=======================================

AI-powered car customization using Nano Banana Pro (Gemini 3 Pro Image).

MODEL: gemini-3-pro-image-preview
- Inputs: Text + Images (up to 14 images, 7MB each)
- Outputs: Text + Image
- Max input tokens: 65,536
- Max output tokens: 32,768
- Supported: image/png, image/jpeg, image/webp, image/heic, image/heif

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

# Try to import Google Generative AI (Gemini)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

app = FastAPI(title="CarFit API", version="0.5.0")

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
# MODEL CONFIGURATION
# ============================================

# Nano Banana Pro - Gemini 3 Pro Image Preview
# This is the correct model ID for image generation
NANO_BANANA_PRO_MODEL = "gemini-3-pro-image-preview"

# Fallback text model if image model unavailable
FALLBACK_TEXT_MODEL = "gemini-2.0-flash-exp"

# Default image generation settings
DEFAULT_ASPECT_RATIO = "16:9"  # Options: 1:1, 3:2, 2:3, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
DEFAULT_IMAGE_SIZE = "2K"      # Options: 1K, 2K, 4K


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
    car_image: str           # Base64 encoded car image (Image 1)
    part_image: str          # Base64 encoded part image (Image 2)
    part_name: str           # Name of the part
    part_category: str       # Category: wheels, roof, or body
    part_description: str    # Description of the part
    aspect_ratio: Optional[str] = None  # e.g., "16:9"
    image_size: Optional[str] = None    # e.g., "2K"

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

def get_car_customization_prompt(part_name: str, part_category: str, part_description: str) -> str:
    """
    Generate the prompt for Nano Banana Pro to blend the part onto the car.
    
    Following the AI_Image_Generation_Spec.md requirements:
    - Same car color, make, model as Image 1
    - Same background
    - Matched lighting and shadows
    - Seamless integration (factory-installed look)
    - Single output image
    """
    
    category_instructions = {
        'wheels': """
WHEEL INSTALLATION:
- Replace ALL visible wheels on the car with the wheel design from Image 2
- Maintain correct wheel size proportions relative to the car
- Add realistic tire sidewalls around the new wheels
- Match the wheel orientation and angle to the car's perspective
- Apply realistic shadows under the wheels touching the ground
- Ensure proper wheel well fitment - wheels sit naturally in the fenders
""",
        'roof': """
ROOF INSTALLATION:
- Mount the roof accessory from Image 2 onto the car's roof
- Position it centered on the roof, properly aligned with the car's body lines
- Add realistic mounting hardware (roof rails, crossbars) if needed
- Ensure the accessory follows the roof's curvature naturally
- Apply proper shadows where the accessory meets the roof
- Maintain correct scale - the accessory should look proportional to the car
""",
        'body': """
BODY KIT INSTALLATION:
- Integrate the body styling part from Image 2 seamlessly onto the car
- For front lips: attach to the bottom edge of the front bumper
- For side skirts: extend along the lower door panels
- For spoilers: mount on the rear trunk lid or roof edge
- Match the part's color to the car OR keep it black/carbon fiber as shown
- Ensure smooth transitions between the part and existing body panels
- Add realistic shadows and reflections on the new part
"""
    }
    
    instruction = category_instructions.get(part_category, category_instructions['body'])
    
    return f"""You are an advanced car customization editor powered by Nano Banana Pro.

TASK: Generate a single photorealistic image showing the car from Image 1 with the {part_name} from Image 2 professionally installed.

PART DETAILS:
- Part Name: {part_name}
- Category: {part_category}
- Description: {part_description}

{instruction}

CRITICAL REQUIREMENTS (from AI_Image_Generation_Spec.md):
1. PRESERVE THE CAR: Keep the car's make, model, color, and all features EXACTLY as in Image 1
2. PRESERVE BACKGROUND: Do NOT change the environment or background
3. MATCH LIGHTING: The installed part must have identical lighting direction and intensity
4. MATCH PERSPECTIVE: The part must follow the exact camera angle of the car
5. REALISTIC SHADOWS: Add shadows that match existing shadows in the scene
6. SEAMLESS INTEGRATION: The part should look factory-installed, not photoshopped
7. HIGH QUALITY: Output a single high-resolution photorealistic image

DO NOT:
- Change the car's color, shape, or any features
- Add text, watermarks, or labels
- Show the part separately - it must be installed on the car
- Create multiple images or before/after comparisons
- Add any elements not in the original scene

OUTPUT: A single clean, photorealistic image of the customized car."""


# ============================================
# HELPER: Detect MIME type from base64 data
# ============================================

def detect_mime_type(base64_data: str) -> str:
    """
    Detect MIME type from base64 image data based on magic bytes.
    Defaults to image/png if unable to detect.
    """
    try:
        # Decode first few bytes to check magic numbers
        decoded = base64.b64decode(base64_data[:32])
        
        # PNG: 89 50 4E 47
        if decoded[:4] == b'\x89PNG':
            return "image/png"
        # JPEG: FF D8 FF
        elif decoded[:3] == b'\xff\xd8\xff':
            return "image/jpeg"
        # WebP: 52 49 46 46 ... 57 45 42 50
        elif decoded[:4] == b'RIFF' and decoded[8:12] == b'WEBP':
            return "image/webp"
        # HEIC/HEIF: Check for ftyp box
        elif b'ftyp' in decoded[:12]:
            return "image/heic"
        else:
            return "image/png"  # Default
    except Exception:
        return "image/png"  # Default on error


# ============================================
# CORE: Generate car preview with Nano Banana Pro
# ============================================

async def generate_car_preview_with_nano_banana_pro(
    base_car_image: str,
    parts_image: str,
    prompt: str,
    aspect_ratio: str = DEFAULT_ASPECT_RATIO,
    image_size: str = DEFAULT_IMAGE_SIZE
) -> dict:
    """
    Generate an edited car image using Nano Banana Pro (gemini-3-pro-image-preview).
    
    Args:
        base_car_image: Base64 encoded car photo
        parts_image: Base64 encoded part image
        prompt: Text prompt for the generation
        aspect_ratio: Output aspect ratio (e.g., "16:9")
        image_size: Output size ("1K", "2K", "4K")
    
    Returns:
        dict with status, image_base64 or message
    """
    
    if not GEMINI_AVAILABLE or not genai:
        raise Exception("Gemini AI package not available")
    
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY not configured")
    
    # Strip data URI prefix if present
    if base_car_image.startswith("data:"):
        base_car_image = base_car_image.split(",", 1)[1]
    if parts_image.startswith("data:"):
        parts_image = parts_image.split(",", 1)[1]
    
    # Detect MIME types
    car_mime_type = detect_mime_type(base_car_image)
    part_mime_type = detect_mime_type(parts_image)
    
    # Initialize the Nano Banana Pro model
    model = genai.GenerativeModel(NANO_BANANA_PRO_MODEL)
    
    # Build the content parts
    contents = [
        # Text prompt first
        {"text": prompt},
        # Image 1: Base car photo
        {
            "inline_data": {
                "mime_type": car_mime_type,
                "data": base_car_image
            }
        },
        # Image 2: Part to install
        {
            "inline_data": {
                "mime_type": part_mime_type,
                "data": parts_image
            }
        }
    ]
    
    # Generation config with imageConfig for image output
    # NOTE: Do NOT set response_mime_type for image generation
    generation_config = {
        "image_config": {
            "aspect_ratio": aspect_ratio,
            "image_size": image_size
        }
    }
    
    # Call the model
    response = model.generate_content(
        contents=contents,
        generation_config=generation_config
    )
    
    # Process response - look for image in parts
    if response.candidates and len(response.candidates) > 0:
        candidate = response.candidates[0]
        
        for part in candidate.content.parts:
            # Check for inline image data
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
            
            # If text response (fallback)
            if hasattr(part, 'text') and part.text:
                return {
                    "status": "text_response",
                    "message": part.text
                }
    
    raise Exception("Model did not return an image. Try a different prompt or images.")


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "CarFit Backend (VroomRoom)",
        "version": "0.5.0",
        "model": NANO_BANANA_PRO_MODEL,
        "fallback_model": FALLBACK_TEXT_MODEL,
        "gemini_available": GEMINI_AVAILABLE,
        "gemini_configured": bool(GEMINI_API_KEY),
        "default_aspect_ratio": DEFAULT_ASPECT_RATIO,
        "default_image_size": DEFAULT_IMAGE_SIZE
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
    Generate a photorealistic car customization image using Nano Banana Pro.
    
    Uses gemini-3-pro-image-preview with:
    - Image 1: User's car photo (base64)
    - Image 2: Part to install (base64)
    - Text prompt: Blending instructions
    - imageConfig: aspectRatio and imageSize
    
    Returns generated image as base64 or error message.
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
        # Generate the prompt
        prompt = get_car_customization_prompt(
            request.part_name,
            request.part_category,
            request.part_description
        )
        
        # Call Nano Banana Pro
        result = await generate_car_preview_with_nano_banana_pro(
            base_car_image=request.car_image,
            parts_image=request.part_image,
            prompt=prompt,
            aspect_ratio=request.aspect_ratio or DEFAULT_ASPECT_RATIO,
            image_size=request.image_size or DEFAULT_IMAGE_SIZE
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
        print(f"Nano Banana Pro error: {error_msg}")
        
        # Handle specific errors
        if "429" in error_msg or "quota" in error_msg.lower():
            return GenerateResponse(
                status="rate_limited",
                message="Rate limit reached. Please wait a moment and try again."
            )
        
        if "404" in error_msg or "not found" in error_msg.lower():
            # Model not available - try fallback
            return GenerateResponse(
                status="model_unavailable",
                message=f"Model {NANO_BANANA_PRO_MODEL} not available. Please check API access.",
                image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800"
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
    """Test Gemini API connection with both models."""
    if not GEMINI_AVAILABLE:
        return {"error": "google-generativeai package not installed"}
    
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not configured"}
    
    results = {}
    
    # Test Nano Banana Pro model
    try:
        model = genai.GenerativeModel(NANO_BANANA_PRO_MODEL)
        response = model.generate_content("Say 'Nano Banana Pro is ready!' in one sentence.")
        results["nano_banana_pro"] = {
            "status": "success",
            "model": NANO_BANANA_PRO_MODEL,
            "response": response.text if hasattr(response, 'text') else "Model ready"
        }
    except Exception as e:
        results["nano_banana_pro"] = {
            "status": "error",
            "model": NANO_BANANA_PRO_MODEL,
            "error": str(e)
        }
    
    # Test fallback model
    try:
        fallback = genai.GenerativeModel(FALLBACK_TEXT_MODEL)
        response = fallback.generate_content("Say 'Fallback ready!' in one sentence.")
        results["fallback"] = {
            "status": "success",
            "model": FALLBACK_TEXT_MODEL,
            "response": response.text if hasattr(response, 'text') else "Model ready"
        }
    except Exception as e:
        results["fallback"] = {
            "status": "error",
            "model": FALLBACK_TEXT_MODEL,
            "error": str(e)
        }
    
    return results


# Vercel serverless handler
