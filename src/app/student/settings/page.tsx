import { requireStudent } from "@/lib/auth/getUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateStudentProfileAction } from "./actions";

export default async function StudentSettingsPage() {
  const { studentId } = await requireStudent();
  const supabase = createSupabaseAdminClient();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId!)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          원장님께 보여지는 내 정보를 관리합니다
        </p>
      </div>

      <form
        action={updateStudentProfileAction}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <Field label="이름" name="name" defaultValue={student?.name ?? ""} required />
        <Field
          label="휴대폰"
          name="phone"
          type="tel"
          defaultValue={student?.phone ?? ""}
          placeholder="010-0000-0000"
        />
        <Field
          label="이메일"
          name="email"
          type="email"
          defaultValue={student?.email ?? ""}
          disabled
          helper="구글 계정 이메일이라 변경 불가"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          저장
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  disabled,
  helper,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
      />
      {helper && <span className="mt-1 block text-xs text-gray-400">{helper}</span>}
    </label>
  );
}
