import { ConvexReactClient } from "convex/react";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || "https://colorful-beagle-698.convex.cloud";

export const convex = new ConvexReactClient(CONVEX_URL);
