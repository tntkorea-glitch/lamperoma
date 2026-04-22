import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TeachersTable } from "./TeachersTable";

export default async function AllTeachersPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: teachers } = await supabase
    .from("teachers")
    .select(
      "id, name, email, salon_name, phone, created_at, students:students(count), courses:courses(count)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">원장 관리</h1>

      {!teachers || teachers.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-sm text-gray-400 shadow-sm ring-1 ring-black/5">
          아직 가입한 원장이 없어요
        </div>
      ) : (
        <TeachersTable teachers={teachers} />
      )}
    </div>
  );
}
