# CarFit Studio

CarFit Studio is an AI-powered virtual fitting room for car customization. It allows users to upload a photo of their car and visualize aftermarket parts like wheels and rims using Generative AI.

## Project Structure

```
CarFit/
├── api/                    # Vercel Serverless Function entry points
│   └── index.py
├── backend/                # FastAPI application (Python)
│   └── main.py
├── frontend/               # Next.js application (React, TypeScript, Tailwind)
│   ├── app/
│   ├── components/
│   └── package.json
├── docs/                   # Documentation
│   ├── Architecture_Design.md
│   ├── Benson_AI_Fitting_Room_Analysis.md
│   ├── CarFit_Product_Vision_and_MVP_Spec.md
│   ├── RETROSPECTIVE_2025-11-27.md
│   └── SECURITY_BEST_PRACTICES.md
├── requirements.txt        # Python dependencies
├── vercel.json            # Vercel deployment configuration
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Vercel CLI (optional, for local dev)

### Local Development

1. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1  # Windows PowerShell
   # or
   source venv/bin/activate     # macOS/Linux
   ```

2. **Install Backend Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

4. **Set Environment Variables:**
   Create a `.env` file in the root (never commit this!):
   ```bash
   GEMINI_API_KEY=your-api-key-here
   ```

5. **Run Development Servers:**

   **Backend (Terminal 1):**
   ```bash
   .\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8001
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   .\node_modules\.bin\next dev
   ```

   Access the app at `http://localhost:3000` (or 3001 if 3000 is busy).

### Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variable: `GEMINI_API_KEY`
4. Deploy!

## Documentation

| Document | Description |
|----------|-------------|
| [Product Vision](docs/CarFit_Product_Vision_and_MVP_Spec.md) | Full product requirements and MVP scope |
| [Architecture Design](docs/Architecture_Design.md) | System architecture and tech stack |
| [Competitor Analysis](docs/Benson_AI_Fitting_Room_Analysis.md) | Analysis of similar AI fitting room products |
| [Security Guide](docs/SECURITY_BEST_PRACTICES.md) | Security best practices for this stack |
| [Retrospective](docs/RETROSPECTIVE_2025-11-27.md) | Lessons learned from development |

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.11+
- **AI:** Google Gemini API
- **Deployment:** Vercel (Serverless)

## Security

⚠️ **Never commit API keys or secrets to the repository!**

See [Security Best Practices](docs/SECURITY_BEST_PRACTICES.md) for detailed guidelines.

## License

Private - All rights reserved.
