"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { updateSetting } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type Setting = {
  restaurantName: string;
  tagline: string;
  address: string;
  phone: string;
  taxPercent: number;
  servicePercent: number;
};

export function SettingsForm({ setting }: { setting: Setting }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const [form, setForm] = useState(setting);

  function set<K extends keyof Setting>(key: K, value: Setting[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateSetting(form);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Tersimpan" : "Gagal",
        description: res.message,
      });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nama Restoran</Label>
        <Input value={form.restaurantName} onChange={(e) => set("restaurantName", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Tagline</Label>
        <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Alamat</Label>
        <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Telepon</Label>
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Pajak (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.taxPercent}
            onChange={(e) => set("taxPercent", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Service Charge (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.servicePercent}
            onChange={(e) => set("servicePercent", Number(e.target.value))}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        <Save className="h-4 w-4" /> {pending ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </form>
  );
}
