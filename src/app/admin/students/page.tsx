import { requireAdmin } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { StudentsTable } from "./StudentsTable";

export default async function AllStudentsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, name, email, phone, created_at, teacher:teachers(id, name, salon_name), courses:courses(id, title, status)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">전체 수강생</h1>

      {!students || students.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-sm text-gray-400 shadow-sm ring-1 ring-black/5">
          등록된 수강생이 없어요
        </div>
      ) : (
        <StudentsTable students={students} />
      )}
    </div>
  );
}
