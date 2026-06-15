"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-foreground text-white p-12">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">Jannatie</span>
          <span className="arabic text-accent text-xl">جنتي</span>
        </Link>
        <div>
          <div className="arabic text-accent text-5xl mb-4">
            وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا
          </div>
          <p className="text-gray-400 text-sm mb-2">
            &ldquo;And whoever fears Allah — He will make for him a way out.&rdquo;
          </p>
          <p className="text-gray-500 text-xs">Quran 65:2</p>
        </div>
        <p className="text-gray-500 text-xs">© 2025 Jannatie Ltd</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">Jannatie</span>
              <span className="arabic text-accent text-xl">جنتي</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted mb-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary-500 hover:underline font-medium">
              Sign up free
            </Link>
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-border rounded-xl py-3 mb-6 hover:bg-gray-50 transition-colors text-sm font-medium text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.118 17.64 11.84 17.64 9.2z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted">or continue with email</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-[34px] text-muted hover:text-foreground"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted mt-6">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
