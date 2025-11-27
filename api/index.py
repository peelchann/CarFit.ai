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
    """Generate the prompt for image editing - blending part onto car."""
    
    category_instructions = {
        'wheels': """
WHEEL INSTALLATION TASK:
- Replace ALL visible wheels on the car with the wheel design from Image 2
- Maintain correct wheel size proportions relative to the car
- Add realistic tire sidewalls around the new wheels
- Match the wheel orientation and angle to the car's perspective
- Apply realistic shadows under the wheels touching the ground
- Ensure proper wheel well fitment
""",
        'roof': """
ROOF INSTALLATION TASK:
- Mount the roof accessory from Image 2 onto the car's roof
- Position it centered on the roof, properly aligned with the car's body lines
- Add realistic mounting hardware (roof rails, crossbars) if needed
- Ensure the accessory follows the roof's curvature naturally
- Apply proper shadows where the accessory meets the roof
""",
        'body': """
BODY KIT INSTALLATION TASK:
- Integrate the body styling part from Image 2 seamlessly onto the car
- For front lips: attach to the bottom edge of the front bumper
- For side skirts: extend along the lower door panels
- For spoilers: mount on the rear trunk lid or roof edge
- Match the part's color to the car OR keep it black/carbon fiber as shown
- Ensure smooth transitions between the part and existing body panels
"""
    }
    
    instruction = category_instructions.get(part_category, category_instructions['body'])
    
    return f"""You are an expert car customization photo editor.

I'm providing two images:
- Image 1: A photo of a car (the base vehicle)
- Image 2: An aftermarket part ({part_name} - {part_description})

YOUR TASK: Create a single photorealistic image showing the car from Image 1 with the {part_name} from Image 2 professionally installed.

{instruction}

CRITICAL REQUIREMENTS:
1. Keep the car's make, model, color, and all features EXACTLY as in Image 1
2. Keep the original background and environment unchanged
3. Match lighting, shadows, and reflections to the original photo
4. The installed part should look factory-installed, not photoshopped
5. Output a single high-resolution photorealistic image

DO NOT:
- Change the car's color, shape, or any features
- Add text, watermarks, or labels
- Show the part separately - it must be installed on the car
- Create multiple images or before/after comparisons

Generate the final customized car image now."""


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
    
    # Build content parts
    contents = [
        {
            "role": "user",
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": car_mime_type,
                        "data": base_car_image
                    }
                },
                {
                    "inline_data": {
                        "mime_type": part_mime_type,
                        "data": parts_image
                    }
                }
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
