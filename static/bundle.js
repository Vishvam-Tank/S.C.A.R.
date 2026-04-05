// SECURITY FIX: Removed hardcoded Stripe secret key.
// Frontend code must ONLY use publishable keys (pk_...).
// All secret key operations must be handled server-side.
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_placeholder';