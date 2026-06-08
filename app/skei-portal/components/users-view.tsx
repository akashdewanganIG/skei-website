"use client";

import { RiDeleteBinLine, RiRefreshLine, RiSaveLine, RiUserAddLine } from "@remixicon/react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PERMISSION_LABELS } from "@/lib/auth/permissions";
import { ADMIN_PERMISSIONS, type AdminPermission, type Role, type Session } from "@/types/lead";
import { EMPTY_USER_FORM, MANAGED_PERMISSIONS, ROLE_OPTIONS } from "../portal-constants";
import type { AdminUserSummary, UserDraft } from "../portal-types";
import { EmptyInline } from "./empty-states";
import { SelectField, TextInput } from "./form-fields";

function roleOption(role: Role) {
  return ROLE_OPTIONS.find((option) => option.value === role) ?? ROLE_OPTIONS[0];
}

export function UsersView({ session }: { session: Session }) {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [form, setForm] = useState<UserDraft>(EMPTY_USER_FORM);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const applyUsers = useCallback((nextUsers: AdminUserSummary[]) => {
    setUsers(nextUsers);
    setDrafts(
      Object.fromEntries(
        nextUsers.map((user) => [
          user.id,
          {
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            password: "",
          },
        ]),
      ),
    );
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load users.");
      applyUsers(data.users as AdminUserSummary[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [applyUsers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load protected admin users after the client session UI mounts.
    loadUsers();
  }, [loadUsers]);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create user.");
      applyUsers([data.user as AdminUserSummary, ...users]);
      setForm(EMPTY_USER_FORM);
      toast.success("User created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create user.");
    } finally {
      setCreating(false);
    }
  };

  const saveUser = async (user: AdminUserSummary) => {
    const draft = drafts[user.id];
    if (!draft) return;
    setSavingId(user.id);
    try {
      const body: Partial<UserDraft> = { ...draft };
      if (!body.password) delete body.password;
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update user.");
      applyUsers(
        users.map((item) => (item.id === user.id ? (data.user as AdminUserSummary) : item)),
      );
      toast.success("User updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update user.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (user: AdminUserSummary) => {
    if (user.username === session.username) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setSavingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete user.");
      applyUsers(users.filter((item) => item.id !== user.id));
      toast.success("User deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete user.");
    } finally {
      setSavingId(null);
    }
  };

  const updateDraft = (id: string, patch: Partial<UserDraft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Create user</h2>
          <p className="mt-1 text-xs text-muted">
            Admin-created accounts can sign in with username or email.
          </p>
        </div>
        <form onSubmit={createUser} className="grid gap-4 p-4 xl:grid-cols-[1fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput
              label="Name"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            />
            <TextInput
              label="Username"
              value={form.username}
              onChange={(value) => setForm((current) => ({ ...current, username: value }))}
            />
            <TextInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            />
            <TextInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => setForm((current) => ({ ...current, password: value }))}
            />
            <SelectField
              label="Role"
              instanceId="create-user-role"
              options={ROLE_OPTIONS}
              value={roleOption(form.role)}
              onChange={(option) => setForm((current) => ({ ...current, role: option.value }))}
            />
          </div>
          <div className="flex flex-col gap-3">
            <PermissionChecklist
              role={form.role}
              selected={form.permissions}
              onChange={(permissions) => setForm((current) => ({ ...current, permissions }))}
            />
            <button
              type="submit"
              disabled={creating}
              className="flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-clay px-4 text-sm font-semibold text-ivory transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RiUserAddLine className="h-4 w-4" />
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Users and permissions</h2>
          <button
            type="button"
            onClick={loadUsers}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-fg"
          >
            <RiRefreshLine className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted">Loading users...</div>
        ) : users.length === 0 ? (
          <EmptyInline text="No users found." />
        ) : (
          <div className="divide-y divide-line">
            {users.map((user) => {
              const draft = drafts[user.id];
              const isSelf = user.username === session.username;
              if (!draft) return null;
              return (
                <div key={user.id} className="grid gap-4 p-4 xl:grid-cols-[1fr_1.1fr_auto]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      label="Name"
                      value={draft.name}
                      disabled={isSelf}
                      onChange={(value) => updateDraft(user.id, { name: value })}
                    />
                    <TextInput
                      label="Username"
                      value={draft.username}
                      disabled={isSelf}
                      onChange={(value) => updateDraft(user.id, { username: value })}
                    />
                    <TextInput
                      label="Email"
                      type="email"
                      value={draft.email}
                      disabled={isSelf}
                      onChange={(value) => updateDraft(user.id, { email: value })}
                    />
                    <TextInput
                      label="Reset password"
                      type="password"
                      value={draft.password}
                      disabled={isSelf}
                      onChange={(value) => updateDraft(user.id, { password: value })}
                    />
                    <SelectField
                      label="Role"
                      instanceId={`edit-user-role-${user.id}`}
                      options={ROLE_OPTIONS}
                      value={roleOption(draft.role)}
                      disabled={isSelf}
                      onChange={(option) => updateDraft(user.id, { role: option.value })}
                    />
                  </div>
                  <PermissionChecklist
                    role={draft.role}
                    selected={draft.permissions}
                    disabled={isSelf}
                    onChange={(permissions) => updateDraft(user.id, { permissions })}
                  />
                  <div className="flex items-end gap-2 xl:flex-col xl:items-stretch xl:justify-end">
                    <button
                      type="button"
                      onClick={() => saveUser(user)}
                      disabled={isSelf || savingId === user.id}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-fg transition-colors hover:bg-fg/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RiSaveLine className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUser(user)}
                      disabled={isSelf || savingId === user.id}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-clay/30 px-3 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PermissionChecklist({
  role,
  selected,
  disabled = false,
  onChange,
}: {
  role: Role;
  selected: AdminPermission[];
  disabled?: boolean;
  onChange: (permissions: AdminPermission[]) => void;
}) {
  const effective = role === "admin" ? ADMIN_PERMISSIONS : selected;
  const toggle = (permission: AdminPermission) => {
    if (disabled || role === "admin") return;
    if (effective.includes(permission)) {
      onChange(effective.filter((item) => item !== permission));
    } else {
      onChange([...effective, permission]);
    }
  };

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Permissions
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {MANAGED_PERMISSIONS.map((permission) => {
          const checked = effective.includes(permission);
          return (
            <label
              key={permission}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                checked ? "border-clay/30 bg-clay/10 text-fg" : "border-line text-muted"
              } ${disabled || role === "admin" ? "opacity-70" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled || role === "admin"}
                onChange={() => toggle(permission)}
                className="h-3.5 w-3.5 accent-clay"
              />
              {PERMISSION_LABELS[permission]}
            </label>
          );
        })}
      </div>
    </div>
  );
}
