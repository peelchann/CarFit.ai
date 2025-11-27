# CarFit Security Best Practices Guide

**Last Updated:** November 27, 2025  
**Stack:** Next.js (Frontend) + FastAPI (Backend) + Google Gemini AI + Vercel

---

## Table of Contents
1. [API Keys & Secrets Management](#1-api-keys--secrets-management)
2. [Environment Variables](#2-environment-variables)
3. [CORS Configuration](#3-cors-configuration)
4. [Input Validation & Sanitization](#4-input-validation--sanitization)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [File Upload Security](#6-file-upload-security)
7. [Git & Version Control Security](#7-git--version-control-security)
8. [Deployment Security](#8-deployment-security)
9. [Monitoring & Incident Response](#9-monitoring--incident-response)
10. [Security Checklist](#10-security-checklist)

---

## 1. API Keys & Secrets Management

### ❌ NEVER DO THIS
```python
# WRONG - Hardcoded API key
GEMINI_API_KEY = "AIzaSyAp5Tjw7_qH8h_TzpPbEJaW9yhYNa0HpR0"
```

### ✅ ALWAYS DO THIS
```python
# CORRECT - Read from environment variable
import os
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")
```

### Key Management Rules
| Rule | Description |
|------|-------------|
| **Never commit keys** | API keys, tokens, passwords should NEVER be in code |
| **Use env variables** | Always read secrets from environment variables |
| **Rotate regularly** | Rotate API keys every 90 days minimum |
| **Limit scope** | Use API key restrictions (IP, referrer, API) |
| **Monitor usage** | Set up billing alerts and usage monitoring |
| **Revoke immediately** | If a key is exposed, revoke it within minutes |

### Google Cloud API Key Restrictions
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "Application restrictions":
   - For backend: Restrict to IP addresses
   - For frontend: Restrict to HTTP referrers (your domain)
4. Under "API restrictions":
   - Restrict to only the APIs you need (e.g., Generative Language API)

---

## 2. Environment Variables

### Local Development
Create a `.env.local` file (automatically ignored by git):
```bash
# .env.local (NEVER commit this file)
GEMINI_API_KEY=your-key-here
REPLICATE_API_TOKEN=your-token-here
DATABASE_URL=postgres://user:pass@localhost:5432/db
```

### Vercel Production
Add environment variables in Vercel Dashboard:
1. Go to Project → Settings → Environment Variables
2. Add each variable with appropriate scope (Production/Preview/Development)
3. Use "Sensitive" flag for secrets

### .gitignore Must Include
```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.development

# IDE
.idea/
.vscode/settings.json

# Logs that might contain secrets
*.log
npm-debug.log*
```

---

## 3. CORS Configuration

### ❌ INSECURE (Development Only)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # DANGEROUS in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### ✅ SECURE (Production)
```python
import os

# Define allowed origins based on environment
ALLOWED_ORIGINS = [
    "https://carfit.ai",
    "https://www.carfit.ai",
    "https://carfit-ai.vercel.app",
]

# Add localhost only in development
if os.environ.get("ENVIRONMENT") == "development":
    ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Only methods you need
    allow_headers=["Content-Type", "Authorization"],  # Only headers you need
)
```

---

## 4. Input Validation & Sanitization

### FastAPI Request Validation
```python
from pydantic import BaseModel, Field, validator
from typing import Optional
import re

class GenerateRequest(BaseModel):
    image_url: str = Field(..., max_length=10_000_000)  # Limit base64 size
    part_id: str = Field(..., min_length=1, max_length=50)
    prompt: str = Field(default="", max_length=1000)
    
    @validator('part_id')
    def validate_part_id(cls, v):
        if not re.match(r'^[a-zA-Z0-9\-_]+$', v):
            raise ValueError('Invalid part_id format')
        return v
    
    @validator('prompt')
    def sanitize_prompt(cls, v):
        # Remove potentially dangerous characters
        dangerous_patterns = ['<script', 'javascript:', 'onerror=']
        for pattern in dangerous_patterns:
            if pattern.lower() in v.lower():
                raise ValueError('Invalid prompt content')
        return v.strip()
```

### Frontend Input Validation
```typescript
// Validate file before upload
const validateImage = (file: File): boolean => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > MAX_SIZE) {
    alert('File too large. Maximum size is 10MB.');
    return false;
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    alert('Invalid file type. Only JPG, PNG, and WebP are allowed.');
    return false;
  }
  
  return true;
};
```

---

## 5. Authentication & Authorization

### For MVP (Session-Based)
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets

security = HTTPBearer()

# Simple session store (use Redis in production)
sessions = {}

def get_current_session(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    return sessions[token]
```

### Rate Limiting
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/generate")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def generate_image(request: Request, data: GenerateRequest):
    # ... your code
```

---

## 6. File Upload Security

### Backend Validation
```python
import magic
from PIL import Image
import io

ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DIMENSIONS = (4096, 4096)

def validate_image_upload(file_bytes: bytes) -> bool:
    # Check file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("File too large")
    
    # Check MIME type using magic bytes (not just extension)
    mime_type = magic.from_buffer(file_bytes, mime=True)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Invalid file type: {mime_type}")
    
    # Validate it's actually an image
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()
        
        # Check dimensions
        if img.size[0] > MAX_DIMENSIONS[0] or img.size[1] > MAX_DIMENSIONS[1]:
            raise ValueError("Image dimensions too large")
            
    except Exception as e:
        raise ValueError(f"Invalid image: {str(e)}")
    
    return True
```

### Secure File Storage
```python
import hashlib
import uuid

def generate_secure_filename(original_filename: str) -> str:
    """Generate a secure filename that doesn't expose original name"""
    ext = original_filename.rsplit('.', 1)[-1].lower()
    if ext not in ['jpg', 'jpeg', 'png', 'webp']:
        ext = 'jpg'
    
    unique_id = uuid.uuid4().hex
    return f"{unique_id}.{ext}"
```

---

## 7. Git & Version Control Security

### Pre-commit Hooks
Install `pre-commit` to catch secrets before they're committed:

```bash
pip install pre-commit
```

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: detect-private-key
```

Run:
```bash
pre-commit install
pre-commit run --all-files
```

### If You Accidentally Commit a Secret
1. **Immediately revoke the secret** (most important!)
2. Remove from code and push
3. Consider using `git filter-branch` or BFG Repo-Cleaner to remove from history
4. Force push (coordinate with team)
5. Notify affected parties

```bash
# Using BFG Repo-Cleaner (easier than git filter-branch)
java -jar bfg.jar --replace-text passwords.txt repo.git
cd repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

---

## 8. Deployment Security

### Vercel Security Headers
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

### Next.js Security Headers
Add to `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 9. Monitoring & Incident Response

### Logging (Don't Log Secrets!)
```python
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WRONG - logs sensitive data
logger.info(f"User authenticated with token: {token}")

# CORRECT - mask sensitive data
logger.info(f"User authenticated with token: {token[:8]}...")
```

### Error Handling (Don't Expose Internal Details)
```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Log the full error internally
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    
    # Return generic message to user
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."}
    )
```

### Incident Response Checklist
1. **Detect** - Set up alerts for unusual activity
2. **Contain** - Revoke compromised credentials immediately
3. **Investigate** - Check logs for scope of breach
4. **Remediate** - Fix the vulnerability
5. **Recover** - Restore from clean backup if needed
6. **Document** - Write post-mortem for future reference

---

## 10. Security Checklist

### Before Every Commit
- [ ] No API keys, tokens, or passwords in code
- [ ] No hardcoded URLs with credentials
- [ ] No debug/test credentials
- [ ] `.env` files are in `.gitignore`

### Before Every Deploy
- [ ] Environment variables set in Vercel
- [ ] CORS configured for production domains only
- [ ] Debug mode disabled
- [ ] Error messages don't expose internal details
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Weekly/Monthly
- [ ] Review API key usage and billing
- [ ] Check for unused API keys and revoke them
- [ ] Update dependencies (`npm audit`, `pip-audit`)
- [ ] Review access logs for anomalies
- [ ] Test backup and recovery procedures

### Quarterly
- [ ] Rotate all API keys
- [ ] Review and update security policies
- [ ] Conduct security audit
- [ ] Update this document

---

## Quick Reference Commands

```bash
# Check for secrets in git history
git log -p | grep -E "(api[_-]?key|secret|password|token)" -i

# Scan for vulnerabilities in Python dependencies
pip install pip-audit
pip-audit

# Scan for vulnerabilities in Node dependencies
npm audit
npm audit fix

# Check for exposed secrets
pip install detect-secrets
detect-secrets scan

# Generate secure random key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google Cloud Security Best Practices](https://cloud.google.com/docs/security/best-practices)
- [Vercel Security](https://vercel.com/docs/security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

**Remember:** Security is not a one-time task. It's an ongoing process. When in doubt, assume the worst and protect accordingly.

