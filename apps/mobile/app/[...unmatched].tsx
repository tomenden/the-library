import { Redirect } from "expo-router";

// Catch-all for deep links (e.g. share intent URLs like the-library://dataUrl=...).
// Redirects to the main library screen; the ShareIntentProvider in _layout
// picks up the share data independently via useLinkingURL.
export default function Unmatched() {
  return <Redirect href="/(tabs)" />;
}
