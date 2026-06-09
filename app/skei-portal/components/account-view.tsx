"use client";

import { RiLockPasswordLine, RiMailLine, RiShieldCheckLine, RiUserLine } from "@remixicon/react";
import type { ComponentType } from "react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { Session } from "@/types/lead";
import { initials } from "../portal-utils";
import { TextInput } from "./form-fields";

export function AccountView({ session }: { session: Session }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const [username, setUsername] = useState(session.username);
  const [email, setEmail] = useState(session.email);
  const [name, setName] = useState(session.name);
  const [savingProfile, setSavingProfile] = useState(false);

  const updateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !email.trim()) {
      toast.error("Username and email are required.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update profile.");
      toast.success("Profile updated! Refreshing...");
      setTimeout(() => window.location.reload(), 1000); // reload to get new session
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (nextPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPass(true);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, nextPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-surface p-4 shadow-soft">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-clay/12 text-sm font-bold text-clay">
              {initials(session.name)}
            </span>
            <div>
              <h2 className="text-base font-semibold text-fg">{session.name}</h2>
              <p className="text-xs text-muted">{session.role}</p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm md:grid-cols-3">
            <InfoRow icon={RiUserLine} label="Username" value={session.username} />
            <InfoRow icon={RiMailLine} label="Email" value={session.email} />
            <InfoRow
              icon={RiShieldCheckLine}
              label="Permissions"
              value={`${session.permissions.length} enabled`}
            />
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Update profile</h2>
          <p className="mt-1 text-xs text-muted">Update your account details below.</p>
        </div>
        <form
          onSubmit={updateProfile}
          className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
        >
          <TextInput label="Name" value={name} onChange={setName} />
          <TextInput label="Username" value={username} onChange={setUsername} />
          <TextInput label="Email" type="email" value={email} onChange={setEmail} />
          <button
            type="submit"
            disabled={
              savingProfile ||
              (username === session.username && email === session.email && name === session.name)
            }
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RiUserLine className="h-4 w-4" />
            {savingProfile ? "Saving..." : "Update profile"}
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Change password</h2>
          <p className="mt-1 text-xs text-muted">Password updates are saved to the database.</p>
        </div>
        <form
          onSubmit={changePassword}
          className="grid gap-3 p-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
        >
          <TextInput
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <TextInput
            label="New password"
            type="password"
            value={nextPassword}
            onChange={setNextPassword}
          />
          <TextInput
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          <button
            type="submit"
            disabled={savingPass}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RiLockPasswordLine className="h-4 w-4" />
            {savingPass ? "Saving..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-line bg-bg/35 px-3 py-2">
      <Icon className="h-4 w-4 text-muted" />
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-sm text-fg">{value}</dd>
    </div>
  );
}
