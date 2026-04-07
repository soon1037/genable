"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  CreditCard, 
  ShieldCheck, 
  Loader2, 
  Plus,
  ArrowRight, 
  Activity, 
  Zap, 
  History,
  Clock,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { getProfile, getCompanySummaryStats, getServicePricing } from "@/lib/db";
import Link from "next/link";

export default function CompanyHomePage() {
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const prof = await getProfile();
        setProfile(prof);
        
        if (prof?.company_id) {
          const [stats, priceData] = await Promise.all([
            getCompanySummaryStats(prof.company_id),
            getServicePricing()
          ]);
          setDashboardData(stats);
          setPricing(priceData);
        }
      } catch (err) {
        console.error("대시보드 실시간 연동 오류:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-neutral-200" />
      </div>
    );
  }

  const usageLogs = dashboardData?.recentLogs || [];

  return (
    <div className="bg-white font-sans text-neutral-900 pb-20">
      
      {/* 1. 커맨드 센터 헤더 */}
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 pr-8 pl-0 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-neutral-900 uppercase">비즈니스 커맨드 센터</h1>
          </div>
          <Link 
            href="/company/plan"
            className="btn-primary flex items-center gap-2 px-5 py-2.5"
          >
            <Plus className="w-4 h-4" />
            GEN 충전하기
          </Link>
        </div>
      </header>

      <main className="pr-8 pl-0 py-10 space-y-12">
        
        {/* 2. 자산 및 비즈니스 현황 (Real-time DB 기반) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 가용 자산 카드 */}
          <div className="card-premium h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-400">
                  <CreditCard className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">가용 자산</span>
            </div>
            <div>
               <p className="text-3xl font-black italic tracking-tighter text-neutral-900 mb-1">
                  {Number(dashboardData?.genBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })} <span className="text-sm not-italic opacity-30">GEN</span>
               </p>
               <p className="text-xs text-neutral-400 font-medium tracking-tight">AI 연산 가용 잔액</p>
            </div>
          </div>

          {/* 누적 서비스 지출 (Customer Perspective) */}
          <div className="card-premium h-full border-black bg-neutral-900 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 text-white">
                  <TrendingUp className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">누적 서비스 지출</span>
            </div>
            <div>
               <p className="text-3xl font-black italic tracking-tighter text-white mb-1">
                  ₩{Number(dashboardData?.totalRevenue || 0).toLocaleString()}
               </p>
               <p className="text-xs text-neutral-500 font-medium tracking-tight">현재까지의 총 서비스 이용 금액</p>
            </div>
          </div>

          {/* 구독 멤버십 카드 (Real) */}
          <div className="card-premium h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-400">
                  <ShieldCheck className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">구독 멤버십</span>
            </div>
            <div>
               <p className="text-2xl font-bold text-neutral-900 mb-1">{dashboardData?.membershipLevel || 'Standard'}</p>
               <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest text-[9px]">ACTIVE SUBSCRIPTION</p>
            </div>
          </div>

          {/* 팀 규모 카드 (Real) */}
          <div className="card-premium h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 text-neutral-400">
                  <Users className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">팀 규모</span>
            </div>
            <div>
               <p className="text-2xl font-bold text-neutral-900 mb-1">{dashboardData?.memberCount || 0}명 활성</p>
               <p className="text-xs text-neutral-400 font-medium tracking-tight">최대 10명 초대 가능</p>
            </div>
          </div>

        </div>

        {/* 3. 서비스별 요율 정책 */}
        <section className="space-y-4">
           <label className="label-premium text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-black">서비스별 실시간 과금 요율 (GEN)</label>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pricing.map((p, i) => (
                <div key={i} className="p-4 bg-neutral-50/50 rounded-xl border border-neutral-100 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                   <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">{p.service_name}</p>
                   <p className="text-sm font-bold text-neutral-900">
                      {Number(p.gen_per_unit).toLocaleString()} 
                      <span className="text-[9px] font-normal opacity-40 ml-1 uppercase tracking-tighter">
                         GEN / {p.service_name === 'live' ? 'SEC' : 'UNIT'}
                      </span>
                   </p>
                </div>
              ))}
           </div>
        </section>

        {/* 4. 운영 내역 타임라인 */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <label className="label-premium text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-black !mb-0">최근 시스템 운영 로그</label>
              <Link href="/gendesk/history" className="text-[11px] font-bold text-neutral-300 hover:text-black flex items-center gap-1 transition-colors uppercase tracking-widest border-b border-neutral-50 hover:border-black pb-1">
                 상세 로그 <ArrowUpRight className="w-3 h-3" />
              </Link>
           </div>
           
           <div className="table-container-premium">
              <div className="overflow-x-auto">
                 <table className="table-premium min-w-[1000px]">
                    <thead>
                       <tr>
                          <th className="w-24">유형</th>
                          <th>프로젝트 정보</th>
                          <th>운영 상세</th>
                          <th className="text-right">지출액 (KRW)</th>
                          <th className="text-right">일시</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 text-neutral-700">
                       {usageLogs.slice(0, 10).map((log) => {
                         const isLive = log.service_type === 'live';
                         return (
                            <tr key={log.id} className="hover:bg-neutral-50 group transition-colors">
                               <td>
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    isLive 
                                    ? 'bg-neutral-900 text-white border-black' 
                                    : 'bg-white text-neutral-400 border-neutral-200'
                                  }`}>
                                     {isLive ? 'LIVE' : 'DESIGN'}
                                  </span>
                               </td>
                               <td className="font-bold text-neutral-900 whitespace-nowrap">{log.projects?.name || '시스템'}</td>
                               <td className="text-neutral-500 italic text-xs whitespace-nowrap">
                                  {isLive ? '실시간 상담 세션 종료' : 'AI 디자인 생성 완료'}
                               </td>
                               <td className="text-right font-black text-neutral-900 tracking-tighter">
                                  -₩{Number(log.cost_krw || 0).toLocaleString()}
                                </td>
                               <td className="text-right text-neutral-400 font-medium text-[11px] whitespace-nowrap">
                                  {new Date(log.created_at).toLocaleString('ko-KR', { 
                                     month: '2-digit', 
                                     day: '2-digit', 
                                     hour: '2-digit', 
                                     minute: '2-digit' 
                                  })}
                               </td>
                            </tr>
                         );
                       })}
                       {usageLogs.length === 0 && (
                         <tr>
                            <td colSpan="5" className="py-24 text-center text-neutral-200 font-bold uppercase tracking-[0.3em] text-[10px]">
                               시스템 운영 기록이 존재하지 않습니다
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>

      </main>
      
      <footer className="mt-20 text-center border-t border-neutral-50 pt-20 px-8">
         <p className="text-[9px] font-black text-neutral-100 uppercase tracking-[0.6em]">기업 자원 관리 시스템 INTEGRITY © 2026 GENABLE</p>
      </footer>
    </div>
  );
}
