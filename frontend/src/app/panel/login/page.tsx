import type { Metadata } from "next";
import { Suspense } from "react";

import { PaginaLogin } from "@/features/panel/auth/PaginaLogin";

export const metadata: Metadata = { title: "Ingresar" };

export default function Login() {
  return (
    <Suspense>
      <PaginaLogin />
    </Suspense>
  );
}
