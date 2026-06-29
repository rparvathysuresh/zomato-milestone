# Zomato AI — Smart Restaurant Recommendations

Welcome to **Zomato AI**, a modern, AI-powered restaurant recommendation engine. Built as a sophisticated Next.js web application, it curates personalized dining experiences by combining rich filtering logic with intelligent analysis from a Large Language Model (LLM).

## Features

- **Intelligent Recommendations**: Goes beyond simple filtering by leveraging Groq's LLM to analyze and rank restaurants based on nuanced user preferences.
- **Smart Filtering Engine**: Robust backend logic pre-filters restaurants by location, budget, and rating before handing them off to the AI.
- **Beautiful UI/UX**: Features a stunning, dark-themed interface built with a custom design system, glassmorphism effects, smooth micro-animations, and a responsive layout.
- **Resilient Architecture**: Implements automatic fallbacks to rule-based filtering if the AI service becomes unavailable, ensuring the application remains functional.
- **Performant**: Optimized with Next.js App Router, caching strategies, and specialized font-loading techniques for an incredibly fast user experience.

## Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Styling**: Vanilla CSS with CSS Variables (No Tailwind)
- **AI Integration**: [Groq API](https://groq.com/) using the `llama-3.3-70b-versatile` model for lightning-fast inference
- **Fonts**: Google Fonts (`Outfit` and `Inter`) via `next/font`

## Setup Instructions

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A [Groq API Key](https://console.groq.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd zomato-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Data Ingestion:**
   Run the data ingestion script to format and prepare the restaurant data.
   ```bash
   node scripts/ingest.js
   ```
   *Note: This creates the `data/zomato_restaurants.json` file used by the application.*

### Environment Variables

Create a `.env.local` file in the root directory and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Open the application in your browser.
2. Select your desired **Location** and **Budget**.
3. (Optional) Provide specific **Cuisine** preferences, a **Minimum Rating**, or any **Extra Preferences** (e.g., "family-friendly", "outdoor seating").
4. Click **"Get Recommendations"**.
5. The AI will analyze your inputs and present a curated list of top restaurants, complete with personalized explanations for why they were chosen.

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).
Ensure you include the `data/zomato_restaurants.json` file in your deployment build process and set the `GROQ_API_KEY` environment variable in your Vercel project settings.

To test the production build locally:

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License.
