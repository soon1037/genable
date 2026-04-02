"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonitorUp, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    businessNumber: "",
    position: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            business_number: formData.businessNumber,
            position: formData.position
          },
        },
      });

      if (authError) throw authError;

      alert("회원가입이 완료되었습니다. 이메일을 확인해 주세요!");
      router.push("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center pt-[10vh] px-6 pb-20 lg:px-8 bg-white selection:bg-neutral-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <h2 className="text-center text-4xl font-black italic tracking-tighter text-neutral-900 mb-2">
          GENABLE
        </h2>
        <p className="text-center text-sm text-neutral-400 font-bold uppercase tracking-[0.2em] mb-12">
          새로운 미션을 시작하세요
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-10" onSubmit={handleSignup}>
          
          {/* Company Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
               <div className="h-px flex-1 bg-neutral-100"></div>
               <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-2">기업 정보</span>
               <div className="h-px flex-1 bg-neutral-100"></div>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="label-premium ml-1">회사명</label>
                <input
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="input-standard"
                  placeholder="예: (주)제너블"
                />
              </div>
              <div>
                <label className="label-premium ml-1">사업자 등록번호</label>
                <input
                  name="businessNumber"
                  type="text"
                  required
                  value={formData.businessNumber}
                  onChange={handleChange}
                  className="input-standard"
                  placeholder="000-00-00000"
                />
              </div>
            </div>
          </div>

          {/* Personal Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
               <div className="h-px flex-1 bg-neutral-100"></div>
               <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-2">사용자 정보</span>
               <div className="h-px flex-1 bg-neutral-100"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-premium ml-1">이름</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-standard"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="label-premium ml-1">직책</label>
                <input
                  name="position"
                  type="text"
                  required
                  value={formData.position}
                  onChange={handleChange}
                  className="input-standard"
                  placeholder="팀장"
                />
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
               <div className="h-px flex-1 bg-neutral-100"></div>
               <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-2">계정 설정</span>
               <div className="h-px flex-1 bg-neutral-100"></div>
            </div>
            <div>
              <label className="label-premium ml-1">이메일 주소</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3.5 text-neutral-900 focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all sm:text-sm font-bold placeholder:text-neutral-200"
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="label-premium ml-1">비밀번호</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3.5 text-neutral-900 focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all sm:text-sm font-bold"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-[11px] font-bold text-red-500 uppercase tracking-tight animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 text-sm"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "무료 체험 시작하기"}
              </span>
            </button>
          </div>
        </form>

        <p className="mt-12 text-center text-[11px] text-neutral-400 font-bold uppercase tracking-widest">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-black border-b-2 border-black/10 hover:border-black transition-all pb-0.5 ml-2">
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
