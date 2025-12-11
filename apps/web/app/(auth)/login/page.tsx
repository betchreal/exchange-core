"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";
import { useUser } from "@/contexts/UserContext";
import { InlineError } from "@/components/ui/InlineError";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();
  const redirectTo = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/staff/login", {
        email: email.trim(),
        password,
      });

      if (response.data) {
        setUser(response.data);
      }
      router.push("/");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              Sign-in admin panel
            </h1>
          </div>

          <Input
            id="email"
            name="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="email"
            required
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          {error && <InlineError message={error} />}

          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid}
            loading={loading}
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}
