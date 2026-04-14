import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      // Allow mobile app deep links
      if (redirectTo.startsWith("the-library://") || redirectTo.startsWith("exp://")) {
        return redirectTo;
      }
      return redirectTo;
    },
  },
});
