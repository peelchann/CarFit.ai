# CarFit Studio

CarFit Studio is an AI-powered virtual fitting room for car customization. It allows users to upload a photo of their car and visualize aftermarket parts like wheels and rims using Generative AI.

## Project Structure

This is a **monorepo** configured for deployment on **Vercel**.

*   `frontend/`: Next.js application (React, TypeScript, Tailwind).
*   `backend/`: FastAPI application (Python).
*   `api/`: Vercel Serverless Function entry points.

## Quick Start

### Prerequisites
*   Node.js 18+
*   Python 3.9+
*   Vercel CLI (optional, for local dev)

### Local Development

1.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    ```

2.  **Install Backend Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run Development Servers:**

    *   **Backend:**
        ```bash
        uvicorn backend.main:app --reload --port 8000
        ```
    *   **Frontend:**
        ```bash
        cd frontend
        npm run dev
        ```

    Access the app at `http://localhost:3000`. API requests will be proxied to `http://localhost:8000`.

### Deployment

This project is ready for Vercel.

1.  Push to GitHub.
2.  Import project in Vercel.
3.  Vercel will automatically detect Next.js and the Python API.

## Documentation

*   [Product Vision](CarFit_Product_Vision_and_MVP_Spec.md)
*   [Architecture Design](Architecture_Design.md)

