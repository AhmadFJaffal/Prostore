import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const config = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (credentials === null) {
          return null;
        }

        // Find user in the database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        if (user && user.password) {
          const isMatch = compareSync(
            credentials.password as string,
            user.password
          );

          if (isMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, trigger, token }: any) {
      // set user id from token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      // if there is an update set the user name
      if (trigger === "update") {
        session.user.name = user.name;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }: any) {
      // assign user fields to token
      if (user) {
        token.role = user.role;
        token.id = user.id;
        if (user.name === "No_Name") {
          token.name = user.email.split("@")[0];

          // update user name
          await prisma.user.update({
            where: { id: user.id },
            data: { name: token.name },
          });
        }

        if (trigger === "signIn" || trigger === "signUp") {
          const cookiesObject = await cookies();
          const sessionCartId = cookiesObject.get("sessionCartId")?.value;

          // check for session cart id
          if (sessionCartId) {
            // find cart by session cart id
            const cart = await prisma.cart.findFirst({
              where: {
                sessionCartId,
              },
            });

            // if cart exists
            if (cart) {
              // delete all carts with the user id
              await prisma.cart.deleteMany({
                where: { userId: user.id },
              });

              // assign new cart with user id
              await prisma.cart.update({
                where: { id: cart.id },
                data: {
                  userId: user.id,
                },
              });
            }
          }
        }
      }
      return token;
    },
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
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
