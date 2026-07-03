import { Suspense } from "react";
import AuthFlow from "@/components/auth/AuthFlow";

export default function LoginPage() {
  return (
    <Suspense>
      <AuthFlow initialView="login" />
    </Suspense>
  );
}
