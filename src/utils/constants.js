/**
 * Application Constants
 *
 * Exports lists of supported cities, cuisines, budget tiers,
 * and other app-wide values. These lists are derived from the
 * actual dataset produced by `scripts/ingest.js`.
 */

// ---------------------------------------------------------------------------
// Budget Tiers
// ---------------------------------------------------------------------------

/**
 * Available budget tier options.
 * Mapping: low ≤ ₹500 | medium ₹501–1500 | high > ₹1500
 */
export const BUDGET_TIERS = ['low', 'medium', 'high'];

export const BUDGET_LABELS = {
  low: '₹0 – ₹500',
  medium: '₹501 – ₹1,500',
  high: '₹1,500+',
};

// ---------------------------------------------------------------------------
// Supported Cities (derived from dataset — 94 locations)
// ---------------------------------------------------------------------------

export const SUPPORTED_CITIES = [
  'banashankari',
  'banaswadi',
  'bannerghatta road',
  'basavanagudi',
  'basaveshwara nagar',
  'bellandur',
  'bommanahalli',
  'brigade road',
  'brookefield',
  'btm',
  'central bangalore',
  'church street',
  'city market',
  'commercial street',
  'cunningham road',
  'cv raman nagar',
  'domlur',
  'east bangalore',
  'ejipura',
  'electronic city',
  'frazer town',
  'hbr layout',
  'hebbal',
  'hennur',
  'hosur road',
  'hsr',
  'indiranagar',
  'infantry road',
  'itpl main road, whitefield',
  'jakkur',
  'jalahalli',
  'jayanagar',
  'jeevan bhima nagar',
  'jp nagar',
  'kaggadasapura',
  'kalyan nagar',
  'kammanahalli',
  'kanakapura road',
  'kengeri',
  'koramangala',
  'koramangala 1st block',
  'koramangala 2nd block',
  'koramangala 3rd block',
  'koramangala 4th block',
  'koramangala 5th block',
  'koramangala 6th block',
  'koramangala 7th block',
  'koramangala 8th block',
  'kr puram',
  'kumaraswamy layout',
  'langford town',
  'lavelle road',
  'magadi road',
  'majestic',
  'malleshwaram',
  'marathahalli',
  'mg road',
  'mysore road',
  'nagarbhavi',
  'nagawara',
  'new bel road',
  'north bangalore',
  'old airport road',
  'old madras road',
  'peenya',
  'race course road',
  'rajajinagar',
  'rajarajeshwari nagar',
  'rammurthy nagar',
  'residency road',
  'richmond road',
  'rt nagar',
  'sadashiv nagar',
  'sahakara nagar',
  'sanjay nagar',
  'sankey road',
  'sarjapur road',
  'seshadripuram',
  'shanti nagar',
  'shivajinagar',
  'south bangalore',
  'st. marks road',
  'thippasandra',
  'ulsoor',
  'uttarahalli',
  'varthur main road, whitefield',
  'vasanth nagar',
  'vijay nagar',
  'west bangalore',
  'whitefield',
  'wilson garden',
  'yelahanka',
  'yeshwantpur',
];

// ---------------------------------------------------------------------------
// Supported Cuisines (derived from dataset — 108 cuisines)
// ---------------------------------------------------------------------------

export const SUPPORTED_CUISINES = [
  'Afghan',
  'Afghani',
  'African',
  'American',
  'Andhra',
  'Arabian',
  'Asian',
  'Assamese',
  'Australian',
  'Awadhi',
  'BBQ',
  'Bakery',
  'Bar Food',
  'Belgian',
  'Bengali',
  'Beverages',
  'Bihari',
  'Biryani',
  'Bohri',
  'British',
  'Bubble Tea',
  'Burger',
  'Burmese',
  'Cafe',
  'Cantonese',
  'Charcoal Chicken',
  'Chettinad',
  'Chinese',
  'Coffee',
  'Continental',
  'Desserts',
  'Drinks Only',
  'European',
  'Fast Food',
  'Finger Food',
  'French',
  'German',
  'Goan',
  'Greek',
  'Grill',
  'Gujarati',
  'Healthy Food',
  'Hot dogs',
  'Hyderabadi',
  'Ice Cream',
  'Indian',
  'Indonesian',
  'Iranian',
  'Italian',
  'Japanese',
  'Jewish',
  'Juices',
  'Kashmiri',
  'Kebab',
  'Kerala',
  'Konkan',
  'Korean',
  'Lebanese',
  'Lucknowi',
  'Maharashtrian',
  'Malaysian',
  'Malwani',
  'Mangalorean',
  'Mediterranean',
  'Mexican',
  'Middle Eastern',
  'Mithai',
  'Modern Indian',
  'Momos',
  'Mongolian',
  'Mughlai',
  'Naga',
  'Nepalese',
  'North Eastern',
  'North Indian',
  'Oriya',
  'Paan',
  'Pan Asian',
  'Parsi',
  'Pizza',
  'Portuguese',
  'Rajasthani',
  'Raw Meats',
  'Roast Chicken',
  'Rolls',
  'Russian',
  'Salad',
  'Sandwich',
  'Seafood',
  'Sindhi',
  'Singaporean',
  'South American',
  'South Indian',
  'Spanish',
  'Sri Lankan',
  'Steak',
  'Street Food',
  'Sushi',
  'Tamil',
  'Tea',
  'Tex-Mex',
  'Thai',
  'Tibetan',
  'Turkish',
  'Vegan',
  'Vietnamese',
  'Wraps',
];

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Maximum number of filtered restaurants to pass to the LLM */
export const MAX_CANDIDATES = 20;

/** Maximum number of recommendations to return */
export const MAX_RECOMMENDATIONS = 5;

/** Default minimum rating when not specified by user */
export const DEFAULT_MIN_RATING = 3.5;

/** Groq LLM model to use */
export const LLM_MODEL = 'llama-3.3-70b-versatile';

/** LLM temperature */
export const LLM_TEMPERATURE = 0.3;

/** LLM max tokens */
export const LLM_MAX_TOKENS = 2048;
