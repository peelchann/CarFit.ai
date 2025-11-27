# CarFit Studio - AI Image Generation Specification

**Last Updated:** November 27, 2025  
**Version:** 0.8.0  
**AI Model:** Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`)

---

## Core Principle

> **The user's uploaded car photo is the PRIMARY REFERENCE.**  
> **The part selection image is only a STYLE/DETAIL REFERENCE.**

The AI must generate an image that looks like the **original uploaded photo** with modifications applied - NOT a new image inspired by both inputs.

---

## Input/Output Definition

### Inputs (2 Images)

| Image | Role | What AI Should Do |
|-------|------|-------------------|
| **Image 1** (User's Car) | **PRIMARY REFERENCE** | PRESERVE everything: angle, car identity, background, lighting |
| **Image 2** (Part/Wrap) | **STYLE REFERENCE** | EXTRACT visual attributes: color, finish, texture, shape |

### Output (1 Image)

A single photorealistic image that is **visually identical to Image 1** except for the specific modification applied using attributes extracted from Image 2.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   INPUT 1 (Primary)     +    INPUT 2 (Reference)    =  OUTPUT  │
│                                                                 │
│   ┌─────────────────┐       ┌─────────────────┐    ┌─────────────────┐
│   │                 │       │                 │    │                 │
│   │  User's Car     │       │  Wrap Sample    │    │  Same Car       │
│   │  (Honda Civic)  │   +   │  (Matte Black)  │ =  │  Same Angle     │
│   │  Side View      │       │                 │    │  Same Background│
│   │  Street BG      │       │                 │    │  + Matte Black  │
│   │                 │       │                 │    │    Wrap Applied │
│   └─────────────────┘       └─────────────────┘    └─────────────────┘
│                                                                 │
│   PRESERVE FROM IMG 1:      EXTRACT FROM IMG 2:    COMBINE:     │
│   • Camera angle            • Color/hue            • Image 1 base│
│   • Car make/model          • Finish type          • + Image 2   │
│   • Background              • Texture              │   attributes │
│   • Lighting                • Reflectivity         │              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Requirements

### 1. Composition Preservation (CRITICAL)

The output image MUST have **identical composition** to Image 1:

| Attribute | Requirement |
|-----------|-------------|
| Camera Angle | EXACT match (front 3/4, side, rear 3/4, etc.) |
| Framing | EXACT match (same crop, same car position in frame) |
| Perspective | EXACT match (same vanishing points, same distortion) |
| Aspect Ratio | EXACT match to input |

### 2. Car Identity Preservation (CRITICAL)

The car in the output MUST be **the same vehicle** as Image 1:

| Attribute | Requirement |
|-----------|-------------|
| Make & Model | EXACT match (Honda Civic stays Honda Civic) |
| Body Shape | EXACT match (same proportions, lines, contours) |
| Unmodified Parts | EXACT match (wheels, mirrors, lights, trim) |
| Year/Generation | EXACT match (same headlight shape, grille design) |

### 3. Environment Preservation (CRITICAL)

The background MUST match Image 1 **exactly**:

| Attribute | Requirement |
|-----------|-------------|
| Location | Same (street, parking lot, studio, nature) |
| Background Objects | Same (buildings, trees, other cars) |
| Ground Surface | Same (asphalt, concrete, grass) |
| Sky/Weather | Same (sunny, cloudy, time of day) |

### 4. Lighting Integration

| Aspect | Requirement |
|--------|-------------|
| Light Direction | Match existing shadows in Image 1 |
| Shadow Casting | New parts cast shadows consistent with scene |
| Reflections | Match existing reflection patterns |
| Material Response | Matte = diffuse; Chrome = sharp reflections |

---

## Category-Specific Extraction & Application

### 🎨 Car Wraps

**EXTRACT from Reference Image:**
- Exact color/hue of the wrap material
- Surface finish (matte, satin, gloss, chrome, metallic)
- Texture characteristics (smooth, brushed, carbon fiber pattern)
- Reflectivity and light behavior

**APPLY to Car:**
- ALL painted body panels
- Hood, roof, doors, fenders, quarter panels, trunk, bumpers
- Follow every body line and contour
- Wrap around edges naturally

**PRESERVE Unchanged:**
- Windows and glass (keep transparent)
- All lights (headlights, taillights, indicators)
- Grille, badges, emblems, trim
- Wheels, tires, mirrors
- Interior visible through windows

**Lighting Notes:**
- Match wrap reflections to existing light source direction
- Matte finishes diffuse light broadly
- Chrome/metallic finishes create sharp, mirror-like reflections

---

### 📦 Roof Accessories

**EXTRACT from Reference Image:**
- Exact shape and design of the accessory
- Color and material finish
- Mounting hardware style
- Proportions relative to a car

**APPLY to Car:**
- Mount on roof surface
- Center horizontally
- Position appropriately front-to-back
- Scale to match car's actual roof size

**PRESERVE Unchanged:**
- Entire car body, color, all features
- All windows, lights, wheels
- Background and environment

**Lighting Notes:**
- Cast realistic shadow onto roof surface
- Shadow direction matches existing shadows in scene

---

### 🏎️ Body Kit Components

**EXTRACT from Reference Image:**
- Exact shape and design of component
- Color (black, carbon fiber, or body-matched)
- Material finish (glossy, matte, textured)
- Edge profile and mounting style

**APPLY to Car:**
- **Front Lip:** Bottom edge of front bumper, follow curvature
- **Side Skirts:** Along rocker panels between wheel arches
- **Rear Spoiler:** Trunk lid trailing edge or rear roof edge
- Scale to match car's body dimensions

**PRESERVE Unchanged:**
- Car body color (unless body-matched part)
- All original surfaces not covered by part
- All lights, grille, windows, wheels
- Background and environment

**Lighting Notes:**
- Add subtle shadow underneath component
- Match reflections to existing light sources

---

## Quality Checklist

### ✅ Output MUST Have:

- [ ] **Same camera angle** as uploaded photo
- [ ] **Same car** (make, model, body shape)
- [ ] **Same background** (location, objects, ground)
- [ ] **Same lighting** (direction, intensity, color temperature)
- [ ] **Realistic material physics** (proper reflections, shadows)
- [ ] **Seamless integration** (no visible editing artifacts)
- [ ] **Single image output** (no collages, no before/after)

### ❌ Output Must NOT Have:

- [ ] Different car make or model
- [ ] Different camera angle or perspective
- [ ] Changed background or environment
- [ ] Text, watermarks, or labels
- [ ] The part shown separately
- [ ] Multiple images or comparisons
- [ ] Visible compositing artifacts
- [ ] Unnatural color boundaries

---

## API Request Format

```json
POST /api/generate
{
  "car_image": "data:image/jpeg;base64,...",    // PRIMARY REFERENCE
  "part_image": "data:image/png;base64,...",    // STYLE REFERENCE
  "part_name": "Matte Black Wrap",
  "part_category": "wrap",
  "part_description": "Sleek matte black finish for a stealthy look"
}
```

## API Response Format

### Success (Image Generated):
```json
{
  "status": "success",
  "image_base64": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Successfully generated Matte Black Wrap installation preview"
}
```

### Text Response (Model Returned Description):
```json
{
  "status": "text_response",
  "message": "I've analyzed the images and here's how the wrap would look...",
  "image_url": "https://placeholder.com/demo.jpg"
}
```

---

## Prompt Engineering Strategy

The prompt is structured to clearly establish the hierarchy:

1. **Define Image Roles** - Explicitly state Image 1 is PRIMARY, Image 2 is REFERENCE
2. **List Preservation Requirements** - Everything that must stay the same
3. **List Extraction Targets** - What to pull from the reference image
4. **List Application Rules** - Where and how to apply extracted attributes
5. **Technical Constraints** - Composition, identity, environment requirements
6. **Negative Instructions** - Explicit list of what NOT to do

This structure helps the model understand that the task is **style transfer with spatial awareness**, not image compositing or generation from scratch.

---

## Model Configuration

| Setting | Value |
|---------|-------|
| Model ID | `gemini-3-pro-image-preview` |
| Config | `response_modalities: ["IMAGE"]` |
| Auth | Vertex AI (project/location) or API Key |

### Environment Variables (Vercel):

**For Vertex AI:**
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

**For API Key:**
```
GEMINI_API_KEY=your-api-key
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.8.0 | Nov 27, 2025 | Complete rewrite with PRIMARY/REFERENCE image hierarchy |
| 0.7.0 | Nov 27, 2025 | Added Gemini 3 Pro Image support |
| 0.5.0 | Nov 27, 2025 | Initial specification |
