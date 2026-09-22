# 📰 Real News — Full-Stack News Aggregation Platform

A modern, runnable full-stack news web application featuring real-time aggregation from [NewsAPI.org](https://newsapi.org), 10-minute MySQL response caching, authenticated user bookmarks, an interactive zero-manual-coding setup wizard, and a responsive React (Vite) frontend.

---

## ⚡ Quick Start: From Clone to Running in 3 Steps

Prerequisites: **Node.js (v18+)** and **MySQL** installed on your machine.

### Step 0: Install All Dependencies

From the repository root, install dependencies for both the Express backend and React frontend:

```bash
npm run install:all
```

*(Alternatively, run `cd server && npm install` then `cd ../client && npm install`)*

---

### Step 1: Run the Interactive Setup Wizard

Run the interactive setup CLI from the root:

```bash
npm run setup
```

The wizard will:
1. Print a registration link to obtain a free [NewsAPI.org API Key](https://newsapi.org/register).
2. Prompt you to enter your API key.
3. Prompt for your MySQL credentials (`host`, `user`, `password`, `database name`).
4. Connect to MySQL, automatically execute `CREATE DATABASE IF NOT EXISTS`, and apply `server/schema.sql` (creating `users`, `saved_articles`, and `news_cache` tables).
5. Automatically generate and write `/server/.env` with secure secrets.

> [!NOTE]
> If you start the backend before running setup, `server.js` will detect missing credentials and print a clear message instructing you to run `npm run setup`, exiting cleanly without crashing silently.

---

### Step 2: Start Backend and Frontend

Open two terminal windows:

#### Terminal 1 — Start Backend Server:
```bash
npm run server
```
*(Runs Express with automatic reload on `http://localhost:5000`)*

#### Terminal 2 — Start Frontend Client:
```bash
npm run client
```
*(Runs Vite development server on `http://localhost:5173`)*

Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🏗 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Axios, React Router v6, Lucide Icons, Plain Vanilla Modern CSS |
| **Backend** | Node.js, Express.js, CORS, Morgan, Dotenv |
| **Database** | MySQL with `mysql2/promise` connection pooling |
| **Data Source** | [NewsAPI.org](https://newsapi.org) (`/v2/top-headlines` & `/v2/everything`) |
| **Authentication** | JSON Web Tokens (JWT) with salted `bcryptjs` password hashing |

---

## 🗄 Database Schema (`server/schema.sql`)

### 1. `users`
Stores user profile credentials:
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `name` (VARCHAR(255) NOT NULL)
- `email` (VARCHAR(255) NOT NULL UNIQUE)
- `password_hash` (VARCHAR(255) NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### 2. `saved_articles`
User bookmarks collection:
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY referencing `users(id)` ON DELETE CASCADE)
- `title` (VARCHAR(500) NOT NULL)
- `description` (TEXT)
- `url` (VARCHAR(1000) NOT NULL)
- `image_url` (VARCHAR(1000))
- `source_name` (VARCHAR(255))
- `category` (VARCHAR(50) DEFAULT 'general')
- `published_at` (DATETIME)
- `saved_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- *Constraint*: `UNIQUE KEY (user_id, url(255))` ensures no duplicate bookmarks per user.

### 3. `news_cache`
10-minute caching layer to protect NewsAPI rate limits:
- `id` (INT AUTO_INCREMENT PRIMARY KEY)
- `category` (VARCHAR(50))
- `query_key` (VARCHAR(255) NOT NULL UNIQUE)
- `response_json` (MEDIUMTEXT NOT NULL)
- `fetched_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

---

## 🔌 API Endpoints Summary

### News
- `GET /api/news?category=technology|sports|all&page=1&pageSize=12` — Retrieves headlines. Checks `news_cache` first (< 10 min old); if missing or stale, calls NewsAPI, updates MySQL cache, and returns structured articles.
- `GET /api/news/search?q=&category=&page=1` — Search articles by keyword with category filtering and caching.

### Authentication
- `POST /api/auth/register` — Creates user account, hashes password with `bcrypt`, returns JWT and user payload.
- `POST /api/auth/login` — Verifies password, returns signed JWT.
- `GET /api/auth/me` — Protected endpoint returning current user profile.

### Bookmarks (JWT Protected)
- `GET /api/bookmarks` — Returns all saved articles for the authenticated user.
- `POST /api/bookmarks` — Saves an article to the user's bookmarks.
- `DELETE /api/bookmarks/:id` — Deletes a bookmark by ID.

### Health
- `GET /api/health` — Returns server uptime and MySQL database connection status.

---

## 🎨 Frontend Features

- **Top Stories Feed**: Seamlessly interleaves Technology and Sports headlines.
- **Dedicated Category Feeds**: Fast navigation between Tech (`#3b82f6`) and Sports (`#10b981`) with distinct badge styling.
- **Search Experience**: Instant keyword search with category filtering and URL synchronization.
- **Article Detail Preview**: Reader view with full headline, publisher attribution, bookmark button, share link, and a direct button opening the original publisher article in a new tab.
- **Saved Articles (Bookmarks)**: Synchronized with MySQL backend, providing instant bookmarking and one-click removal.
- **Loading Skeletons**: Shimmer placeholders matching card dimensions to eliminate Cumulative Layout Shifts (CLS).
- **Responsive Design**: Fluid CSS grid adapting from mobile screens to wide desktop monitors.

---

## 🚀 Deployment

When deploying ANEWS to production hosting environments (e.g. Vercel, Render, Railway, AWS, DigitalOcean), set the following environment variables:

### Backend Environment Variables (`/server` or Hosting Environment)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | HTTP port the server listens on | `5001` or `5000` |
| `NODE_ENV` | Runtime environment | `production` |
| `NEWS_API_KEY` | Primary API Key from [NewsAPI.org](https://newsapi.org/register) | `your_newsapi_key` |
| `NEWSDATA_API_KEY` | Secondary API Key from [NewsData.io](https://newsdata.io/register) | `your_newsdata_key` |
| `COUNTRY_CODE` | Primary default country edition (`in` for India) | `in` |
| `CLIENT_URL` | Frontend domain(s) for CORS access (comma-separated if multiple) | `https://your-domain.vercel.app` |
| `DB_HOST` | MySQL database host address | `localhost` or cloud DB endpoint |
| `DB_PORT` | MySQL connection port | `3306` |
| `DB_USER` | MySQL database user | `root` or cloud user |
| `DB_PASSWORD` | MySQL database password | `your_password` |
| `DB_NAME` | MySQL database name | `real_news_db` |
| `JWT_SECRET` | Cryptographic secret key for signing user auth tokens | Strong 64-char random string |
| `REFRESH_INTERVAL_MINUTES` | Background news cache refresh interval in minutes (safeguarding quotas) | `60` |
| `LOG_LEVEL` | Winston logging level (`info`, `warn`, `error`, `debug`) | `info` |

### Frontend Environment Variables (`/client` or Vercel Frontend)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend REST API | `/api` (if proxied/rewritten) or `https://api.your-domain.com/api` |
| `VITE_BACKEND_URL` | Development proxy target for Vite dev server | `http://localhost:5001` |

### Production Build Verification

To confirm that the frontend production bundle builds cleanly without errors:

```bash
npm --prefix client run build
```

This generates an optimized, code-split `/client/dist` directory ready for static hosting.

