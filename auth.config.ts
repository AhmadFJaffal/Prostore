import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig = {
  providers: [],
  callbacks: {
    authorized({ request, auth }: any) {
      // array of regex for public routes
      const protectedPaths = [
        /\/shipping-address/,
        /\/payment-method/,
        /\/place-order/,
        /\/profile/,
        /\/user\/(.*)/,
        /\/order\/(.*)/,
        /\/admin\/(.*)/,
      ];

      // get path from request
      const { pathname } = request.nextUrl;

      // check if user is not authenticated
      if (!auth && protectedPaths.some((path) => path.test(pathname)))
        return false;
      if (!request.cookies.get("sessionCartId")) {
        // check for session cart cookie
        // generate a new session cart id
        const sessionCartId = crypto.randomUUID();

        // clone request headers
        const headers = new Headers(request.headers);

        // create a new response
        const response = NextResponse.next({
          request: {
            headers: headers,
          },
        });

        // set new session cart cookie in response
        response.cookies.set("sessionCartId", sessionCartId);

        return response;
      } else {
        return true;
      }
    },
  },
} satisfies NextAuthConfig;
