import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ★ Prismaアダプターをここに指定します
  adapter: PrismaAdapter(prisma),
  // ★ プロバイダーにGoogleを指定し、公式の環境変数名を指定します
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: {
    // ★ データベースにセッションを保存するため、strategyは "database" を推奨
    strategy: "database",
  },
  callbacks: {
    // ★★★ セッションにユーザーIDを追加するための最も重要な部分 ★★★
    // このコールバックにより、クライアントサイドとサーバーサイドの両方で
    // `session.user.id` としてデータベースのユーザーIDにアクセスできるようになります。
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
    // JWT戦略を使わない場合、このjwtコールバックは通常不要ですが、
    // 将来のために残しておいても害はありません。
    // async jwt({ token, user }) {
    //   if (user) {
    //     token.id = user.id;
    //   }
    //   return token;
    // },
  },
});
