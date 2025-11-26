# CarFit – Product Vision & MVP Specification

*(Working Title: “CarFit Studio – AI Car Customization Fitting Room”)*

## 1. Product Overview

CarFit Studio is a digital AI product that works like a virtual fitting room for cars.

It allows car owners to:
*   Upload a photo of their own car
*   Select aftermarket parts (e.g., wheels, rims, roof racks, seats, interior leather colors, body kits)
*   See realistic AI-generated preview images of how their car would look after installing those parts
*   Save combinations as wishlists and
*   Click through affiliate / referral links to purchase the actual products from partner shops or platforms.

**The core idea:**
Car owners often hesitate to buy parts because they cannot visualize how the parts will look on their car.
CarFit Studio removes that uncertainty using image generation AI and product-linked previews.

The product is designed to serve both:
*   **B2C** – Individual car owners
*   **B2B** – Car shops, detailing / tuning shops, and parts brands / marketplaces that want to boost conversions

## 2. Problem & Pain Points

### 2.1 Car Owner Pain Points

**Cannot imagine the final look**
They see a nice rim or roof rack online, but:
*   The photos are on a different car model, color, or year.
*   They cannot be sure if it will look good on their car.
*   This leads to uncertainty and hesitation.

**High cost & risk of regret**
Many modifications (rims, leather seats, body kits) are expensive.
Once installed, they are hard or costly to reverse.
Fear: *“What if I spend this money and the car looks weird or cheap after installing?”*

**Limited physical display**
Shops cannot physically display every:
*   size / color / finish of rim,
*   combination of seat leather,
*   or every body kit on every car model.
Even if they show catalog pictures, it’s never exactly the user’s car.

**Online shopping has low visual confidence**
People increasingly buy parts online.
Product pages show only:
*   generic product images
*   maybe 1–2 demo cars
There is no personalized visualization before purchase.

### 2.2 Business Pain Points (Shops / Brands / Platforms)

**Low conversion from “interest” to “purchase”**
Many users:
*   Visit the product page
*   Save or bookmark
*   Ask for price or DM
But do not checkout.
Main hidden reason: visual uncertainty → *“I’m not 100% sure, so I’ll wait.”*

**High cost of creating marketing visuals**
To show “real car with our parts”, brands must:
*   find a car
*   install the parts
*   organize a photoshoot
Doing this for many models & combinations is time- and cost-prohibitive.

**Lack of personalization in marketing**
Current marketing is generic:
*   “Here’s our rim on a car.”
They cannot say:
*   “Here’s our rim on your Toyota / BMW / Tesla in your color.”

**Weak data on interest & behavior**
They only see:
*   page views
*   add-to-cart
*   purchases
They do not see:
*   which combinations users try (e.g., rim + color)
*   which setups are most popular but not purchased
*   which car models generate the highest interest

## 3. Product Vision

> “To become the universal AI fitting room for car modification, where any car owner can instantly see how any part will look on their own vehicle — and where shops and brands can convert that visualization directly into sales.”

**Long-term vision:**
Be integrated into:
*   car-mod shops,
*   online marketplaces,
*   used car platforms.

Provide:
*   Visual customization layer for cars
*   Affiliate & conversion infrastructure for parts
*   Analytics for brands about demand and preferences

## 4. Target Users & Personas

### 4.1 Individual Car Owner (B2C Persona)
*   **Age:** 20–45
*   **Tech-savvy**, uses smartphone for research and shopping.
*   Loves cars, cares about appearance and personalization.
*   Budget-conscious but willing to spend if confident.
*   **Main needs:**
    *   “Show me how my car will look with these rims / this leather.”
    *   “Help me decide between several styles.”

### 4.2 Car Shop / Tuning / Detailing Shop (B2B Persona)
*   **Sells:**
    *   wheels and rims,
    *   roof racks,
    *   body kits,
    *   interior leather, etc.
*   **Wants:**
    *   Faster sales conversion in-store.
    *   A modern, digital “wow” experience for customers (iPad in store).
    *   Simple tool, easy to operate with customers.

### 4.3 Parts Brands / Online Marketplaces
*   Rim brands, roof rack brands, seat cover brands, etc.
*   Already have:
    *   product catalog
    *   online store
