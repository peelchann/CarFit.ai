# CarFit – Solution Architecture & Design

## 1. System Overview

CarFit is a hybrid web application that combines a responsive frontend for user interaction with a Python-based backend for image processing and AI orchestration. The system is designed to be deployed on **Vercel** as a unified monorepo.

### 1.1 High-Level Stack

*   **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS.
*   **Backend**: Python (FastAPI) running as Vercel Serverless Functions.
*   **AI Engine**: Replicate API (hosting Stable Diffusion XL / ControlNet models).
*   **Database**: PostgreSQL (e.g., Supabase, Neon) - *Optional for MVP v1*.
*   **Storage**: AWS S3 or Supabase Storage (for user uploads and generated images).

## 2. Architecture Diagram

```mermaid
graph TD
    User[User / Client] -->|HTTPS| Vercel[Vercel Edge Network]
    
    subgraph "Vercel Deployment"
        Frontend[Next.js Frontend]
        Backend[FastAPI Serverless Function]
    end
    
    Vercel -->|/| Frontend
    Vercel -->|/api/*| Backend
    
    Frontend -->|Upload Image| Storage[Object Storage (S3/Supabase)]
    Frontend -->|Generate Request| Backend
    
    Backend -->|Model Inference| Replicate[Replicate API]
    Replicate -- Generated Image URL --> Backend
    Backend -- Result JSON --> Frontend
```

## 3. Component Details

### 3.1 Frontend (Next.js)
*   **Pages:**
    *   `/` (Landing & Upload)
    *   `/studio` (Main fitting room interface)
    *   `/results` (View and compare)
*   **State Management:** React Context or Zustand for holding the current car session.

### 3.2 Backend (FastAPI on Vercel)
*   **Entry Point:** `api/index.py`
*   **Endpoints:**
    *   `GET /api/health`: Health check.
    *   `POST /api/generate`: Accepts image URL + prompt/part ID -> calls AI.
    *   `GET /api/parts`: Returns list of available parts (mocked or DB).
*   **AI Integration:**
    *   Uses `replicate` Python client.
    *   Model: `stability-ai/sdxl` or fine-tuned `controlnet`.

### 3.3 Data Model (MVP)
*   **Session-based:** No user login required for v1.
*   **Parts Config:** JSON file in backend or simple DB table.

## 4. Deployment Strategy (Vercel)

The project is structured as a Monorepo:
```
/
├── frontend/         # Next.js Application
├── backend/          # FastAPI Application
├── api/              # Vercel Serverless Entry Points
├── vercel.json       # Routing Configuration
└── package.json      # Root scripts
```

**Vercel Configuration (`vercel.json`):**
*   Rewrites all `/api/*` requests to the Python backend.
*   Serves frontend for all other routes.



