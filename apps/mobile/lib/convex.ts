import { ConvexReactClient } from "convex/react";

// In development, use the Convex URL from env. In production, this would come from app config.
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";

export const convex = new ConvexReactClient(CONVEX_URL);
