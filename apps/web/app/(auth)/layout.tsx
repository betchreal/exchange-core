import { type ReactNode, Suspense } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
      <Suspense fallback={<div>Loading</div>}>
        {children}
      </Suspense>
  );
}
