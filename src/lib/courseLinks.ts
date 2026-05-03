export interface CourseLinks {
  consultation_form?: string   // 수강 상담 설문지
  course_design?: string       // 수강 설계
  application_form?: string    // 수강 신청서
  oneday_instagram?: string    // 인스타그램 마케팅 원데이
  oneday_photo?: string        // 사진/영상 원데이
  graduation_survey?: string   // 졸업 설문지
  model_practice?: string      // 졸업 후 모델 실습
  advanced_training?: string   // 보수 교육
}

export function parseCourseLinks(raw: unknown): CourseLinks {
  if (!raw || typeof raw !== "object") return {};
  return raw as CourseLinks;
}
