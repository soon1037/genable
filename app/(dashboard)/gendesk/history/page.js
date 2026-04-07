"use client";

import { useEffect, useState } from "react";
import { 
  Copy, 
  History, 
  Loader2, 
} from "lucide-react";
import { getSessions, getProfile, getGendeskStats } from "@/lib/db";

export default function UnifiedHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 1. Fetch Profile first to get company_id
      const profileData = await getProfile();
      
      // 2. Fetch Sessions and Stats in parallel if company_id exists
      const sessionsPromise = getSessions();
      const statsPromise = profileData?.company_id ? getGendeskStats(profileData.company_id) : Promise.resolve(null);
      
      const [sessionsData, statsData] = await Promise.all([sessionsPromise, statsPromise]);
      
      setSessions(sessionsData || []);
      setStats(statsData || null);
    } catch (err) {
      console.error("Failed to fetch integrated data in history page:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-neutral-200" />
      </div>
    );
  }

  // 상단 통계 카드 데이터 - 수익성 및 가치 중심으로 개편
  const displayStats = [
    { label: "누적 상담 세션", value: stats?.totalSessions || 0, unit: "건" },
    { label: "플랫폼 서비스 활성도", value: stats?.avgDuration || 0, unit: "Ops" },
    { label: "AI 생성 매출 (KRW)", value: stats?.totalGen || 0, unit: "₩" },
    { label: "최근 7일 플랫폼 기여", value: stats?.trendCount || 0, unit: "건" },
  ];

  return (
    <div className="bg-white font-sans text-neutral-900 h-[calc(100vh-3rem-2rem)] flex flex-col overflow-hidden">
      
      {/* 1. 프리미엄 헤더 (고정) */}
      <header className="shrink-0 border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 pr-8 pl-0 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-neutral-900 uppercase">운영 히스토리</h1>
          </div>
        </div>
      </header>

      {/* 2. 스크롤 가능한 메인 컴텐츠 영역 - 전체 스크롤을 막기 위해 flex-col 및 overflow-hidden 사용 */}
      <main className="flex-1 flex flex-col min-h-0 pr-8 pl-0 py-8 space-y-12">
        
        {/* 통계 카드 (고정) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {displayStats.map((stat, i) => (
            <div key={i} className="card-premium h-full flex flex-col justify-end p-6 min-h-[110px]">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">{stat.label}</span>
                <div className="flex items-baseline gap-1.5 font-black italic tracking-tighter text-neutral-900">
                  <span className="text-3xl">{Number(stat.value).toLocaleString()}</span>
                  <span className="text-lg opacity-20 uppercase not-italic font-sans">{stat.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. 통합 운영 히스토리 테이블 (가변 및 개별 스크롤) */}
        <section className="flex-1 min-h-0 flex flex-col space-y-6">
           <div className="shrink-0 flex items-center justify-between border-b border-neutral-50 pb-4">
              <div className="space-y-1">
                 <h2 className="text-xl font-black italic tracking-tighter text-neutral-900 flex items-center gap-2">
                    <History className="w-5 h-5" />
                    상담 리스트
                 </h2>
                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Real-time Sessions & Mirroring Integrity</p>
              </div>
           </div>

           {/* 테이블 자체 스크롤 영역 */}
           <div className="flex-1 overflow-auto table-container-premium !rounded-[2rem] border-none shadow-none !bg-transparent custom-scrollbar">
              <table className="table-premium relative">
                 <thead className="sticky top-0 z-20 bg-white">
                    <tr>
                       <th>Session ID</th>
                       <th>프로젝트</th>
                       <th>고객 ID</th>
                       <th>상담 시작일시</th>
                       <th className="text-center">상태</th>
                       <th className="text-right">액션</th>
                    </tr>
                 </thead>
                 <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-20 text-center text-neutral-200">
                           <p className="text-[10px] font-black uppercase tracking-[0.4em]">진행된 상담 내역이 없습니다.</p>
                        </td>
                      </tr>
                    ) : (
                      sessions.map((log) => (
                        <tr key={log.id}>
                           <td className="font-mono text-[10px] text-neutral-300">{log.id.slice(0, 8)}</td>
                           <td>
                              <span className="font-bold text-neutral-900">{log.projects?.name}</span>
                           </td>
                           <td>
                              <span className="bg-neutral-50 border border-neutral-100 text-neutral-400 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight">{log.guest_id}</span>
                           </td>
                           <td className="text-neutral-400 text-[12px] font-medium">
                              {new Date(log.created_at).toLocaleString('ko-KR')}
                           </td>
                           <td className="text-center">
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                               log.status === "active" ? "bg-emerald-50 text-emerald-500" : "bg-neutral-50 text-neutral-300"
                             }`}>
                               {log.status === "active" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
                               {log.status === "active" ? "LIVE" : "CLOSED"}
                             </span>
                           </td>
                           <td className="text-right">
                             <div className="flex items-center justify-end gap-3 opacity-20 hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => {
                                   const url = `${window.location.origin}/session/${log.project_id}?id=${log.guest_id}`;
                                   navigator.clipboard.writeText(url);
                                   alert("상담 링크가 복약되었습니다.");
                                 }}
                                 className="text-neutral-300 hover:text-black transition-colors"
                                 title="Copy Link"
                               >
                                 <Copy className="w-4 h-4" />
                               </button>
                               <button className="text-neutral-300 hover:text-black transition-colors" title="View Details">
                                 <History className="w-4 h-4" />
                               </button>
                             </div>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </section>

      </main>

    </div>
  );
}
