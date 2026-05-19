import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function AuthCallbackPage() {
  const user = await requireUser();

  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}