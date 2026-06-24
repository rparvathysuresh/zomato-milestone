# Deployment Plan: Vercel (Frontend) & Railway (Backend)

Currently, the Zomato AI Recommendation Engine is a monolithic Next.js application where both the frontend UI and the backend API (`/api/recommend`) live in the same codebase. 

To deploy the **Frontend on Vercel** and the **Backend on Railway**, we will deploy the same repository to both platforms but configure them to handle different responsibilities. We will link them together using environment variables.

---

## 1. Codebase Modifications

Before deploying, we need to ensure the frontend can communicate with a remote backend instead of its own local API routes.

**Changes required in `src/app/page.js`:**
Update the `fetch` call in `fetchRecommendations` to use an environment variable for the API base URL.

```javascript
// Change this:
const res = await fetch('/api/recommend', { ... });

// To this:
const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const res = await fetch(`${apiUrl}/api/recommend`, { ... });
```

Commit and push this change to your GitHub repository before proceeding to the deployment steps.

---

## 2. Backend Deployment (Railway)

Railway will host the Next.js application, but we will solely use it to serve the backend API route.

### Steps:
1. **Create an Account:** Sign up at [Railway.app](https://railway.app/) using your GitHub account.
2. **New Project:** Click **New Project** > **Deploy from GitHub repo**.
3. **Select Repository:** Choose `rparvathysuresh/zomato-milestone`.
4. **Environment Variables:** 
   Go to the **Variables** tab in your Railway project and add your Groq API Key:
   - `GROQ_API_KEY` = `your_actual_groq_api_key_here`
5. **Deploy:** Railway will automatically detect the Next.js environment, build the project, and deploy it.
6. **Generate Domain:** Go to the **Settings** tab > **Networking** and click **Generate Domain**. 
7. **Copy URL:** Save this generated URL (e.g., `https://zomato-milestone-production.up.railway.app`). This is your **Backend URL**.

---

## 3. Frontend Deployment (Vercel)

Vercel will host the Next.js application, but it will be configured to route its API requests to your newly deployed Railway backend.

### Steps:
1. **Create an Account:** Sign up at [Vercel.com](https://vercel.com/) using your GitHub account.
2. **New Project:** Click **Add New...** > **Project**.
3. **Import Repository:** Import `rparvathysuresh/zomato-milestone`.
4. **Environment Variables:**
   In the "Environment Variables" section before clicking Deploy, add the Railway URL you generated in the previous step:
   - `NEXT_PUBLIC_API_URL` = `https://zomato-milestone-production.up.railway.app` *(Replace with your actual Railway URL. Do not include a trailing slash)*
5. **Deploy:** Click **Deploy**. Vercel will build the frontend and deploy it.
6. **Live URL:** Once finished, Vercel will provide you with a live domain (e.g., `https://zomato-milestone.vercel.app`).

---

## 4. Verification & Testing

1. Open your Vercel frontend URL in the browser.
2. Fill out the preference form and click **Get Recommendations**.
3. **Expected Flow:** 
   - Your Vercel frontend sends a POST request to `https://<your-railway-url>/api/recommend`.
   - The Railway backend processes the JSON data, filters it, calls the Groq LLM using the secure `GROQ_API_KEY`, and returns the results.
   - The Vercel frontend displays the AI-powered recommendations.

### Edge Cases
- **CORS Issues:** If the browser blocks the request due to CORS (Cross-Origin Resource Sharing), you will need to update the Railway backend's `route.js` to include CORS headers allowing requests from your Vercel domain.
- **Data File:** Because `zomato_restaurants.json` is committed to the GitHub repository, both Vercel and Railway will have access to it seamlessly during their respective builds.
