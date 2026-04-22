import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * NextAuth v5 + Google OAuth
 *
 * 세션 전략: JWT. DB adapter는 사용하지 않고,
 * signIn 시 Supabase auth.users 에 대응 레코드를 보장(upsert)해서
 * 기존 스키마(teachers/students/admins.id -> auth.users FK)를 유지한다.
 *
 * session.user.id 는 Supabase auth.users.id (UUID) 이므로
 * 모든 DB 쿼리에서 그대로 사용 가능.
 */
async function ensureSupabaseUser(email: string, name?: string): Promise<string> {
  const admin = createSupabaseAdminClient();

  // 페이지네이션 순회하며 이메일 매칭 찾기 (MVP 규모에서는 충분)
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (hit) return hit.id;
    if (data.users.length < 200) break;
    page += 1;
  }

  // 없으면 생성
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: name ? { full_name: name, name } : {},
  });
  if (error) throw error;
  return created.user!.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;
      const supabaseId = await ensureSupabaseUser(
        user.email,
        profile?.name ?? user.name ?? undefined,
      );
      // jwt 콜백에서 재사용하기 위해 user 객체에 임시 저장
      (user as { supabaseId?: string }).supabaseId = supabaseId;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const supabaseId = (user as { supabaseId?: string }).supabaseId;
        if (supabaseId) token.id = supabaseId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
