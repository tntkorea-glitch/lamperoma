import { signOut } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