*   **Want:**
    *   Higher conversion rate.
    *   Deeper insights: which combinations are popular.
    *   Tools for their distributors / shop partners.

## 5. Value Proposition

**For Car Owners**
*   Visual confidence: see their actual car with the parts applied.
*   Playful exploration: try multiple styles without cost.
*   Better decisions: reduce regret, avoid wrong purchases.

**For Shops / Brands**
*   Higher conversion: “See it on your car” → faster decision.
*   Better customer experience: digital, modern, consultative selling.
*   Insightful analytics: know what customers try, like, and buy.

**For CarFit Studio (the platform)**
*   Revenue models:
    *   Affiliate commissions (refer link).
    *   B2B subscription (SaaS).
    *   API / SDK licensing for integration.

## 6. Core Product Concepts

*   **Car Photo:** the base image from the user (their own car).
*   **Part / Component:** wheel, rim, roof rack, seat, interior material, body kit, etc.
*   **Combination / Setup / Project:** a saved configuration (car photo + selected parts + generated images).
*   **Affiliate Link:** link to the merchant’s product page with tracking.
*   **B2B Space / Workspace:** a shop or brand’s environment where they manage parts, links, and analytics.

## 7. Core Functional Requirements

### 7.1 Car Image Upload & Pre-Processing

**User Story (B2C):**
As a car owner, I want to upload a clear photo of my car so the system can generate realistic previews.

**Requirements:**

*   **Image Input**
    *   Allow:
        *   Camera capture (mobile device)
        *   Upload from gallery
    *   Recommended instructions (overlay or tooltips):
        *   Example: “Please take a side view at ~45° angle with good lighting.”
        *   Show sample “good” and “bad” reference images.

*   **Validation & Feedback**
    *   Basic checks:
        *   File type (JPG, PNG)
        *   Size limits (e.g., up to 10 MB)
    *   If car is not clearly visible, show warning:
        *   “We couldn’t clearly detect your car. Please try another photo.”

*   **Pre-processing (Backend)**
    *   Normalize size and aspect ratio.
    *   Optionally:
        *   Detect and segment the car from the background.
        *   Detect wheels, car body, roof, windows (for future part placement).
    *   Store original and pre-processed versions in an image store.

*   **MVP Scope:**
    *   Support one main exterior angle first (e.g., side / front-side).
    *   Keep instructions simple and guide the user visually.

### 7.2 Parts Catalog & Product Data

**User Story (B2B / Internal):**
As a shop or brand, I want to upload my parts with details so users can try them on and click to buy.

**Data Fields per Part (MVP):**
*   Product ID
*   Product name
*   Brand
*   Category (e.g., wheel, rim, roof rack)
*   Main product image(s) suitable for composition
*   Supported car categories (free text at first; later more structured)
*   Price (or price range)
*   Currency
*   Affiliate / refer URL
*   Status (active / inactive)

**Functions:**
*   **Internal Admin for MVP**
    *   For MVP, parts may be uploaded via:
        *   Simple admin panel
        *   Or CSV / JSON import.
    *   No need for complex multi-tenant system at the very beginning.

*   **Future B2B Portal**
    *   Later, shops can:
        *   Log in and manage their own products.
        *   Update images, pricing, and links.

*   **MVP Focus:**
    *   Start with a limited curated catalog (e.g., 10–50 wheel / rim options from 1–2 brands).
    *   Prioritize wheels/rims because they are visually strong and simpler to place.

### 7.3 AI Composition & Image Generation Engine

**User Story (Core):**
As a user, I want to see how my car looks with the selected parts applied, using realistic images.

**High-Level Logic:**

1.  **Input:**
    *   Base image: user’s car
    *   Selected part(s): e.g., a specific wheel model
    *   Optional metadata: car model, wheel size

2.  **Processing Steps (Conceptual):**
    *   **Analyze car image:**
        *   Detect position of wheels, perspective, color, lighting.
    *   **Determine where and how to overlay:**
        *   Position of new wheels.
        *   Scale and rotate according to perspective.
    *   **Create a composite “draft image”:**
        *   Overlay part onto the car.
    *   **Send to image generation model:**
        *   Use a third-party image generation API
        *   (e.g., “Model X Pro” as a placeholder for any current SOTA model).
        *   Provide:
            *   base image
            *   mask or overlay area
            *   prompt describing the desired result
    *   **Receive AI-enhanced image:**
        *   Model smooths edges, adjusts lighting, blends styles.

