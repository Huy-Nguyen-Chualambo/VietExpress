import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/dang-nhap',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password

        if (!email || !password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            passwordHash: true,
          },
        })

        if (!user?.passwordHash) {
          return null
        }

        const isValid = await verifyPassword(password, user.passwordHash)

        if (!isValid) {
          return null
        }

        const profile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { role: true },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: profile?.role ?? 'customer',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'customer'
      }

      if (token.sub && !token.role) {
        const profile = await prisma.profile.findUnique({
          where: { id: token.sub },
          select: { role: true },
        })

        token.role = profile?.role ?? 'customer'
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id
        session.user.role = (token.role as string | undefined) ?? 'customer'
      }

      return session
    },
  },
}