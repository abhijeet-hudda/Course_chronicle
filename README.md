# Course Chronicle

Course Chronicle is a full-stack study platform for uploading question papers, discovering course-specific material, and unlocking expert-verified answers with credits.

It combines a React single-page application with an Express and MongoDB API. Authentication uses JWTs stored in httpOnly cookies, so users stay signed in securely without the frontend handling tokens directly.

## Features

- Account signup and login with cookie-based authentication
- Course selection during signup; selected courses can be removed before registration
- Personal dashboard with course-relevant content
- Question-paper browsing, search, and course tracking
- Authenticated paper uploads for images and PDFs
- Credit-based answer unlocking
- Razorpay payment flow for credit top-ups
- Markdown answers with GitHub-flavored Markdown and LaTeX math support
- Responsive UI built with React, Vite, and Tailwind CSS

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Authentication | JWT, httpOnly cookies, bcrypt |
| Uploads | Multer and Cloudinary |
| Payments | Razorpay |
| Content rendering | React Markdown, KaTeX |

## Project structure

```text
Course_chronicle/
├── backend/                 # Express API and MongoDB models
│   ├── src/controllers/     # Auth, questions, courses, and payments
│   ├── src/routes/          # REST API routes
│   ├── src/models/          # Mongoose schemas
│   └── src/scripts/         # Course-data seeding script
└── frontend/                # React + Vite application
    └── src/
        ├── api/             # Axios API clients
        ├── components/      # UI features and pages
        └── store/           # Redux authentication state
```

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A MongoDB database (local or Atlas)
- Cloudinary account for paper uploads
- Gemini API key for question processing
- Razorpay test or live credentials for payments

## Getting started

1. Clone the repository and open its folder.

2. Install backend dependencies.

   ```bash
   cd backend
   npm install
   ```

3. Create `backend/.env` with the required values.

   ```env
   PORT=8000
   # Do not append a database name: the app adds Course_chronicle_project.
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_EXPIRY=1d
   CORS_ORIGIN=http://localhost:5173

   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   GEMINI_KEY=your-gemini-api-key

   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   ```

4. Seed the course catalogue. Run this once for a new database.

   ```bash
   npm run seed
   ```

5. Start the backend API.

   ```bash
   npm run dev
   ```

   The API starts at `http://localhost:8000`; its health check is available at `GET /api/v1/health`.

6. In a second terminal, install and start the frontend.

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. Open the URL shown by Vite (normally `http://localhost:5173`). The frontend defaults to `http://localhost:8000/api/v1` for its API requests.

### Optional frontend environment variables

Create `frontend/.env` only when the API or Razorpay public key differs from the defaults.

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

## Available commands

| Location | Command | Description |
| --- | --- | --- |
| `backend` | `npm run dev` | Start the API with Nodemon |
| `backend` | `npm start` | Start the API with Node.js |
| `backend` | `npm run seed` | Seed the course collection when it is empty |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run lint` | Run ESLint |
| `frontend` | `npm run build` | Create a production build |
| `frontend` | `npm run preview` | Preview the production build |

## API overview

All endpoints are prefixed with `/api/v1` and return a consistent JSON response envelope.

| Area | Endpoints |
| --- | --- |
| Users | `POST /users/signup`, `POST /users/login`, `POST /users/logout`, `GET /users/profile` |
| Courses | `GET /courses` |
| Papers | `GET /questions/getPapers`, `POST /questions/uploadPaper`, `GET /questions/dashboard` |
| Answers | `POST /users/getUnlockedAnswers`, `POST /users/unlockAnswer` |
| Payments | `POST /payments/makePayment`, `POST /payments/validatePayment` |

Routes that access user data, upload papers, unlock answers, or handle payments require a valid authentication cookie.

## Security notes

- Never commit `.env` files, API keys, database credentials, or payment secrets.
- Keep `CORS_ORIGIN` restricted to trusted frontend URLs in production.
- Serve the frontend and API over HTTPS in production so secure cookies and payment requests are protected.
- Configure production cookie settings and deployment URLs before releasing the application publicly.

## Deploying to Render and Vercel

Deploy the API to Render from the `backend` directory and the frontend to Vercel from the `frontend` directory.

### Render (backend)

Use these service settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | `backend` |
| Build command | `npm ci` |
| Start command | `npm start` |

Do **not** use `npm run dev` on Render. It runs Nodemon, which is a development dependency and is not installed in production deployments.

In Render's **Environment** tab, add the values from `backend/.env.example` with these production changes:

```env
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-project.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
JWT_SECRET=<a-long-random-secret>
JWT_EXPIRY=1d
COOKIE_MAX_AGE_MS=86400000
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
GEMINI_KEY=<gemini-api-key>
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
```

Do not set `PORT` on Render; it supplies this value automatically. `CORS_ORIGIN` must be the exact Vercel URL, without a trailing `/`. Add comma-separated origins if you use both a preview and production frontend.

### Vercel (frontend)

Set Vercel's root directory to `frontend`, then add these environment variables in **Settings → Environment Variables**:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

Redeploy Vercel after adding or changing a `VITE_` variable. Never put `RAZORPAY_KEY_SECRET`, database credentials, Cloudinary secrets, or `JWT_SECRET` in Vercel's frontend environment variables.

## Development notes

- The signup flow fetches available courses from the API. Users can add up to five courses and remove any selection before submitting.
- After a successful signup or login, Redux stores the authenticated user ID and the app redirects to the dashboard.
- Socket.IO is initialized on the backend for future real-time features; no events are currently emitted by the application.

## License

No license has been specified yet. Add a `LICENSE` file before distributing or open-sourcing the project.
