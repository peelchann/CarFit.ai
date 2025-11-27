# CarFit Studio - AI Image Generation Specification

**Last Updated:** November 27, 2025  
**Version:** 0.4.0  
**AI Model:** Gemini 2.0 Flash (configurable to Gemini 2.0 Pro)

---

## Overview

CarFit Studio uses AI to generate photorealistic images of cars with aftermarket parts installed. The user provides two images, and the AI outputs a single composite image showing the car with the part professionally installed.

---

## Input Images

### Image 1: User's Car Photo
The base image uploaded by the user.

| Requirement | Description |
|-------------|-------------|
| **Format** | JPG, PNG |
| **Content** | Clear photo of the user's car |
| **Angle** | Side view, front 3/4, or rear 3/4 preferred |
| **Quality** | High resolution recommended |
| **Background** | Any (street, parking lot, studio) |

**Example Input:**
```
┌─────────────────────────────────────┐
│                                     │
│    [User's Suzuki Jimny photo]      │
│                                     │
│    - Green Suzuki Jimny             │
│    - Side/front 3/4 angle           │
│    - Outdoor background             │
│    - Stock wheels visible           │
│    - No roof accessories            │
│                                     │
└─────────────────────────────────────┘
```

### Image 2: Part to Install
The aftermarket part selected from the catalog.

| Requirement | Description |
|-------------|-------------|
| **Format** | PNG (with transparency preferred) |
| **Content** | Clear product photo of the part |
| **Background** | Transparent or clean background |
| **Categories** | Wheels, Roof Storage, Body Accents |

**Example Input:**
```
┌─────────────────────────────────────┐
│                                     │
│    [Silver Roof Rack Rails photo]   │
│                                     │
│    - Low-profile roof rails         │
│    - Silver/aluminum finish         │
│    - Clear product shot             │
│                                     │
└─────────────────────────────────────┘
```

---

## Output Image Requirements

### The AI-generated output should be:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [GENERATED OUTPUT IMAGE]                       │
│                                                             │
│    ┌───────────────────────────────────────────────────┐    │
│    │                                                   │    │
│    │     Same Suzuki Jimny from Image 1                │    │
│    │     WITH Silver Roof Rails INSTALLED              │    │
│    │                                                   │    │
│    │     ✓ Same car color (green)                      │    │
│    │     ✓ Same background                             │    │
│    │     ✓ Same lighting/shadows                       │    │
│    │     ✓ Roof rails look factory-installed           │    │
│    │     ✓ Proper perspective matching                 │    │
│    │     ✓ Realistic shadows on roof                   │    │
│    │                                                   │    │
│    └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Category-Specific Output Requirements

### 🛞 Wheels Category

**Input:** Car photo + Wheel design  
**Output:** Car with ALL visible wheels replaced

| Requirement | Details |
|-------------|---------|
| Replace ALL wheels | Every visible wheel must show the new design |
| Maintain proportions | Wheel size should match original proportions |
| Add tire sidewalls | Realistic tire rubber around the new wheel |
| Match perspective | Wheel angle matches car's viewing angle |
| Proper shadows | Shadow under wheel touching ground |
| Wheel well fitment | Wheels sit naturally in fenders |

**Visual Example:**
```
BEFORE (Image 1)          AFTER (Output)
┌──────────────────┐      ┌──────────────────┐
│   🚗             │      │   🚗             │
│  ○────────○      │  →   │  ●────────●      │
│  Stock wheels    │      │  New sport wheels│
│                  │      │  + realistic     │
│                  │      │    shadows       │
└──────────────────┘      └──────────────────┘
```

---

### 📦 Roof Storage Category

**Input:** Car photo + Roof accessory  
**Output:** Car with roof accessory mounted

| Requirement | Details |
|-------------|---------|
| Centered placement | Accessory centered on roof |
| Follow roof curve | Part follows the roof's natural curvature |
| Mounting hardware | Add realistic roof rails/crossbars if needed |
| Proper scale | Accessory proportional to car size |
| Shadow casting | Accessory casts shadow on roof surface |
| Seamless integration | Looks professionally installed |

