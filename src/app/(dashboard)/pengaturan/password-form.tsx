"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { changeOwnPassword } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await changeOwnPassword(form);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Password Saat Ini</Label>
        <Input
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Password Baru</Label>
          <Input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Konfirmasi Password</Label>
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        <KeyRound className="h-4 w-4" /> {pending ? "Menyimpan..." : "Ubah Password"}
      </Button>
    </form>
  );
}
