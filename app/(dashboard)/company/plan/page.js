"use client";

import { CreditCard, Zap, Check, ShieldCheck, Loader2, ArrowUpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/db";

export default function PlanSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then(data => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-neutral-200" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-2xl font-bold tracking-tight text-neutral-900">플랜 설정</h3>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Current Status</span>
           <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Active Subscription</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-neutral-900 border border-neutral-900 rounded-xl p-10 text-white shadow-xl flex flex-col justify-between group hover:scale-[1.01] transition-all">
           <div>
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/10 uppercase font-black tracking-widest text-[11px]">
                 <span className="text-neutral-400">Selected Plan</span>
                 <Zap className="w-5 h-5 text-yellow-400 fill-current" />
              </div>
              <h3 className="text-4xl font-black italic tracking-tighter mb-4">PRO ENTERPRISE</h3>
              <p className="text-neutral-400 text-sm font-medium leading-relaxed">기업 최적화 모델. 관리자 1인 + 팀원 5인 계정을 포함하여 무제한 프로젝트 생성이 가능합니다.</p>
           </div>
           
           <div className="mt-16 space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold">
                 <Check className="w-4 h-4 text-green-500" />
                 <span>무제한 시나리오 및 링크 생성</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold">
                 <Check className="w-4 h-4 text-green-500" />
                 <span>매월 1,000 크레딧 정기 지급</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold opacity-30">
                 <Check className="w-4 h-4" />
                 <span>화면 녹화 저장 기능 (Beta 준비중)</span>
              </div>
           </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-10 shadow-sm flex flex-col justify-between">
           <div>
              <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-10 pb-6 border-b border-neutral-100">결제 및 크레딧 요약</p>
              <div className="space-y-8">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[12px] font-black text-neutral-900 uppercase tracking-tight">Available Balance</p>
                       <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">이용 가능한 크레딧 (PTS)</p>
                    </div>
                    <span className="text-3xl font-black italic tracking-tighter text-neutral-900">{profile?.credits || 0} PTS</span>
                 </div>
                 
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[12px] font-black text-neutral-900 uppercase tracking-tight">Next Invoice Amount</p>
                       <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">다음 결제 예정 금액 (KRW)</p>
                    </div>
                    <span className="text-3xl font-black italic tracking-tighter text-neutral-900">99,000 KRW</span>
                 </div>
              </div>
           </div>

           <div className="mt-16 space-y-4">
              <button className="w-full bg-black hover:bg-neutral-800 text-white px-6 py-4 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                플랜 업그레이드
              </button>
              <button className="w-full bg-neutral-50 hover:bg-neutral-100 text-neutral-400 hover:text-black border border-neutral-100 px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
                결제 수단 변경 및 명세서 확인
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
