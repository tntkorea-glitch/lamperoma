import { requireTeacher } from "@/lib/auth/getUser";
import { createInviteAction } from "./actions";

export default async function NewInvitePage() {
  await requireTeacher();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">새 초대링크 발급</h1>
      <p className="mb-6 text-sm text-gray-500">
        수강생 정보를 입력하시면 전용 초대 링크가 생성됩니다.
        <br />
        이름만 필수, 나머지는 선택입니다.
      </p>

      <form
        action={createInviteAction}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <Field label="수강생 이름" name="name" required placeholder="홍길동" />
        <Field label="이메일 (선택)" name="email" type="email" placeholder="student@example.com" />
        <Field label="휴대폰 (선택)" name="phone" type="tel" placeholder="010-0000-0000" />

        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          초대링크 생성
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-900"
      />
    </label>
  );
}
