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
# IMAGE GENERATION PROMPT - TECHNICAL SPECIFICATION
# ============================================
"""
PROMPT ENGINEERING STRATEGY FOR GEMINI 3 PRO IMAGE
===================================================

KEY PRINCIPLE: The user's uploaded car photo (Image 1) is the PRIMARY REFERENCE.
The part selection image (Image 2) is only a STYLE/DETAIL REFERENCE.

OUTPUT REQUIREMENT:
- The generated image MUST look like Image 1 (same angle, same car, same background)
- Only the specified modification should be applied
- The part image is used to EXTRACT visual attributes (color, finish, texture, style)
- These attributes are then APPLIED to the appropriate area of the car

TECHNICAL APPROACH:
1. PRESERVE: Exact camera angle, perspective, composition from Image 1
2. PRESERVE: Car make, model, body shape, all unmodified features from Image 1
3. PRESERVE: Background, environment, lighting conditions from Image 1
4. EXTRACT: Color, finish, texture, pattern, style details from Image 2
5. APPLY: Extracted details to the relevant car surface/component
6. BLEND: Ensure lighting, shadows, reflections match the scene

This is NOT image compositing - it's style transfer with spatial awareness.
"""

def get_car_customization_prompt(part_name: str, part_category: str, part_description: str) -> str:
    """
    Generate a precise prompt for Gemini 3 Pro Image.
    
    The prompt clearly establishes:
    - Image 1 = PRIMARY REFERENCE (angle, composition, car identity)
    - Image 2 = STYLE REFERENCE (extract visual attributes only)
    - Output = Image 1 with Image 2's attributes applied
    """
    
    category_instructions = {
        'wrap': {
            'task': 'VINYL WRAP COLOR TRANSFER',
            'extract_from_ref': [
                'Exact color/hue of the wrap material',
                'Surface finish type (matte, satin, gloss, chrome, metallic)',
                'Texture characteristics (smooth, brushed, carbon fiber pattern)',
                'Reflectivity and light behavior',
            ],
            'apply_to_car': [
                'ALL painted body panels: hood, roof, doors, fenders, quarter panels, trunk lid, bumpers',
                'Follow every body line, crease, and contour of the original car',
                'Wrap around edges naturally as real vinyl would',
            ],
            'preserve_unchanged': [
                'Windows and glass (keep transparent)',
                'Headlights, taillights, all lighting',
                'Grille, badges, emblems, trim pieces',
                'Wheels, tires, mirrors',
                'Interior visible through windows',
            ],
            'lighting_notes': 'Match wrap reflections to the existing light source direction in Image 1. Matte finishes diffuse light; chrome finishes create sharp reflections.',
        },
        'roof': {
            'task': 'ROOF ACCESSORY INSTALLATION',
            'extract_from_ref': [
                'Exact shape and design of the roof accessory',
                'Color and material finish',
                'Mounting hardware style',
                'Proportions and dimensions relative to a car',
            ],
            'apply_to_car': [
                'Mount on the roof surface of the car in Image 1',
                'Center horizontally on the roof',
                'Position appropriately front-to-back based on accessory type',
                'Scale to match the car\'s actual roof size',
            ],
            'preserve_unchanged': [
                'Entire car body, color, and all features',
                'All windows, lights, wheels, everything',
                'Background and environment',
            ],
            'lighting_notes': 'Cast realistic shadow from the accessory onto the roof surface. Match the shadow direction to existing shadows in Image 1.',
        },
        'body': {
            'task': 'BODY KIT COMPONENT INSTALLATION',
            'extract_from_ref': [
                'Exact shape and design of the body component',
                'Color (usually black, carbon fiber, or body-matched)',
                'Material finish (glossy, matte, textured)',
                'Mounting style and edge profile',
            ],
            'apply_to_car': [
                'FRONT LIP: Attach to bottom edge of front bumper, follow bumper curvature',
                'SIDE SKIRTS: Mount along rocker panel between wheel arches, follow body line',
                'REAR SPOILER: Mount on trunk lid trailing edge or rear roof edge',
                'Scale component to match the car\'s actual body dimensions',
            ],
            'preserve_unchanged': [
                'Car body color and all original surfaces not covered by the part',
                'All lights, grille, windows, wheels',
                'Background and environment',
            ],
            'lighting_notes': 'Add subtle shadow underneath the component where it meets the car body. Match reflections to existing light sources.',
        },
    }
    
    spec = category_instructions.get(part_category, category_instructions['body'])
    
    # Build the structured prompt
    extract_list = '\n'.join([f'   • {item}' for item in spec['extract_from_ref']])
    apply_list = '\n'.join([f'   • {item}' for item in spec['apply_to_car']])
    preserve_list = '\n'.join([f'   • {item}' for item in spec['preserve_unchanged']])
    
    return f"""TASK: Edit the FIRST image (my car) by applying the {part_name} style from the SECOND image (reference).

FIRST IMAGE = My car photo. This is what you're editing.
SECOND IMAGE = Style reference only. Extract the {part_name} appearance from this.

{spec['task']}:
{apply_list}

CRITICAL RULES:
1. Output must show MY CAR from the FIRST image
2. Same exact camera angle as the FIRST image
3. Same exact background as the FIRST image  
4. Same car make/model as the FIRST image
5. Only the {part_name} changes - everything else stays identical

Extract from reference:
{extract_list}

Keep unchanged from my car:
{preserve_list}

{spec['lighting_notes']}

OUTPUT: A single edited photo of MY CAR with the new {part_name} applied.
The car in the output must be MY CAR, not the reference car."""


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
    
    # Build content parts - CAR IMAGE FIRST to establish it as primary
    # Research shows first image often gets more weight in multimodal models
    contents = [
        {
            "role": "user",
            "parts": [
                {"text": "Here is MY CAR that I want you to modify:"},
                {
                    "inline_data": {
                        "mime_type": car_mime_type,
                        "data": base_car_image
                    }
                },
                {"text": "\n\nHere is a REFERENCE IMAGE showing the color/style I want to apply to MY CAR above:"},
                {
                    "inline_data": {
                        "mime_type": part_mime_type,
                        "data": parts_image
                    }
                },
                {"text": f"\n\n{prompt}\n\nREMEMBER: Output MY CAR (the first image) with the style from the reference. Do NOT output the reference car."}
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
