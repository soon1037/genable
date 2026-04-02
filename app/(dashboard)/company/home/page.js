"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, Building2, Globe, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { getProfile } from "@/lib/db";
import Link from "next/link";

export default function CompanyHomePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-200" />
      </div>
    );
  }

  const company = profile?.companies;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900">기업 개요</h3>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium">
          <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-400">
                <Users className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Members</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mb-1">1명 사용 중</p>
          <p className="text-xs text-neutral-400 font-medium tracking-tight">Standard 플랜 한도 (10명)</p>
          <Link href="/company/users" className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:underline">
             사용자 관리 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="card-premium">
          <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-400">
                <CreditCard className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Credits</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mb-1">{profile?.credits || 0} CD</p>
          <p className="text-xs text-neutral-400 font-medium tracking-tight">현재 가용 크레딧</p>
          <Link href="/company/plan" className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:underline">
             충전하러 가기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:border-neutral-300 transition-all">
          <div className="flex items-center justify-between mb-4">
             <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-400">
                <ShieldCheck className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Subscription</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 mb-1">Standard</p>
          <p className="text-xs text-neutral-400 font-medium tracking-tight">최대 20개 프로젝트 운영</p>
          <Link href="/company/plan" className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:underline">
             플랜 정보 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Enterprise Identity Card */}
      <div className="card-premium flex flex-col md:flex-row items-start gap-8">
        <div className="w-20 h-20 rounded-xl bg-neutral-900 flex items-center justify-center font-bold text-white text-2xl shadow-sm shrink-0">
           {company?.name?.[0] || "?"}
        </div>
        
        <div className="flex-1 space-y-4">
           <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">{company?.name || "기업 정보 등록 필요"}</h2>
              <div className="flex flex-wrap items-center gap-3">
                 {company?.business_number && (
                    <div className="px-2.5 py-0.5 bg-neutral-100 rounded-md text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 border border-neutral-200">
                       <ShieldCheck className="w-3 h-3" />
                       사업자 {company.business_number}
                    </div>
                 )}
                 {company?.representative_name && (
                    <div className="text-xs font-semibold text-neutral-500">대표: {company.representative_name}</div>
                 )}
              </div>
           </div>
           <p className="text-neutral-500 text-sm max-w-2xl leading-relaxed">
             {company?.description || "기업 설명을 등록하여 관리 페이지를 완성해 보세요."}
           </p>
           <div className="flex flex-wrap items-center gap-6 pt-2">
              {company?.website && (
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                   <Globe className="w-4 h-4 text-neutral-300" />
                   {company.website}
                </div>
              )}
              {company?.phone && (
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                   <Building2 className="w-4 h-4 text-neutral-300" />
                   {company.phone}
                </div>
              )}
           </div>
        </div>

        <Link href="/company/setting" className="btn-primary px-5 py-2.5 shrink-0">
           기업 정보 수정
        </Link>
      </div>
    </div>
  );
}
