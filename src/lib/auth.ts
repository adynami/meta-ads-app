import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { META_API_VERSION } from './meta-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    {
      id: 'facebook',
      name: 'Meta',
      type: 'oauth',
      authorization: {
        url: `https://www.facebook.com/${META_API_VERSION}/dialog/oauth`,
        params: {
          scope:
            'email,ads_management,ads_read,business_management,read_insights,pages_read_engagement,pages_show_list',
        },
      },
      token: `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`,
      userinfo: `https://graph.facebook.com/${META_API_VERSION}/me?fields=id,name,email,picture`,
      clientId: process.env.META_APP_ID,
      clientSecret: process.env.META_APP_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
        };
      },
    },
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        if (existing.length === 0) {
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 7);

          await db.insert(users).values({
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            plan: 'trial',
            trialEndsAt,
          });
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },

    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, session.user.email))
          .limit(1);

        if (dbUser[0]) {
          session.userId = dbUser[0].id;
          session.plan = dbUser[0].plan;
          session.isAdmin = dbUser[0].isAdmin;
        }
      }
      if (token?.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
