"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Lock,
  Zap,
  Check
} from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password validation
  const isLengthValid = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  const passwordsMatch = password === confirmPassword && password !== "";
  const isFormValid = isLengthValid && hasNumber && hasSpecial && passwordsMatch;

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/gendesk/project");
      }, 2000);
    } catch (err) {
      console.error("[AUTH] Password update failed:", err);
      setError(err.message || "비밀번호 설정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white selection:bg-neutral-100 p-6 min-h-[90vh]">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Header Visual */}
        <div className="flex flex-col items-center mb-12 space-y-4">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20 animate-bounce transition-all">
             <KeyRound className="w-8 h-8 text-white" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tighter text-neutral-900 italic">
               SET YOUR PASSWORD
            </h1>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest leading-none">
              제네이블에 오신 것을 환영합니다
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-neutral-200/50 relative overflow-hidden group">
          
          {success ? (
            <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tighter">가입이 완료되었습니다!</h2>
                  <p className="text-sm font-bold text-neutral-400">잠시 후 대시보드로 이동합니다...</p>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">계정 완성하기</h2>
                <p className="text-xs font-bold text-neutral-400">보안을 위해 강력한 비밀번호를 설정해 주세요.</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-[11px] font-bold text-red-500 animate-in fade-in">
                   {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Password Input */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Lock className="w-3 h-3" /> New Password
                  </label>
                  <div className="relative group/input">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-6 py-4 bg-neutral-50 border border-transparent rounded-2xl text-neutral-900 font-bold placeholder:text-neutral-300 focus:bg-white focus:border-neutral-200 focus:shadow-sm outline-none transition-all pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-300 hover:text-neutral-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <CheckCircle2 className="w-3 h-3" /> Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-neutral-50 border border-transparent rounded-2xl text-neutral-900 font-bold placeholder:text-neutral-300 focus:bg-white focus:border-neutral-200 focus:shadow-sm outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className={`flex items-center gap-2 text-[10px] font-bold ${isLengthValid ? 'text-green-500' : 'text-neutral-300'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border ${isLengthValid ? 'bg-green-500 border-green-500' : 'border-neutral-200'} flex items-center justify-center transition-colors`}>
                    <Check className={`w-2 h-2 text-white ${isLengthValid ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  8자 이상
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold ${hasNumber ? 'text-green-500' : 'text-neutral-300'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border ${hasNumber ? 'bg-green-500 border-green-500' : 'border-neutral-200'} flex items-center justify-center transition-colors`}>
                    <Check className={`w-2 h-2 text-white ${hasNumber ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  숫자 포함
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold ${hasSpecial ? 'text-green-500' : 'text-neutral-300'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border ${hasSpecial ? 'bg-green-500 border-green-500' : 'border-neutral-200'} flex items-center justify-center transition-colors`}>
                    <Check className={`w-2 h-2 text-white ${hasSpecial ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  특수문자 포함
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold ${passwordsMatch ? 'text-green-500' : 'text-neutral-300'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full border ${passwordsMatch ? 'bg-green-500 border-green-500' : 'border-neutral-200'} flex items-center justify-center transition-colors`}>
                    <Check className={`w-2 h-2 text-white ${passwordsMatch ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  비밀번호 일치
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full py-5 bg-black text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Complete Signup
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Decorative blob */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-neutral-50 rounded-full blur-3xl -z-10 group-hover:scale-150 transition-transform duration-1000"></div>
        </div>

        {/* Support Info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-neutral-300">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encryption Enabled</span>
        </div>
      </div>
    </div>
  );
}
