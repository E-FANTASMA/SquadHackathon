# PayGuard AI - Deployment Guide

This guide explains how to deploy the PayGuard AI platform (Backend & Frontend).

## 1. Backend Deployment (Node.js/Express)
You can deploy the backend to platforms like **Render**, **Railway**, or **Heroku**.

### Steps:
1.  **Environment Variables:** Set the following in your deployment platform:
    ```env
    PORT=5000
    SUPABASE_URL=...
    SUPABASE_KEY=...
    SUPABASE_SERVICE_ROLE_KEY=...
    SQUAD_SECRET_KEY=...
    SQUAD_BASE_URL=https://api-d.squadco.com (Production)
    SQUAD_MERCHANT_ID=...
    FRONTEND_URL=https://your-frontend-domain.com
    DISABLE_AUTH=false
    ```
2.  **Root Directory:** Set the root directory to `backend`.
3.  **Build Command:** `npm install`
4.  **Start Command:** `npm start`

---

## 2. Frontend Deployment (React/Vite)
You can deploy the frontend to **Vercel**, **Netlify**, or **Cloudflare Pages**.

### Steps:
1.  **Environment Variables:** Set `VITE_API_BASE_URL` to your **deployed backend URL** (e.g., `https://payguard-api.onrender.com/api`).
2.  **Root Directory:** Set the root directory to `frontend`.
3.  **Build Command:** `npm run build`
4.  **Output Directory:** `dist`

---

## 3. Database & Storage (Supabase)
Ensure your Supabase project is set up with the required tables and storage buckets:
- **Tables:** `users`, `workers`, `payroll_batches`, `payroll_workers`, `worker_uploads`, `transfers`, `audit_logs`.
- **Buckets:** `payroll_excels`, `statements`, `screenshots`.
- **Policies:** Ensure Row Level Security (RLS) is configured according to your needs.

---

## Local Development
To run both frontend and backend locally:
1.  Run `npm install` in the root directory.
2.  Run `npm run install-all` to install all dependencies.
3.  Run `npm run dev` to start both servers concurrently.

**Frontend:** `http://localhost:5173`  
**Backend:** `http://localhost:5000`
