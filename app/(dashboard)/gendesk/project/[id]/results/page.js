"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  BarChart3, Users, CheckCircle2, XCircle, 
  Clock, Download, Filter, Search, 
  ArrowLeft, GraduationCap, TestTube, Target,
  ExternalLink, ChevronRight, Info
} from "lucide-react";
import Link from "next/link";
import { getProjectById, getProjectMissionResults } from "@/lib/db";

export default function MissionResultsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projData, resultsData] = await Promise.all([
          getProjectById(id),
          getProjectMissionResults(id)
        ]);
        setProject(projData);
        setResults(resultsData || []);
      } catch (err) {
        console.error("Failed to fetch results:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-t-2 border-black animate-spin" />
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const completionRate = results.length > 0 ? Math.round((successCount / results.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
             <Link href="/gendesk/project" className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-black">
                <ArrowLeft className="w-4 h-4" />
             </Link>
             <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Project Results</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-neutral-900 flex items-center gap-3">
             <BarChart3 className="w-8 h-8 text-blue-500" />
             {project?.name || "Mission Results"}
          </h1>
          <p className="text-sm font-medium text-neutral-400 ml-10">실시간 미션 수행 결과 및 수집된 데이터를 분석합니다.</p>
        </div>

        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-neutral-50 text-neutral-500 border border-neutral-200 rounded-xl text-xs font-bold hover:bg-white transition-all">
              <Download className="w-3.5 h-3.5" /> CSV 추출
           </button>
           <Link href={`/gendesk/project/${id}/settings`} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold shadow-xl shadow-black/10 hover:scale-105 transition-all">
              미션 재설계
           </Link>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "총 미션 리포트", value: results.length, icon: Target, color: "text-neutral-900" },
           { label: "성공/완료율", value: `${completionRate}%`, icon: CheckCircle2, color: "text-emerald-500" },
           { label: "누적 세션 수", value: Array.from(new Set(results.map(r => r.session_id))).length, icon: Users, color: "text-blue-500" },
           { label: "평균 결과 도출", value: "2분 14초", icon: Clock, color: "text-orange-500" },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-neutral-50 rounded-lg">
                 <stat.icon className="w-4 h-4 text-neutral-400" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{stat.label}</span>
             </div>
             <p className={`text-2xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
           </div>
         ))}
      </div>

      {/* Main Results Table/Feed */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xl shadow-black/5">
         
         {/* Filter Bar */}
         <div className="p-6 border-b border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-2">
                  <Search className="w-4 h-4 text-neutral-300" />
                  <input type="text" placeholder="세션 ID 검색..." className="text-xs font-medium outline-none bg-transparent w-40" />
               </div>
               <div className="flex items-center gap-2">
                  <button className="text-[10px] font-bold text-neutral-400 hover:text-black transition-colors uppercase tracking-widest flex items-center gap-1">
                     <Filter className="w-3 h-3" /> Filter By Status
                  </button>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full animate-pulse">
                  Live Updating
               </span>
            </div>
         </div>

         <div className="divide-y divide-neutral-100">
            {results.length === 0 ? (
               <div className="py-32 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mb-2">
                     <Info className="w-8 h-8 text-neutral-100" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">수집된 결과가 없습니다.</h3>
                  <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-widest max-w-[200px]">AI 에이전트가 미션을 수행하면 이곳에 실시간으로 표시됩니다.</p>
               </div>
            ) : (
               results.map((result) => (
                  <div key={result.id} className="p-8 hover:bg-neutral-50/50 transition-all group">
                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        
                        {/* Section 1: Session Meta */}
                        <div className="w-full md:w-64 space-y-3">
                           <div className="flex items-center gap-2">
                              {result.status === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : result.status === 'failure' ? (
                                <XCircle className="w-5 h-5 text-red-400" />
                              ) : (
                                <Clock className="w-5 h-5 text-neutral-300" />
                              )}
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                result.status === 'success' ? "text-emerald-500" : 
                                result.status === 'failure' ? "text-red-400" : "text-neutral-400"
                              }`}>
                                {result.status.toUpperCase()}
                              </span>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">CLIENT ID</p>
                              <p className="text-sm font-black italic tracking-tighter text-neutral-900 truncate">
                                 {result.sessions?.guest_id || "익명 사용자"}
                              </p>
                           </div>
                           <div className="pt-2">
                              <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">TIMESTAMPS</p>
                              <p className="text-[11px] font-bold text-neutral-400">
                                 {new Date(result.created_at).toLocaleString('ko-KR', { 
                                   month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                 })}
                              </p>
                           </div>
                        </div>

                        {/* Section 2: Mission Detail & Data */}
                        <div className="flex-1 space-y-6">
                           <div className="flex items-center gap-2">
                              {result.type === 'guide' ? <GraduationCap className="w-4 h-4 text-blue-500" /> :
                               result.type === 'verify' ? <TestTube className="w-4 h-4 text-amber-500" /> :
                               <Target className="w-4 h-4 text-emerald-500" />}
                              <h3 className="text-[13px] font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                                 {result.mission_id}
                              </h3>
                           </div>
                           
                           {/* Data Cards */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Collected Fields (JSON Visualization) */}
                              {Object.entries(result.result_data || {}).length > 0 && (
                                <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm">
                                   <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Collected Information</p>
                                   <div className="space-y-3">
                                      {Object.entries(result.result_data).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between">
                                           <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
                                           <span className="text-[11px] font-black text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">
                                              {String(value)}
                                           </span>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              )}

                              {/* Proof Visualization */}
                              {result.proof_image_url && (
                                <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm group/img cursor-pointer">
                                   <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Verification Proof</p>
                                   <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100">
                                      <img src={result.proof_image_url} alt="Proof" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                         <ExternalLink className="w-5 h-5 text-white" />
                                      </div>
                                   </div>
                                </div>
                              )}

                              {result.type === 'guide' && !result.result_data && (
                                <div className="bg-neutral-50 border border-transparent rounded-2xl p-5 flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold text-neutral-900 italic tracking-tight">AI 가이드 수행 완료</p>
                                      <p className="text-[10px] text-neutral-400 font-medium">사용자가 모든 안내 단계를 마쳤습니다.</p>
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>

                        {/* Section 3: Result Action */}
                        <div className="pt-2 md:pt-0">
                           <button className="w-full md:w-auto p-3 hover:bg-neutral-100 rounded-2xl transition-all group/btn flex items-center justify-center gap-2 md:block">
                              <ChevronRight className="w-5 h-5 text-neutral-200 group-hover/btn:text-black group-hover/btn:translate-x-1 transition-all" />
                           </button>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* Secondary Context Footer */}
      <div className="flex items-center justify-center gap-8 py-8 border-t border-neutral-100">
         <div className="flex items-center gap-2 opacity-30 grayscale group hover:grayscale-0 transition-all cursor-default">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <span className="text-[11px] font-black italic tracking-tighter uppercase">Genable Analytics Engine v1.0</span>
         </div>
      </div>

    </div>
  );
}
