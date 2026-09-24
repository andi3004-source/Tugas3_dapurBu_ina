import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";
import { getSetting } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const setting = await getSetting();
  return { title: `Masuk — ${setting.restaurantName}` };
}

export default async function LoginPage() {
  const setting = await getSetting();

  return (
    <div className="flex min-h-screen bg-brand-cream">
      {/* Kiri: foto dapur (desktop) */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/brand/hero-kitchen.jpg"
          alt="Dapur"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-tealdark/80 via-brand-wood/40 to-brand-gold/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-brand-cream">
          <p className="font-hand text-4xl text-brand-cream/95">
            Masak dengan hati,
          </p>
          <p className="font-hand text-4xl text-brand-cream/95">Sajikan dengan cinta</p>
          <p className="mt-4 max-w-sm text-sm text-brand-cream/80">
            Kelola operasional restoran dengan mudah — pesanan, stok, pembayaran,
            hingga laporan dalam satu tempat.
          </p>
        </div>
      </div>

      {/* Kanan: form login */}
      <div className="flex w-full items-center justify-center p-4 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo showText={false} size="lg" name={setting.restaurantName} />
            <h1 className="mt-4 font-serif text-3xl font-bold text-brand-teal">
              {setting.restaurantName}
            </h1>
            <p className="mt-1 font-hand text-xl text-brand-terracotta">
              {setting.tagline}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-warm">
            <h2 className="font-serif text-lg font-bold text-navy">Selamat Datang 👋</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Masuk untuk mengelola operasional restoran.
            </p>
            <LoginForm />

            <div className="mt-6 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-navy">Akun demo:</p>
              <p>
                Admin — <span className="font-mono">admin</span> /{" "}
                <span className="font-mono">admin123</span>
              </p>
              <p>
                Kasir — <span className="font-mono">kasir</span> /{" "}
                <span className="font-mono">kasir123</span>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 {setting.restaurantName} · Sistem Manajemen Restoran v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
