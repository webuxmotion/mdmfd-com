import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/app/lib/mongodb"
import bcrypt from "bcryptjs"
import { generateMasterKey, encryptMasterKey } from "@/app/lib/encryption.server"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "mdmfd"
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const client = await clientPromise
        const db = client.db("mdmfd")
        const user = await db.collection("users").findOne({
          email: credentials.email
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Generate master key for existing users who don't have one
        let encryptedMasterKey = user.encryptedMasterKey
        if (!encryptedMasterKey) {
          const masterKey = generateMasterKey()
          encryptedMasterKey = encryptMasterKey(masterKey, credentials.password as string)

          // Save the encrypted master key to the database
          await db.collection("users").updateOne(
            { _id: user._id },
            { $set: { encryptedMasterKey } }
          )
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          image: user.avatar || null,
          username: user.username,
          encryptedMasterKey,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.encryptedMasterKey = user.encryptedMasterKey
      }

      if (trigger === "update" && session) {
        token.name = session.name
        token.username = session.username
        if (session.encryptedMasterKey) {
          token.encryptedMasterKey = session.encryptedMasterKey
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.encryptedMasterKey = token.encryptedMasterKey as string | undefined
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const client = await clientPromise
        const db = client.db("mdmfd")

        const existingUser = await db.collection("users").findOne({
          email: user.email
        })

        if (!existingUser) {
          const baseUsername = user.email?.split("@")[0] || "user"
          let username = baseUsername.toLowerCase().replace(/[^a-z0-9._]/g, "")

          let counter = 1
          while (await db.collection("users").findOne({ username })) {
            username = `${baseUsername}${counter}`
            counter++
          }

          await db.collection("users").insertOne({
            email: user.email,
            fullName: user.name || "",
            username,
            avatar: user.image || "",
            link: `https://mdmfd.com/${username}`,
            phone: "",
            createdAt: new Date(),
          })
        }
      }
      return true
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
