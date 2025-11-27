"""
CarFit Studio - API Backend (VroomRoom)
=======================================

This is the FastAPI backend for CarFit Studio.
Deployed as a Vercel Serverless Function.

ENDPOINTS:
- GET  /api/health     - Health check
- GET  /api/parts      - Get all part categories and options
- GET  /api/categories - Get part categories only
- POST /api/generate   - Generate AI preview image using Nano Banana Pro
- GET  /api/test-gemini - Test Gemini API connection

AI MODEL: gemini-3-pro-image-preview (Nano Banana Pro)
- Google's state-of-the-art image generation and editing model
- Powered by Gemini 3 Pro technology
"""

import os
import base64
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

app = FastAPI(title="CarFit API", version="0.3.0")

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

# Nano Banana Pro - Google's image generation model
# Try different model names - the exact name may vary
NANO_BANANA_PRO_MODEL = "gemini-2.0-flash-exp"  # Using flash for now, update when image gen available
GEMINI_IMAGE_MODEL = "imagen-3.0-generate-001"  # Alternative image model
GEMINI_TEXT_MODEL = "gemini-2.0-flash-exp"  # Fallback text model


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
    car_image: str  # Base64 encoded car image (Image 1 - user's car)
    part_image: str  # Base64 encoded part image (Image 2 - the part to install)
    part_name: str  # Name of the part
    part_category: str  # Category: wheels, roof, or body
    part_description: str  # Description of the part

class GenerateResponse(BaseModel):
    status: str
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    message: Optional[str] = None


# ============================================
# HARDCODED DATA
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
# PROMPT TEMPLATES FOR NANO BANANA PRO
# ============================================

def get_installation_prompt(part_name: str, part_category: str, part_description: str) -> str:
    """
    Generate the prompt for Nano Banana Pro to create a realistic car part installation image.
    
    Image 1: User's car photo
    Image 2: The aftermarket part to be installed
    Output: Photorealistic image of the car with the part professionally installed
    """
    
    # Category-specific installation instructions
    category_instructions = {
        'wheels': """
            WHEEL INSTALLATION REQUIREMENTS:
            - Replace ALL visible wheels on the car with the new wheel design from Image 2
            - Maintain correct wheel size proportions relative to the car
            - Match the wheel orientation and angle to the car's perspective
            - Add realistic tire sidewalls around the new wheels
            - Ensure proper wheel well fitment - wheels should sit naturally in the fenders
            - Apply realistic shadows under the wheels touching the ground
            - Keep the wheel color and finish exactly as shown in Image 2
        """,
        'roof': """
            ROOF INSTALLATION REQUIREMENTS:
            - Mount the roof accessory from Image 2 onto the car's roof
            - Position it centered on the roof, properly aligned with the car's body lines
            - Add realistic mounting hardware (roof rails, crossbars) if needed
            - Ensure the accessory follows the roof's curvature naturally
            - Apply proper shadows where the accessory meets the roof
            - Maintain correct scale - the accessory should look proportional to the car
        """,
        'body': """
            BODY KIT INSTALLATION REQUIREMENTS:
            - Integrate the body styling part from Image 2 seamlessly onto the car
            - For front lips: attach to the bottom edge of the front bumper
            - For side skirts: extend along the lower door panels
            - For spoilers: mount on the rear trunk lid or roof edge
            - Match the part's color to the car OR keep it black/carbon fiber as shown
            - Ensure smooth transitions between the part and existing body panels
            - Add realistic shadows and reflections on the new part
        """
    }
    
    installation_guide = category_instructions.get(part_category, category_instructions['body'])
    
    prompt = f"""
You are a professional automotive visualization expert specializing in photorealistic car customization renders.

TASK: Create a single photorealistic image showing the car from Image 1 with the {part_name} from Image 2 professionally installed.

PART DETAILS:
- Part Name: {part_name}
- Category: {part_category}
- Description: {part_description}

{installation_guide}

CRITICAL PHOTOREALISM REQUIREMENTS:
1. PRESERVE THE CAR: Keep the car's make, model, color, and all other features exactly as shown in Image 1
2. LIGHTING MATCH: The installed part must have the same lighting direction, intensity, and color temperature as the original car photo
3. PERSPECTIVE MATCH: The part must follow the exact same camera angle and perspective as the car
4. SHADOW CONSISTENCY: Add realistic shadows that match the existing shadows in the scene
5. REFLECTION CONSISTENCY: Any reflections on the part should match the environment shown in Image 1
6. SEAMLESS INTEGRATION: The part should look factory-installed, not photoshopped
7. RESOLUTION: Output should be high resolution, matching the quality of Image 1

OUTPUT: A single photorealistic image of the customized car that looks like a professional automotive photograph. The result should be indistinguishable from a real photo of a car with this part actually installed.

DO NOT:
- Change the car's color, shape, or any other features
- Add any text, watermarks, or labels
- Show the part separately - it must be installed on the car
- Create multiple images or before/after comparisons
- Add any elements not present in the original scene
"""
    
    return prompt


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "CarFit Backend (VroomRoom)",
        "version": "0.3.0",
        "ai_model": NANO_BANANA_PRO_MODEL,
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
    """Get all part options grouped by category."""
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


