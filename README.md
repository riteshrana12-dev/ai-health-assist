<div align="center">

<img src="client/src/assets/banner.png" alt="AI Health Assist Banner" width="100%" />

<br/><br/>

<h1>
  <img src="client/public/logo.png" width="10%" alt="logo" />
  &nbsp;AI Health Assist
</h1>

<p><strong>Your intelligent, AI-powered personal health companion</strong><br/>
Track vitals · Analyze medical reports · Detect risks early · Get personalized AI guidance</p>

<p>
  <a href="https://github.com/riteshrana12-dev/ai-health-assist/stargazers">
    <img src="https://img.shields.io/github/stars/riteshrana12-dev/ai-health-assist?style=for-the-badge&logo=github&color=f59e0b&labelColor=1E1E2F" alt="Stars" />
  </a>
  <a href="https://github.com/riteshrana12-dev/ai-health-assist/network/members">
    <img src="https://img.shields.io/github/forks/riteshrana12-dev/ai-health-assist?style=for-the-badge&logo=github&color=3b82f6&labelColor=1E1E2F" alt="Forks" />
  </a>
  <img src="https://img.shields.io/badge/version-1.0.0-22c55e?style=for-the-badge&labelColor=1E1E2F" alt="Version" />
</p>

<br/>
<a href="https://ai-health-assist.vercel.app">
  <img src="https://img.shields.io/badge/%F0%9F%9A%80%20Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&labelColor=1E1E2F" alt="Live Demo" />
</a>
&nbsp;&nbsp;
<a href="https://github.com/riteshrana12-dev/ai-health-assist">
  <img src="https://img.shields.io/badge/%F0%9F%93%A6%20Source%20Code-GitHub-181717?style=for-the-badge&logo=github&labelColor=1E1E2F" alt="Source Code" />
</a>

<br/><br/>

</div>

---

## 📸 Screenshots

| Dashboard | AI Chat Assistant |
|:---------:|:-----------------:|
| ![Dashboard](client/src/assets/dashboard.png) | ![Chat](client/src/assets/chat.png) |

| Medical Report Analyzer | Health Analytics |
|:-----------------------:|:----------------:|
| ![Reports](client/src/assets/reports.png) | ![Analytics](client/src/assets/analytics.png) |

| Landing Page | Health Education |
|:------------:|:----------------:|
| ![Landing](client/src/assets/landing.png) | ![Education](client/src/assets/education.png) |

---

## ✨ Features

### 🤖 AI-Powered Features
- **AI Health Chatbot** — Symptom checker powered by Gemini 2.0 Flash with conversation history and emergency detection.
- **Medical Report Analyzer** — Upload PDF/images; AI explains results in plain patient-friendly language instantly.
- **Risk Prediction Engine** — Full cardiovascular, diabetes & metabolic risk assessment.
- **Smart Insights** — Personalized AI health tips generated from your vitals trend.
- **Health Education Library** — AI explains 36+ diseases across 6 categories.

### 📊 Health Tracking
- **Health Dashboard** — BMI, blood pressure, glucose, and heart rate in one unified view.
- **AI Health Score** — Composite 0–100 score with grade A–F and breakdown analysis.
- **Trend Analytics** — 7/30/90-day animated charts for all logged vitals using Recharts.
- **Medication Tracker** — Schedule management, adherence logging, and dose reminders.
- **Patient Profile** — Secure storage of medical history, allergies, and lifestyle profile.

---

## 🏗️ Architecture

┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│         React 18 + Vite 5 + Tailwind CSS + Framer Motion         │
└─────────────────────────┬────────────────────────────────────────┘
│  HTTPS  /  JWT Bearer Token
┌─────────────────────────▼────────────────────────────────────────┐
│              API GATEWAY  —  Express.js + JWT Middleware          │
│        Helmet  ·  CORS  ·  Rate Limiting  ·  Morgan Logger       │
└──────┬────────────┬────────────┬──────────────┬──────────────────┘
│            │            │              │
┌────▼───┐  ┌────▼────┐  ┌───▼────┐   ┌────▼──────────┐
│  Auth  │  │ Health  │  │  AI    │   │ Reports  Meds │
└────┬───┘  └────┬────┘  └───┬────┘   └────┬──────────┘
│            │            │              │
┌──────▼────────────▼────────────▼──────────────▼──────────────────┐
│                    DATA  &  SERVICES  LAYER                       │
├──────────────────┬─────────────────────┬────────────────────────┤
│   MongoDB Atlas  │   Google Gemini AI  │    Cloudinary CDN      │
└──────────────────┴─────────────────────┴────────────────────────┘


---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 5, Tailwind CSS, Recharts, Framer Motion.
- **Backend:** Node.js, Express.js, JWT, Bcrypt, Multer, Node-Cron.
- **Database:** MongoDB Atlas (Mongoose ODM).
- **AI Services:** Google Gemini 2.0 Flash (Vision + Text Extraction).
- **File Storage:** Cloudinary CDN.
- **Deployment:** Vercel (Frontend), Render (Backend).

---

## 🔑 Environment Variables

### Server — `server/.env`
```env
PORT=10000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.0-flash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=[https://ai-health-assist.vercel.app](https://ai-health-assist.vercel.app)
Client — client/.env
Code snippet
VITE_API_URL=[https://ai-health-assist-backend.onrender.com/api](https://ai-health-assist-backend.onrender.com/api)
VITE_APP_NAME=AI Health Assist
⚡ Quick Start
Clone the repo:

Bash
git clone [https://github.com/riteshrana12-dev/ai-health-assist.git](https://github.com/riteshrana12-dev/ai-health-assist.git)
Backend Setup:

Bash
cd server
npm install
# Add .env variables
npm run dev
Frontend Setup:

Bash
cd client
npm install --legacy-peer-deps
# Add .env variables
npm run dev
🚀 Deployment
Frontend → Vercel
Root Directory: client

Build Command: npm run build

Output Directory: dist

Install Command: npm install --legacy-peer-deps

Backend → Render
Root Directory: server

Build Command: npm install

Start Command: node server.js

Environment Variables: Set PORT=10000 and CLIENT_URL=https://ai-health-assist.vercel.app.

🤝 Contributing
Fork the Project.

Create your Feature Branch (git checkout -b feat/AmazingFeature).

Commit your Changes (git commit -m 'feat: add amazing feature').

Push to the Branch (git push origin feat/AmazingFeature).

Open a Pull Request.

⚠️ Disclaimer
AI Health Assist is for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider regarding any medical condition.
