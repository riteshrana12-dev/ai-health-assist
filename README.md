# 🏥 AI Health Assist

> **AI-powered personal health companion** — Track vitals, analyze medical reports, detect health risks, and get personalized AI health guidance.

![AI Health Assist Banner](https://img.shields.io/badge/AI%20Health%20Assist-v1.0.0-blue?style=for-the-badge&logo=heart)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Gemini AI](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=flat-square&logo=google)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 Live Demo

| Service    | URL                                      |
|------------|------------------------------------------|
| Frontend   | https://ai-health-assist.vercel.app      |
| Backend API| https://ai-health-assist-api.onrender.com|

**Demo credentials:**
- Email: `demo@aihealth.com`
- Password: `demo1234`

---

## ✨ Features

### Core Features
- 🤖 **AI Health Chatbot** — Symptom checker powered by Google Gemini AI with emergency detection
- 📄 **Medical Report Analyzer** — Upload PDF/images; AI explains results in plain language
- 📊 **Health Dashboard** — BMI, blood pressure, glucose, heart rate tracking with trend charts
- 🎯 **Health Score Engine** — AI-calculated composite health score (0–100) with grade
- 👤 **Patient Profile** — Medical history, allergies, lifestyle, emergency contacts
- 💊 **Medication Tracker** — Schedule management with adherence logging
- 📚 **Health Education** — AI explains diseases in patient-friendly language

### Advanced / Hackathon Features
- 🔮 **AI Risk Prediction** — Full cardiovascular, diabetes, and metabolic risk assessment
- 🚨 **Emergency Detection** — Instant pattern matching for life-threatening symptoms
- 💡 **Smart Insights** — Personalized AI health tips based on your vitals trend
- 🔬 **Drug Interaction Checker** — AI checks your active medications for interactions
- 📈 **Trend Analytics** — 7/30/60/90-day health trend visualization

---

## 🛠️ Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18 + Vite 5 + Tailwind CSS 3 + Framer Motion    |
| Charts     | Recharts 2                                              |
| Backend    | Node.js 18 + Express.js 4                              |
| Database   | MongoDB Atlas + Mongoose 8                              |
| AI         | Google Gemini 1.5 Flash                                 |
| File Storage | Cloudinary + Multer                                   |
| Auth       | JWT + bcryptjs                                          |
| Deployment | Vercel (frontend) + Render (backend)                    |

---

## 📁 Project Structure

```
ai-health-assist/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/         # BPChart, GlucoseChart, BMIGauge, TrendChart
│   │   │   ├── chat/           # MessageBubble, TypingIndicator
│   │   │   ├── common/         # Sidebar, Navbar, DashboardLayout, ProtectedRoute
│   │   │   ├── dashboard/      # HealthScoreCard, VitalsGrid, LogVitalsModal
│   │   │   └── reports/        # UploadZone, ReportCard, AIExplanation
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── hooks/              # useAuth, useHealth, useChat
│   │   ├── pages/              # All 9 pages
│   │   ├── services/           # Axios API service layer
│   │   └── utils/              # formatters, healthCalculators
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                     # Node.js + Express backend
    ├── config/                 # MongoDB + Cloudinary
    ├── controllers/            # auth, health, chat, reports, medications
    ├── middleware/             # JWT auth, error handler, file upload
    ├── models/                 # User, HealthData, Report, Medication
    ├── routes/                 # All API routes
    ├── services/               # geminiService, healthScoreService, riskPrediction
    ├── utils/                  # generateToken, healthCalculators
    └── server.js
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google Gemini API key (free at [makersuite.google.com](https://makersuite.google.com))
- Cloudinary account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ai-health-assist.git
cd ai-health-assist
```

### 2. Setup Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values (see Environment Variables section)
npm run dev
```

### 3. Setup Frontend

```bash
cd client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### 4. Open in browser

```
Frontend: http://localhost:5173
Backend:  http://localhost:5000/api/health
```

---

## 🔑 Environment Variables

### Server (`server/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai-health-assist

# JWT
JWT_SECRET=your_64_char_random_secret_here
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=AI Health Assist
```

---

## 📡 API Reference

### Authentication
| Method | Route                       | Description            | Auth     |
|--------|-----------------------------|------------------------|----------|
| POST   | `/api/auth/register`        | Register new user      | Public   |
| POST   | `/api/auth/login`           | Login, get JWT token   | Public   |
| GET    | `/api/auth/profile`         | Get current user       | JWT      |
| PUT    | `/api/auth/profile`         | Update profile         | JWT      |
| POST   | `/api/auth/profile/avatar`  | Upload avatar          | JWT      |
| PUT    | `/api/auth/change-password` | Change password        | JWT      |

### Health Data
| Method | Route                       | Description            | Auth     |
|--------|-----------------------------|------------------------|----------|
| POST   | `/api/health-data`          | Log vitals             | JWT      |
| GET    | `/api/health-data/dashboard`| Dashboard summary      | JWT      |
| GET    | `/api/health-data/analytics`| Trend data (?days=30)  | JWT      |
| GET    | `/api/health-data/history`  | Paginated history      | JWT      |

### AI Chat
| Method | Route                       | Description            | Auth     |
|--------|-----------------------------|------------------------|----------|
| POST   | `/api/chat/message`         | Send chat message      | JWT      |
| GET    | `/api/chat/insights`        | AI dashboard insights  | JWT      |
| POST   | `/api/chat/risk-predict`    | Full risk assessment   | JWT      |
| POST   | `/api/chat/explain`         | Explain a condition    | JWT      |
| POST   | `/api/chat/emergency-check` | Emergency detection    | JWT      |

### Reports
| Method | Route                        | Description            | Auth     |
|--------|------------------------------|------------------------|----------|
| POST   | `/api/reports/upload`        | Upload + AI analyze    | JWT      |
| GET    | `/api/reports`               | List all reports       | JWT      |
| DELETE | `/api/reports/:id`           | Delete report          | JWT      |
| POST   | `/api/reports/:id/analyze`   | Re-analyze with AI     | JWT      |

---

## 🚀 Deployment

### Frontend → Vercel

```bash
cd client
npm run build

# Deploy with Vercel CLI
npx vercel --prod

# Set environment variable in Vercel dashboard:
# VITE_API_URL = https://your-backend.onrender.com/api
```

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect your repository
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add all environment variables from `server/.env.example`
6. Deploy 🚀

### MongoDB Atlas Setup

1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create database user with read/write permissions
3. Add `0.0.0.0/0` to Network Access (for Render deployment)
4. Copy connection string to `MONGODB_URI`

---

## 🎯 Hackathon Highlights

| Category        | Implementation                                                      |
|-----------------|---------------------------------------------------------------------|
| **Innovation**  | AI risk prediction, emergency symptom detection, report OCR+AI      |
| **UI/UX**       | Glassmorphism dark theme, Framer Motion animations, responsive      |
| **Functionality**| 9 pages, 8 AI endpoints, full CRUD, real-time polling              |
| **Code Quality**| Clean architecture, error boundaries, async handlers, typed models  |
| **Scalability** | MongoDB Atlas, Cloudinary CDN, rate limiting, modular services      |

---

## 👥 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## ⚠️ Disclaimer

AI Health Assist is for **educational and informational purposes only**. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.

---

<p align="center">Built with ❤️ for better healthcare accessibility · Powered by Google Gemini AI</p>
