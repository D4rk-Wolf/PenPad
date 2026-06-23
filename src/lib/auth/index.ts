import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { authUser, authSession, authAccount, authVerification } from '@/lib/db/auth-schema'

// Use bcrypt for password hashing so credentials migrated from Supabase Auth
// (which stores $2a$ bcrypt hashes) validate without forcing a password reset.
// New passwords are also bcrypt, keeping a single scheme across migrated and new users.
const BCRYPT_COST = 10

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user:         authUser,
      session:      authSession,
      account:      authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: (password) => bcrypt.hash(password, BCRYPT_COST),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  advanced: {
    database: {
      // Generate UUID user IDs so they are compatible with the existing
      // uuid-typed user_id columns on reports/findings/subscriptions/etc.
      // Also lets Supabase Auth users (whose IDs are UUIDs) migrate 1:1.
      generateId: 'uuid',
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await db
              .update(authUser)
              .set({ trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
              .where(eq(authUser.id, user.id))
          } catch (err) {
            console.error('[trial] failed to set trial_ends_at for user', user.id, err)
          }
        },
      },
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ],
})

export type Session = typeof auth.$Infer.Session
export type User    = typeof auth.$Infer.Session.user
