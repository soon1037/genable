"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Globe, 
  ArrowLeftRight,
  Info,
  X,
  ChevronRight,
  Monitor
} from "lucide-react";

export default function OAuthConsentPage() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  
  // Simulated app data from params
  const clientName = searchParams.get("client_name") || "Genable Live Desktop";
  const scopes = searchParams.get("scope")?.split(",") || ["profile.read", "project.write", "usage.view"];
  const redirectUri = searchParams.get("redirect_uri") || "#";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scopeDetails = {
    "profile.read": { icon: <Users className="w-4 h-4" />, label: "기본 프로필 정보 조회", desc: "이름, 이메일, 프로필 이미지를 확인합니다." },
    "project.write": { icon: <Monitor className="w-4 h-4" />, label: "프로젝트 관리 권한", desc: "새로운 세션을 시작하거나 설정을 수정할 수 있습니다." },
    "usage.view": { icon: <ShieldCheck className="w-4 h-4" />, label: "사용량 및 통계 열람", desc: "크레딧 소모 내역 및 정산 데이터를 확인합니다." }
  };

  if (!isMounted) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white selection:bg-neutral-100 p-6 min-h-[90vh]">
      <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Visual Connection Header */}
        <div className="relative mb-12 flex items-center justify-center">
          <div className="flex items-center gap-6 relative z-10">
            {/* Genable Logo Side */}
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 group hover:scale-105 transition-transform">
               <span className="text-white font-black italic text-xl tracking-tighter">G</span>
            </div>
            
            {/* Connection Animation */}
            <div className="flex flex-col items-center gap-1 group">
               <div className="flex items-center gap-1 px-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-200 animate-pulse delay-75"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-200 animate-pulse delay-150"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-200 animate-pulse delay-300"></span>
                  <ArrowLeftRight className="w-5 h-5 text-neutral-300 mx-1 group-hover:text-black transition-colors" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-200 animate-pulse delay-300"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-200 animate-pulse delay-150"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-200 animate-pulse delay-75"></span>
               </div>
               <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em]">SECURE LINK</span>
            </div>

            {/* Client App Side */}
            <div className="w-20 h-20 bg-neutral-50 border border-neutral-100 rounded-3xl flex items-center justify-center shadow-xl group hover:scale-105 transition-transform">
               <Monitor className="w-8 h-8 text-neutral-400" />
            </div>
          </div>
          
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-neutral-100 blur-[80px] -z-10 rounded-full"></div>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-10 shadow-2xl shadow-neutral-200/50 space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-bl-full -z-10 opacity-50"></div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tighter text-neutral-900 leading-tight">
               <span className="text-neutral-300 italic block text-xl mb-1">Authorization Request</span>
               {clientName} <br/>
               <span className="text-neutral-400 font-bold text-lg tracking-tight">서비스가 연동을 요청합니다.</span>
            </h2>
            <p className="text-sm font-bold text-neutral-400 leading-relaxed">
              연동을 승인하면 제네이블의 일부 정보가 {clientName}에 공유됩니다. 
              언제든지 설시 대시보드에서 접근 권한을 철회할 수 있습니다.
            </p>
          </div>

          {/* Requested Scopes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <Lock className="w-3.5 h-3.5 text-neutral-400" />
               <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">요청된 접근 범위</span>
            </div>
            
            <div className="grid gap-4">
              {scopes.map(s => {
                const detail = scopeDetails[s] || { icon: <CheckCircle2 />, label: s, desc: "요청된 추가 권한입니다." };
                return (
                  <div key={s} className="flex gap-5 p-5 bg-neutral-50 rounded-2xl border border-transparent hover:border-neutral-100 active:scale-[0.98] transition-all group/item">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-neutral-400 group-hover/item:text-black transition-colors">
                       {detail.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                       <h4 className="text-sm font-black text-neutral-900 flex items-center justify-between">
                          {detail.label}
                          <div className="flex h-1.5 w-1.5 rounded-full bg-green-500 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                       </h4>
                       <p className="text-[11px] font-bold text-neutral-400 leading-normal">{detail.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Information */}
          <div className="flex items-start gap-4 p-5 bg-white border border-neutral-100 rounded-2xl">
             <div className="p-2 bg-neutral-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-neutral-400" />
             </div>
             <p className="text-[11px] font-bold text-neutral-400 leading-relaxed">
               귀하의 비밀번호는 공유되지 않으며, 제네이블은 사용자의 데이터에 대해 <br/>
               <span className="text-neutral-900">최고 수준의 종단간 암호화</span> 및 보안 표준을 적용합니다.
             </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button className="py-4 px-6 bg-white border border-neutral-200 text-neutral-900 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all active:scale-95">
               Deny
            </button>
            <button className="py-4 px-6 bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
               Allow Access
               <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center space-y-6">
           <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-neutral-100"></span>
              Identity Powered by Genable
              <span className="w-8 h-px bg-neutral-100"></span>
           </p>
           <div className="flex items-center justify-center gap-6">
              <Link href="#" className="text-[10px] font-bold text-neutral-400 hover:text-black underline underline-offset-4 decoration-neutral-200 uppercase tracking-widest transition-colors">이용약관</Link>
              <Link href="#" className="text-[10px] font-bold text-neutral-400 hover:text-black underline underline-offset-4 decoration-neutral-200 uppercase tracking-widest transition-colors">개인정보 처리방침</Link>
           </div>
        </div>
      </div>
    </div>
  );
}
