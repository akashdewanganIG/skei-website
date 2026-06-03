"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RiLockPasswordLine, RiUserLine, RiArrowRightLine, RiLoader4Line } from "@remixicon/react";
import { EASE } from "@/lib/animations";
import logo from "@/public/logo.png";

const inputBase =
  "w-full rounded-xl border border-fg/20 bg-bg/60 py-2.5 pl-10 pr-3.5 text-sm text-fg placeholder:text-muted/60 transition-all duration-200 focus:border-clay/50 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-clay/30";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not sign in.");
        return;
      }
      toast.success(`Welcome back, ${data.user?.name ?? "there"}.`);
      const from = params.get("from");
      router.replace(from?.startsWith("/skei-admin") ? from : "/skei-admin");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src={logo} alt="SKEI" width={64} height={64} className="h-16 w-auto" priority />
          <div className="mt-5 text-eyebrow text-clay">SKEI Admin</div>
          <h1 className="mt-2 font-display text-2xl text-fg">Sign in to continue</h1>
          <p className="mt-2 text-sm text-muted">Leads dashboard for staff &amp; administrators.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-fg/5 bg-surface p-6 shadow-soft"
        >
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.75rem] font-semibold text-fg">Username</span>
              <span className="relative">
                <RiUserLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className={inputBase}
                />
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[0.75rem] font-semibold text-fg">Password</span>
              <span className="relative">
                <RiLockPasswordLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputBase}
                />
              </span>
            </label>
          </div>

          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={!submitting ? { scale: 0.98 } : {}}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-ivory shadow-soft transition-colors duration-200 ${
              submitting ? "cursor-not-allowed opacity-70" : "hover:bg-clay-deep"
            }`}
          >
            {submitting ? (
              <>
                <RiLoader4Line className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in <RiArrowRightLine className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-xs text-muted/70">
          Authorised access only · Smt. Kamalabai Educational Institution
        </p>
      </motion.div>
    </main>
  );
}
