import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/skei-portal");
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