**Visual Example:**
```
BEFORE (Image 1)          AFTER (Output)
┌──────────────────┐      ┌──────────────────┐
│   ┌────────┐     │      │   ┌════════┐     │
│   │  roof  │     │  →   │   │ROOF BOX│     │
│   └────────┘     │      │   └════════┘     │
│   🚗             │      │   🚗             │
│                  │      │  + mounting bars │
│                  │      │  + shadows       │
└──────────────────┘      └──────────────────┘
```

---

### 🏎️ Body Style Accent Category

**Input:** Car photo + Body part (lip, skirt, spoiler)  
**Output:** Car with body modification integrated

| Requirement | Details |
|-------------|---------|
| **Front Lip** | Attached to bottom edge of front bumper |
| **Side Skirts** | Extended along lower door panels |
| **Rear Spoiler** | Mounted on trunk lid or roof edge |
| Color matching | Match car color OR keep black/carbon as shown |
| Smooth transitions | No visible gaps or seams |
| Realistic reflections | Part reflects environment like rest of car |

**Visual Example:**
```
BEFORE (Image 1)          AFTER (Output)
┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │
│   🚗             │  →   │   🚗             │
│  ═══════════     │      │  ═══════════     │
│  (bumper)        │      │  ▄▄▄▄▄▄▄▄▄▄▄     │
│                  │      │  (front lip)     │
└──────────────────┘      └──────────────────┘
```

---

## Quality Checklist

### ✅ The output image MUST have:

- [ ] **Same car** - Identical make, model, color as Image 1
- [ ] **Same background** - No changes to environment
- [ ] **Same lighting** - Light direction and intensity preserved
- [ ] **Matched perspective** - Part follows car's camera angle
- [ ] **Realistic shadows** - New shadows where part meets car
- [ ] **Consistent reflections** - Part reflects same environment
- [ ] **Seamless integration** - Looks factory-installed
- [ ] **High resolution** - Matches input image quality
- [ ] **Single image** - One output, not before/after

### ❌ The output image must NOT have:

- [ ] Different car color or model
- [ ] Changed background or environment
- [ ] Text, watermarks, or labels
- [ ] Multiple images or collages
- [ ] The part shown separately (must be installed)
- [ ] Obvious photoshop artifacts
- [ ] Mismatched lighting or shadows
- [ ] Floating or poorly positioned parts

---

## Example Prompt to AI

```
Generate a photorealistic image of this car with the Silver Roof Rack Rails installed.

TASK: Blend the Silver Roof Rack Rails (Low-profile roof rails for mounting gear) 
onto the car from Image 1, using Image 2 as reference for the part's appearance.

Mount the roof accessory centered on the car's roof. Follow roof curvature, 
add mounting hardware, apply proper shadows.

REQUIREMENTS:
- Keep the car's original color, make, model, and background EXACTLY as in Image 1
- Match lighting, shadows, and reflections to the original photo
- The part should look factory-installed, not photoshopped
- Output a single high-quality photorealistic image
- Do NOT add text, watermarks, or labels
```

---

## Technical Response Format

### Success Response (Image Generated):
```json
{
  "status": "success",
  "image_base64": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Generated Silver Roof Rack Rails installation preview"
}
```

### Text Response (Model Returns Description):
```json
{
  "status": "text_response",
  "message": "The Suzuki Jimny would look great with the silver roof rails mounted...",
  "image_url": "https://placeholder-image.com/demo.jpg"
}
```

---

## Model Configuration

| Setting | Default | Alternative |
|---------|---------|-------------|
| **Model** | `gemini-2.0-flash-exp` | `gemini-2.0-pro` |
| **Purpose** | Fast, cost-effective | Higher quality |
| **Env Variable** | `GEMINI_IMAGE_MODEL` | - |

To upgrade to Pro model, set in Vercel:
```
GEMINI_IMAGE_MODEL=gemini-2.0-pro
```

---

## Future Improvements

1. **Multiple Parts** - Support installing multiple parts in one generation
2. **Angle Selection** - Let user specify which angle to generate
3. **Color Matching** - AI matches part color to car automatically
4. **Before/After Slider** - Interactive comparison view
5. **HD Export** - Download high-resolution result

---

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [CarFit Product Vision](./CarFit_Product_Vision_and_MVP_Spec.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

