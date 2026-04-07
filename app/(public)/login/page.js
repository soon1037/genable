"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonitorUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // SUCCESS: Redirect to dashboard
      router.push("/gendesk/project");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center pt-[15vh] px-6 lg:px-8 bg-white selection:bg-neutral-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center">
        <h2 className="text-center text-4xl font-black italic tracking-tighter text-neutral-900 mb-2">
          GENABLE
        </h2>
        <p className="text-center text-[10px] text-neutral-400 font-black uppercase tracking-[0.3em] mb-12">
          관리 코어 접속
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="label-premium ml-1">
              이메일 주소
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-standard"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 ml-1">
              <label htmlFor="password" className="label-premium !mb-0">
                비밀번호
              </label>
              <div className="text-[10px]">
                <a href="#" className="font-bold text-neutral-300 hover:text-black transition-colors uppercase tracking-widest">
                  비밀번호 찾기
                </a>
              </div>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-standard"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-500 uppercase tracking-tight animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-sm"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "로그인"}
              </span>
            </button>
          </div>
        </form>

        <p className="mt-12 text-center text-[11px] text-neutral-400 font-bold uppercase tracking-widest">
          아직 회원이 아니신가요?{' '}
          <Link href="/signup" className="text-black border-b-2 border-black/5 hover:border-black transition-all pb-0.5 ml-2">
            무료 체험 시작하기
          </Link>
        </p>
      </div>
    </div>
  );
}
