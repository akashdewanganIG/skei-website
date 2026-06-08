"use client";

import {
  RiArrowRightLine,
  RiBarChartBoxLine,
  RiLoader4Line,
  RiLockPasswordLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiUserLine,
} from "@remixicon/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/ui/logo";

const inputBase =
  "h-11 w-full rounded-lg border border-line bg-bg/55 py-2 pl-10 pr-3 text-sm text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-clay/50 focus:bg-surface focus:ring-2 focus:ring-clay/20";

export function LoginForm() {
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Enter your username or email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not sign in.");
        setSubmitting(false);
        return;
      }
      toast.success(`Welcome back, ${data.user?.name ?? "there"}.`);
      const from = params.get("from");
      const target = from?.startsWith("/skei-portal") ? from : "/skei-portal";
      window.location.assign(target);
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-bg lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="hidden border-r border-line bg-surface/75 px-10 py-8 lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <BrandLogo priority className="h-11 w-auto" />
        </div>

        <div className="my-auto max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-clay">Secure access</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-fg">
            Staff and administrator portal
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Manage leads, admissions analytics, users, permissions, and change logs from one clean
            workspace.
          </p>
          <div className="mt-8 grid gap-3">
            <SideItem icon={RiTeamLine} label="Leads" value="Pipeline tracking" />
            <SideItem
              icon={RiBarChartBoxLine}
              label="Analytics"
              value="Charts and source metrics"
            />
            <SideItem icon={RiShieldCheckLine} label="Users" value="Admin controlled access" />
          </div>
        </div>

        <p className="text-xs text-muted">Authorised access only</p>
      </aside>

      <section className="grid place-items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[420px]">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <BrandLogo priority className="h-11 w-auto" />
          </div>

          <div className="rounded-lg border border-line bg-surface shadow-soft">
            <div className="border-b border-line px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-clay">Sign in</p>
              <h2 className="mt-2 text-2xl font-semibold text-fg">Welcome back</h2>
              <p className="mt-2 text-sm text-muted">
                Use your username or verified email address.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 px-6 py-6">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-fg">Username or email</span>
                <span className="relative">
                  <RiUserLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                  <input
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="username or email"
                    className={inputBase}
                  />
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-fg">Password</span>
                <span className="relative">
                  <RiLockPasswordLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={inputBase}
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <RiLoader4Line className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <RiArrowRightLine className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function SideItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof RiTeamLine;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-bg/45 px-3 py-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-clay/10 text-clay">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <div className="text-sm font-semibold text-fg">{label}</div>
        <div className="text-xs text-muted">{value}</div>
      </div>
    </div>
  );
}
