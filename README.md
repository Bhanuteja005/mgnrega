# 🌾 MGNREGA Dashboard - "Our Voice, Our Rights"

> **हमारी आवाज़, हमारे अधिकार** | A beautiful, accessible dashboard to track MGNREGA employment data across Uttar Pradesh districts.

---

## 📖 What is This Project?

This is a **web application** that makes MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act) data accessible to everyone, especially rural citizens with low digital literacy. 

Instead of complex government websites, users can:
- 🗺️ **Select their district** from a simple list
- 📊 **See employment data** in easy-to-understand charts and cards
- 🔊 **Listen to information in Hindi** using text-to-speech
- 📱 **Use it on their mobile phones** - it's fully responsive!

---

## 🎯 Key Features

### For Users:
- ✅ **Simple District Selection** - Just click on your district
- ✅ **Visual Data Cards** - Big numbers with emojis (🏠 for households, 💰 for wages)
- ✅ **Hindi Audio Explanations** - Press a button to hear data explained in Hindi
- ✅ **Beautiful Charts** - See 12 months of employment trends at a glance
- ✅ **Auto-Location Detection** - Automatically find your district (bonus feature!)
- ✅ **Fast & Responsive** - Works smoothly on phones, tablets, and computers

### Technical Highlights:
- ⚡ **Next.js 14** - Lightning-fast React framework
- 🎨 **Modern UI** - Clean white and blue theme with Poppins & Inter fonts
- 🗄️ **MongoDB** - Stores 320+ records from 73 districts
- 🔄 **Smart Caching** - Fast data loading with in-memory cache
- 📈 **Recharts** - Beautiful, interactive charts
- 🚀 **Loading Bar** - Instant feedback when navigating (NProgress)

---

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, make sure you have these installed on your computer:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Check if installed: Open terminal/PowerShell and type `node --version`

2. **MongoDB Account** (Free)
   - Sign up at: https://www.mongodb.com/cloud/atlas
   - You'll need a connection string (looks like `mongodb+srv://...`)

3. **Data.gov.in API Key** (Free)
   - Get it from: https://data.gov.in/

---

## 📥 Installation Steps

### Step 1: Download the Project

```bash
# If you have Git installed:
git clone https://github.com/yourusername/mgnrega-dashboard.git
cd mgnrega-dashboard

# OR simply download and extract the ZIP file
```

### Step 2: Install Dependencies

Open your terminal/PowerShell in the project folder and run:

```bash
npm install
```

This will download all the required packages (it takes 1-2 minutes).

### Step 3: Configure Environment Variables

1. Create a file named `.env` in the project root folder
2. Copy and paste this template:

```env
# MongoDB Connection (Get this from MongoDB Atlas)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/mgnrega?retryWrites=true&w=majority

# Data.gov.in API Credentials (Get from data.gov.in)
DATA_GOV_API_KEY=your_api_key_here
DATA_GOV_USERNAME=your_username_here
```

3. Replace the placeholder values with your actual credentials

### Step 4: Load Data into Database

Run the ETL (Extract, Transform, Load) script to fetch data from data.gov.in:

```bash
npm run etl
```

This will:
- Fetch MGNREGA data for all Uttar Pradesh districts
- Store it in your MongoDB database
- Takes about 1-2 minutes
- You'll see progress like: "Inserted 294 records, Updated 26 records"

### Step 5: Start the Development Server

```bash
npm run dev
```

The app will start on **http://localhost:3000** (or 3001 if 3000 is busy).

### Step 6: Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

You should see the homepage with 73 districts! 🎉

---

## 📂 Project Structure

Here's what's in the project (simplified view):

```
mgnrega/
├── app/                          # Main application pages
│   ├── page.tsx                  # Home page (district list)
│   ├── district/[id]/page.tsx    # District detail page
│   ├── layout.tsx                # Main layout with fonts
│   └── globals.css               # Global styles
│
├── components/                   # Reusable UI components
│   └── navigation-events.tsx     # Loading bar handler
│
├── lib/                          # Utilities and helpers
│   ├── db.ts                     # MongoDB connection
│   ├── models/                   # Database schemas
│   ├── cache.ts                  # In-memory caching
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Helper functions
│
├── scripts/                      # Data loading scripts
│   └── etl-fetch-mgnrega.ts      # Fetches data from data.gov.in
│
├── app/api/                      # API routes
│   ├── health/                   # Database health check
│   ├── states/                   # Get list of states
│   ├── districts/                # Get districts and their data
│   └── compare/                  # Compare two districts
│
├── .env                          # Your environment variables (YOU CREATE THIS)
├── package.json                  # Project dependencies
└── README.md                     # This file!
```

---

## 🛠️ Available Commands

Run these in your terminal:

| Command | What it does |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run etl` | Fetch latest data from data.gov.in |
| `npm run lint` | Check code for errors |

---

## 📊 API Endpoints

Your dashboard has these API routes:

### 1. Health Check
```
GET /api/health
```
Check if the database is connected.

### 2. Get All Districts
```
GET /api/districts?state=UTTAR PRADESH
```
Returns list of 73 districts with their latest data.

### 3. Get District Summary
```
GET /api/districts/[district-name]/summary
```
Returns detailed metrics and 12-month trends for a specific district.

Example: `/api/districts/LUCKNOW/summary`

### 4. Compare Districts
```
GET /api/compare?district1=LUCKNOW&district2=KANPUR NAGAR
```
Compare two districts side by side.

---

## 🎨 Design Philosophy

### For Low-Literacy Users:

1. **Visual First** 
   - Big numbers with emojis
   - Color-coded cards (green = households, blue = workers)
   - Icons for everything

2. **Bilingual**
   - Everything in Hindi + English
   - Audio explanations in Hindi

3. **Simple Navigation**
   - One task per page
   - Large, touch-friendly buttons (44px minimum)
   - Clear back buttons

4. **Mobile-First**
   - Works perfectly on small screens
   - Responsive grid layouts
   - Touch-optimized

---

## 📚 Technologies Used

- **Frontend:** Next.js 14 (React), TypeScript, Tailwind CSS 4.0
- **Backend:** Next.js API Routes, MongoDB, Mongoose
- **Charts:** Recharts
- **Icons:** Lucide React
- **Fonts:** Inter (body), Poppins (headings)
- **Loading Bar:** NProgress
- **Audio:** Web Speech API (Browser native)


---

## 📝 Data Source

All data comes from:
- **Source:** data.gov.in MGNREGA Open API
- **State:** Uttar Pradesh (73 districts)
- **Records:** 320+ monthly performance metrics
- **Update Frequency:** Run `npm run etl` to fetch latest data