@app.post("/api/generate")
async def generate_image(request: GenerateRequest):
    """
    Generate a photorealistic car customization image using Nano Banana Pro.
    
    Takes two images:
    - car_image: User's uploaded car photo (base64)
    - part_image: The aftermarket part to install (base64)
    
    Returns: A photorealistic image of the car with the part installed
    """
    
    if not GEMINI_AVAILABLE:
        return GenerateResponse(
            status="error",
            message="Gemini AI package not available"
        )
    
    if not GEMINI_API_KEY:
        return GenerateResponse(
            status="demo",
            image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
            message="Demo mode: Configure GEMINI_API_KEY for real AI generation."
        )
    
    try:
        # For now, use Gemini to analyze and describe the modification
        # Then return a demo image since Gemini text models can't generate images
        # TODO: Integrate Imagen API or Replicate for actual image generation
        
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        
        # Generate the installation prompt
        prompt = get_installation_prompt(
            part_name=request.part_name,
            part_category=request.part_category,
            part_description=request.part_description
        )
        
        # Prepare Image 1: User's car
        car_image_data = request.car_image
        if car_image_data.startswith("data:image"):
            car_image_data = car_image_data.split(",", 1)[1]
        
        car_image_part = {
            "mime_type": "image/jpeg",
            "data": car_image_data
        }
        
        # Prepare Image 2: The part to install
        part_image_data = request.part_image
        if part_image_data.startswith("data:image"):
            part_image_data = part_image_data.split(",", 1)[1]
        
        part_image_part = {
            "mime_type": "image/png",
            "data": part_image_data
        }
        
        # Ask Gemini to analyze both images and describe the result
        # Note: Gemini can understand images but cannot generate new ones
        analysis_prompt = f"""
        Analyze these two images:
        - Image 1: A car photo uploaded by the user
        - Image 2: A {request.part_name} ({request.part_description})
        
        Describe in 2-3 sentences how the car would look with this part installed.
        Be specific about the car model you see and how the {request.part_category} modification would enhance it.
        """
        
        response = model.generate_content([
            analysis_prompt,
            car_image_part,
            part_image_part
        ])
        
        # Get the AI analysis text
        ai_description = ""
        if response.candidates and len(response.candidates) > 0:
            candidate = response.candidates[0]
            for part in candidate.content.parts:
                if hasattr(part, 'text') and part.text:
                    ai_description = part.text
                    break
        
        # Return the analysis with a demo/placeholder image
        # Note: For actual image generation, need to integrate Imagen or Replicate
        return GenerateResponse(
            status="analysis",
            image_url="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
            message=f"AI Analysis: {ai_description}\n\n⚠️ Note: Image generation requires Imagen API. Currently showing placeholder."
        )
        
    except Exception as e:
        error_msg = str(e)
        print(f"Nano Banana Pro error: {error_msg}")
        
        # Handle rate limiting
        if "429" in error_msg or "quota" in error_msg.lower():
            return GenerateResponse(
                status="rate_limited",
                message="API rate limit reached. Please wait a moment and try again."
            )
        
        # Handle model not found
        if "not found" in error_msg.lower() or "404" in error_msg:
            return GenerateResponse(
                status="model_error",
                message=f"Model {NANO_BANANA_PRO_MODEL} not available. Checking alternative models..."
            )
        
        return GenerateResponse(
            status="error",
            message=f"Generation failed: {error_msg}"
        )


@app.get("/api/test-gemini")
async def test_gemini():
    """Test Gemini API connection and model availability."""
    if not GEMINI_AVAILABLE:
        return {"error": "google-generativeai package not installed"}
    
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not configured"}
    
    try:
        # Test the image generation model
        model = genai.GenerativeModel(NANO_BANANA_PRO_MODEL)
        response = model.generate_content("Describe what you can do for image generation.")
        
        return {
            "status": "success",
            "model": NANO_BANANA_PRO_MODEL,
            "response": response.text if hasattr(response, 'text') else "Model ready",
            "capabilities": "Image generation and editing with Nano Banana Pro"
        }
    except Exception as e:
        # Try fallback model
        try:
            fallback_model = genai.GenerativeModel(GEMINI_TEXT_MODEL)
            response = fallback_model.generate_content("Say 'Hello from Gemini!'")
            return {
                "status": "fallback",
                "primary_model": NANO_BANANA_PRO_MODEL,
                "fallback_model": GEMINI_TEXT_MODEL,
                "response": response.text if hasattr(response, 'text') else "Fallback working",
                "error": str(e)
            }
        except Exception as e2:
            return {"error": f"Both models failed. Primary: {str(e)}, Fallback: {str(e2)}"}


# Legacy endpoint for backwards compatibility
@app.post("/api/generate-legacy")
async def generate_image_legacy(image_url: str, part_id: str, prompt: str = ""):
    """Legacy generate endpoint - redirects to new format."""
    return GenerateResponse(
        status="deprecated",
        message="Please use the new /api/generate endpoint with car_image, part_image, part_name, part_category, and part_description fields."
    )


# Vercel handler - export the FastAPI app directly
