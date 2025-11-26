# Benson's AI Fitting Room – Product Analysis & Feature Specs

*Based on video analysis of "Benson's AI Fitting Room"*

## Product Overview

The application is a **Virtual Try-On (VTO)** platform combining Generative AI with e-commerce integration. It allows users to:
1.  Upload a personal photo.
2.  Define style parameters (via tags or natural language).
3.  Generate realistic images of themselves wearing specific retail products (e.g., Uniqlo).
4.  View direct purchase links to those exact items.

---

## 1. Frontend & User Experience (UX/UI)

### A. User Onboarding & Input

**Photo Upload**
*   **Feature:** Drag-and-drop or file selection for user portrait upload.
*   **Requirement:**
    *   Client-side validation for image format (JPG/PNG) and resolution.
    *   **Face detection hook:** Ensure a valid face is present before upload completes to prevent generation errors.

**Parameter Selection Interface**
*   **Tag-Based Filtering:** Multi-select toggle buttons arranged by category:
    *   **Style:** Modern Casual, Business Formal, Low-key Luxury, Retro, Streetwear, Sporty.
    *   **Material:** Cotton, Denim, Leather, Wool, Linen, Tech-fleece.
    *   **Color:** White, Black, Red, Navy, Beige, Pink, etc.
*   **Text Prompt Input:**
    *   A text area for natural language descriptions (e.g., *"Mature golden style"*) that overrides or augments selected tags.

### B. Generation Interaction

**"One-Click Change" Button**
*   Triggers the API call to start the generation pipeline.

**Loading State**
*   **Feature:** Overlay on the image area with a spinner.
*   **Micro-copy:** Dynamic text updating the user (e.g., *"AI is analyzing your profile,"* *"Matching Uniqlo 2025 products"*). This masks backend latency (est. 5-10 seconds).

**Result Display**
*   High-resolution rendering of the generated image replacing the original upload.

### C. E-Commerce Sidebar ("Shop the Look")

**Dynamic Product List**
*   A collapsible/persistent sidebar that updates based on the generated image.

**Product Cards**
*   Each card displays:
    *   Product Thumbnail.
    *   Brand/Collection Name (e.g., *"Uniqlo U Series"*).
    *   Product Name (e.g., *"Needles Fleece Jacket"*).
    *   Price (e.g., *"NT$1,490"*).
    *   **Action:** Direct "Buy" or "View" external link.

---

## 2. Backend & AI Tech Stack (The Core Engine)

### A. Image Processing Pipeline

**Identity Preservation (Crucial)**
*   **Tech:** Roop / InsightFace / InstantID.
*   **Goal:** Preserve the user's facial features (identity) while completely replacing the body/clothing.

**ControlNet**
*   Use ControlNet (**OpenPose** & **Depth**) to maintain the user's original posture and lighting while mapping new textures (clothes) onto the body.

**Generative Model**
*   **Tech:** Stable Diffusion XL (SDXL) or FLUX.1.
*   **Training:** Fine-tuned on fashion datasets.
*   **In-painting/Masking:** Automatic segmentation to mask the body (neck down) while keeping the background and head intact.

### B. Product Matching Logic (RAG vs. Conditioning)

*The video implies a **Product-First** approach is used:*

1.  **Product-First (Recommended for Retail):**
    *   User selects *"Business Formal"*.
    *   Backend queries the Uniqlo catalog for *"Business Formal"* items.
    *   Pass specific **product asset images** into the Image Generator (using **IP-Adapter**) to wrap that specific texture onto the user.
    *   *Why:* Ensures the sidebar shows exact SKUs (e.g., "Uniqlo C 462002") rather than hallucinated clothes.

### C. LLM Integration

**Prompt Engineering**
*   **Input:** User types *"Mature golden style."*
*   **Process:** An LLM (GPT-4o mini or Gemini Flash) parses this text into Stable Diffusion prompt tokens (e.g., *"gold color palette, sophisticated texture, wool coat, studio lighting"*).

---

## 3. Data Structure & API Schema

To build this, the team needs a database schema connecting inventory to visual assets.

### Product Database (SQL/NoSQL)

| Field | Type | Description |
| :--- | :--- | :--- |
| `product_id` | String | Unique SKU (e.g., "479704"). |
| `name` | String | "Fleece Jacket". |
| `category_tags` | Array | `["Casual", "Autumn", "Warm"]`. |
| `image_url` | URL | Clean flat-lay image of the product (for IP-Adapter training). |
| `purchase_url` | URL | Link to the store page. |
| `embedding` | Vector | Visual embedding for similarity matching. |

### API Endpoint: `/generate-outfit`

**Request:**
```json
{
  "user_image": "[Binary_Data]",
  "prompt": "Business Formal",
  "preferences": {
    "color": "Navy",
    "material": "Wool"
  }
}
```

**Response:**
```json
{
  "generated_image_url": "https://...",
  "matched_products": [
    {
      "id": "479704",
      "name": "Fleece Jacket",
      "price": "NT$1,490",
      "url": "https://uniqlo.com/..."
    }
  ]
}
```

---

## 4. Development Roadmap Summary

**MVP Phase 1 (The Pipeline)**
*   Setup Stable Diffusion with ControlNet to swap clothes on a reference image while keeping the face (InstantID/InsightFace).

**MVP Phase 2 (Asset Ingestion)**
*   Scrape or ingest the retail catalog (e.g., Uniqlo).
*   Create a vector database of clothing items.

**MVP Phase 3 (Integration)**
*   Implement **IP-Adapter**. This allows the AI to accept the user's face *plus* the specific product image as inputs to generate the final composite.

**UI Implementation**
*   Build the frontend with the sidebar logic to display the specific products used in the generation prompt.

---

## 5. Critical Technical Challenges

1.  **Hallucination:** Ensure the AI doesn't invent buttons or zippers that don't exist on the real product.
    *   *Solution:* Use IP-Adapter with high weight settings.
2.  **Gender/Fit Bias:** (e.g., Male user put in a pleated skirt).
    *   *Solution:* Strict logic in the tagging system (if `User == Male`, exclude `Skirt` category unless explicitly requested) or a "Unisex" toggle.
3.  **Latency:** Image generation can take 10–20 seconds.
    *   *Solution:* Optimized GPU inference (TensorRT) or fast distills (SDXL Turbo) for a smooth web experience.

