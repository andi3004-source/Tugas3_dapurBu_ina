"use client";

import { useState, useTransition } from "react";
import { UserPlus, Pencil, Trash2, KeyRound } from "lucide-react";
import { createUser, updateUser, deleteUser, resetPassword } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

type User = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "KASIR";
};

export function UserManagement({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddUserDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-semibold text-navy">
                {u.name}
                {u.id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">(Anda)</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">@{u.username}</TableCell>
              <TableCell>
                <Badge variant={u.role === "ADMIN" ? "default" : "muted"}>
                  {u.role === "ADMIN" ? "Administrator" : "Kasir"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <EditUserDialog user={u} />
                  <ResetPasswordDialog user={u} />
                  {u.id !== currentUserId && <DeleteUserDialog user={u} />}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", username: "", role: "KASIR" as "ADMIN" | "KASIR", password: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUser(form);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) {
        setOpen(false);
        setForm({ name: "", username: "", role: "KASIR", password: "" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Pengguna</DialogTitle>
          <DialogDescription>Buat akun admin atau kasir baru.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama Lengkap</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "KASIR" })}
              >
                <option value="KASIR">Kasir</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateUser(user.id, { name, role });
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary hover:bg-accent">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>@{user.username}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nama</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <select
              className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "KASIR")}
            >
              <option value="KASIR">Kasir</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await resetPassword(user.id, password);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) {
        setOpen(false);
        setPassword("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-gold hover:bg-brand-gold/10">
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Setel password baru untuk <span className="font-semibold text-navy">{user.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Password Baru</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Reset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteUser(user.id);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-brand-chili hover:bg-brand-chili/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus pengguna?</DialogTitle>
          <DialogDescription>
            Akun <span className="font-semibold text-navy">{user.name}</span> akan dihapus permanen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={pending}>
            {pending ? "Memproses..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