3.  **Output:**
    *   One or more AI-generated images.
    *   Suitable for display, saving, and sharing.

**Requirements:**
*   The engine should:
    *   Preserve the look of the original car (color, shape).
    *   Change only the necessary areas (e.g., wheels).
    *   Aim for realistic perspective and lighting.
*   The system should:
    *   Handle generation as asynchronous jobs (queue) if needed.
    *   Show progress / spinner while generating.

**MVP Constraint:**
*   Focus on one part type (wheels/rims) for highest quality.
*   Keep the logic modular so later we can support roof racks, seats, body kits, etc.

### 7.4 Wishlist, Configurations & Comparison

**User Story:**
As a user, I want to save and compare different setups so I can decide which one I prefer.

**Features (MVP):**
*   **Save Configuration (“Build”)**
    *   A configuration record includes:
        *   The car image used (reference ID)
        *   The parts selected
        *   The generated preview image(s)
        *   Timestamp
*   **View List of Saved Builds**
    *   Simple gallery:
        *   Thumbnail preview
        *   Part names / summary
        *   Tap to open details.
*   **Compare Two Builds (Phase 1 or 1.5)**
    *   At minimum: show two builds side by side.
    *   User can swipe between builds to compare.

**MVP Priority:**
*   Saving builds and viewing them again is high priority.
*   Side-by-side comparison can be Phase 1.5 if time is tight.

### 7.5 Affiliate Links & Click Tracking

**User Story:**
As the platform owner, I want to track when users click on a product to purchase so I can earn commission and provide data to partners.

**Requirements:**
*   Each part has an affiliate / refer URL, e.g.:
    `https://partner.com/product/123?ref=carfit_<campaign_id>_<user_or_session_id>`
*   When a user clicks “Go to buy” / “Purchase”:
    *   System records a click event:
        *   User ID (if logged in) or session ID
        *   Product ID
        *   Configuration ID
        *   Timestamp
    *   Then redirects user to the affiliate URL.

**For MVP:**
*   We only track click-throughs.
*   Actual conversion reporting can be:
    *   Manual (partner sends us reports)
    *   Or integrated later via API.

### 7.6 Basic Analytics (Internal)

**MVP Internal Use Only:**
*   Track:
    *   Number of car images uploaded.
    *   Number of configurations created.
    *   Number of affiliate link clicks.
    *   Most used parts.
*   Simple web-based internal dashboard is enough:
    *   Doesn’t need to be polished for public.

## 8. User Journeys (End-to-End Flows)

### 8.1 B2C – Car Owner
1.  Arrives on landing page → “Try your car with new wheels.”
2.  Clicks “Get Started.”
3.  Uploads car image (or takes photo).
4.  System processes and shows a preview with the original car.
5.  User selects a category: Wheels / Rims.
6.  Browses a list of options:
    *   with thumbnail, brand, size, price.
7.  Clicks one part → generates preview:
    *   Sees progress indicator (e.g., “Generating your car preview…”).
    *   Receives AI preview of their car with the new wheels.
8.  Can:
    *   Save this as “Build A”.
    *   Try a different set of wheels → “Build B”.
    *   Opens “Saved Builds” to compare.
9.  When decided, clicks “Go to buy” on the chosen part.
10. Redirected to merchant site via affiliate link.

### 8.2 B2B – Shop In-Store (Future but considered in design)
1.  Staff opens CarFit Studio shop version on tablet.
2.  Customer shares car photo (e.g., via AirDrop / WhatsApp QR).
3.  Staff uploads photo and selects parts offered in the shop.
4.  Together they try different wheel designs.
5.  Staff shows final preview and quotes price.
6.  Customer confirms and places an order in the shop.
*(This workflow influences design decisions, even if not all features are in MVP.)*

## 9. System Architecture – High Level

*(For solution architect / software engineer to design in more detail)*

### 9.1 Main Components

**Frontend Web App**
*   Mobile-first (responsive).
*   Features:
    *   Upload / capture image
    *   Browse parts
    *   Trigger AI generation
    *   View generated previews
    *   Save & review builds

**Backend REST/GraphQL API**
*   Handles:
    *   Authentication (if we support accounts)
    *   Car image upload & storage references
    *   Parts catalog CRUD (for internal/admin)
    *   Build / configuration management
    *   Click tracking
    *   Orchestration of AI generation jobs

**AI Service Layer**
*   A dedicated service or module that:
    *   Receives:
        *   Car image reference
        *   Part image / metadata
    *   Performs:
        *   Pre-composition logic (overlay, masks)
        *   Calls external image generation API (e.g., “Nana Banana Pro” or other)
    *   Returns:
        *   Final generated image URL

**Storage & Database**
*   Relational DB (e.g., Postgres/MySQL) for:
    *   Users, Parts, Builds, Click logs
*   Object storage (e.g., S3-compatible) for:
    *   Original and processed images
    *   Generated images

**Admin / Internal Panel**
*   For internal operations team to:
    *   Manage parts
    *   Review logs
    *   Monitor usage

## 10. Data Model – High Level (MVP)

**Entities (simplified):**

*   **User**
    *   `id`, `email` (optional for MVP), `created_at`
*   **CarImage**
    *   `id`, `user_id` (nullable if no login), `original_url`, `processed_url`, `metadata` (JSON: angle, etc.), `created_at`
*   **Part**
    *   `id`, `name`, `brand`, `category`, `price`, `currency`, `image_url` (for composition), `affiliate_url`, `status`, `created_at`
*   **Build (Configuration)**
    *   `id`, `user_id` (or session id), `car_image_id`, `generated_image_url`, `created_at`
*   **BuildPart** (Many-to-many relation)
    *   `id`, `build_id`, `part_id`
*   **ClickEvent**
    *   `id`, `user_id` (or session), `build_id`, `part_id`, `clicked_at`

## 11. Non-Functional Requirements (MVP)

*   **Performance:** Image generation can take several seconds. Show progress UI; target under 30s per generation.
*   **Scalability:** Design AI generation as queued jobs to handle spikes.
*   **Security:** Store images securely; limit public access via signed URLs.
*   **Privacy:** Car photos are personal; provide ability to delete builds and images.
*   **Legal:** Clearly mark preview images as “simulated / illustrative only.”

## 12. MVP Scope & Phases

### 12.1 MVP v1.0 – Narrow but Excellent
**Goal:** Deliver a focused, high-quality demo that proves the concept and is good enough to show to investors / partners.

**Included:**
*   Car photo upload (single exterior angle).
*   Small curated catalog of wheels/rims (e.g., 10–50 SKUs).
*   AI-generated previews swapping wheels.
*   Save builds (configurations) and view them in a list.
*   Basic affiliate link click tracking.
*   Simple internal admin to manage parts.

**Not included (yet):**
*   Interior seats / leather changes.
*   Roof racks, body kits, etc.
*   Multi-angle support.
*   Full merchant self-service portal.
*   Complex analytics dashboard for external partners.

### 12.2 MVP v1.1 – Early B2B Extension
Once MVP v1.0 is stable:
*   Add:
    *   Side-by-side build comparison.
    *   Simple “shop mode” (UI preset for in-store tablet usage).
    *   Basic analytics page.

### 12.3 Future Roadmap (Beyond MVP)
*   Interior customization (leather seats, steering wheels).
*   Roof racks, roof boxes, bull bars, etc.
*   Multi-angle car support.
*   Car model auto-detection.
*   Full merchant dashboards and API integration.
*   White-label / embedded widget for partners.

## 13. Risks, Assumptions & Validation Plan

### 13.1 Core Assumptions
*   Seeing a personalized AI preview significantly increases purchase intent.
*   Shops and brands are willing to integrate or partner using affiliate links.
*   Image generation quality can reach a level that users “believe” and accept as helpful.

### 13.2 Key Risks
*   AI output may sometimes look unrealistic or distorted.
*   It may be difficult to perfectly handle all car angles and lighting conditions.
*   Partner integration for sales tracking may be slow or manual at first.

### 13.3 Validation Approach
*   Start with:
    *   A small group of real car owners.
    *   A few partner shops / brands.
*   Measure:
    *   How often users create multiple builds.
    *   How often they click affiliate links.
    *   Feedback on realism and usefulness.
*   Use feedback to iteratively:
    *   Improve AI prompts / pipelines.
    *   Refine UI/UX flows.

---

