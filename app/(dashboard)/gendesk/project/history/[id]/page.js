"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, Settings, Edit, Link as LinkIcon, 
  Copy, Check, Clock, User, Globe, Activity,
  CheckCircle2, XCircle, AlertCircle, Loader2, Plus, Info
} from "lucide-react";
import { getProjectById, getProjectSessionDetails, createOneTimeSession } from "@/lib/db";

const PROJECT_TYPES = [
  { id: 'support', name: '고객지원' },
  { id: 'onboarding', name: '온보딩' },
  { id: 'education', name: '교육' },
  { id: 'interview', name: '면접' },
  { id: 'test', name: '테스트' },
];

export default function ProjectHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [projData, sessData] = await Promise.all([
        getProjectById(id),
        getProjectSessionDetails(id)
      ]);
      setProject(projData);
      setSessions(sessData || []);
    } catch (err) {
      console.error("Failed to fetch history data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopying(key);
    setTimeout(() => setCopying(null), 2000);
  };

  const renderResultData = (data) => {
    if (!data) return "-";
    if (typeof data === 'object') {
       // Only if result_data is an object with a 'text' or 'value' key
       return data.text || data.value || JSON.stringify(data);
    }
    return String(data);
  };

  const handleTogglePermanent = async () => {
    const newValue = project.settings?.is_permanent_enabled === false;
    try {
      await updateProject(id, { 
        settings: { ...project.settings, is_permanent_enabled: newValue } 
      });
      setProject(prev => ({
        ...prev,
        settings: { ...prev.settings, is_permanent_enabled: newValue }
      }));
    } catch (err) {
      alert("설정 변경에 실패했습니다.");
    }
  };

  const handleCreateOneTime = async () => {
    try {
      const sess = await createOneTimeSession(id);
      if (!sess) throw new Error("No session created");
      const url = `${window.location.origin}/session/${id}?id=${sess.id}`;
      handleCopy(url, 'one-time');
      fetchData(); // Refresh list
    } catch (err) {
      console.error("1-time link error:", err);
      alert("1회용 링크 생성에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (!project) return <div>Project not found.</div>;

  const permanentUrl = `${window.location.origin}/session/${id}`;

  // Flatten all missions from all stages for column mapping
  const allMissions = project.missions?.flatMap(stage => 
    stage.missions.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type
    }))
  ) || [];

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 pb-20">
      {/* Header */}
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/gendesk/project')}
              className="p-2 hover:bg-neutral-50 rounded-xl transition-all text-neutral-400 hover:text-black"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                    {PROJECT_TYPES.find(t => t.id === project.type)?.name || '기타'}
                 </span>
                 <h1 className="text-xl font-black italic tracking-tighter">{project.name}</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Link href={`/gendesk/project/${id}/settings`} className="btn-primary flex items-center gap-2 py-2.5 px-6 shadow-xl shadow-black/5">
                <Settings className="w-4 h-4" />
                수정하기
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-12">
        
        {/* Link Management Section */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <label className="label-premium">링크 관리</label>
              <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-300">
                 <Info className="w-3.5 h-3.5" />
                 1회용 링크는 접속 후 즉시 만료됩니다.
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-8">
              <div className="card-premium h-44 flex flex-col justify-between">
                 <div>
                    <div className="flex items-center justify-between">
                       <h4 className="text-sm font-bold flex items-center gap-2">
                           <Globe className="w-4 h-4 text-blue-500" />
                           상시 운영용 URL
                        </h4>
                        <button 
                          onClick={handleTogglePermanent}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${project.settings?.is_permanent_enabled !== false ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-neutral-100 text-neutral-400 border-neutral-200'}`}
                        >
                          {project.settings?.is_permanent_enabled !== false ? 'ON (활성)' : 'OFF (비활성)'}
                        </button>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-medium mt-1">누구나 언제든 접속 가능한 공식 주소입니다.</p>
                 </div>
                 <div className="flex p-1 bg-neutral-100 rounded-2xl items-center gap-1">
                    <div className="flex-1 flex items-center bg-white px-4 py-2.5 rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                       <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mr-2 group-hover:text-blue-500 transition-colors">PATH</span>
                       <span className="text-[12px] font-mono font-bold text-black truncate">/session/{id}</span>
                    </div>
                    <button 
                       onClick={() => handleCopy(permanentUrl, 'permanent')}
                       className={`flex items-center justify-center p-3 rounded-xl transition-all ${copying === 'permanent' ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-900 shadow-sm border border-neutral-200'}`}
                    >
                       {copying === 'permanent' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
              </div>

              <div className="card-premium h-44 flex flex-col justify-between border-neutral-200 bg-neutral-900 text-white shadow-xl shadow-black/10">
                 <div className="flex justify-between items-start">
                    <div>
                       <h4 className="text-sm font-bold flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-emerald-400" />
                          1회용 보안 링크
                       </h4>
                       <p className="text-[11px] text-white/40 font-medium mt-1">수동 발급된 단일 접속 주소입니다.</p>
                    </div>
                    <div className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-black text-white/20 uppercase tracking-widest">보안</div>
                 </div>
                 <button 
                    onClick={handleCreateOneTime}
                    className="w-full bg-white text-black py-3 rounded-xl text-xs font-bold hover:bg-neutral-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                    {copying === 'one-time' ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    새로운 1회용 링크 생성 및 복사
                 </button>
              </div>
           </div>
        </section>

        {/* History Table Section */}
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
           <label className="label-premium">상세 세션 히스토리</label>
           <div className="table-container-premium mt-6 overflow-x-auto">
              <table className="table-premium">
                  <thead>
                    <tr>
                       <th className="min-w-[120px]">세션 구분</th>
                       <th className="min-w-[140px]">접속 ID / IP</th>
                       <th className="min-w-[180px]">세션 시각</th>
                       <th className="min-w-[100px]">진행 상태</th>
                       {/* Dynamic Mission Columns */}
                       {allMissions.map(m => (
                         <th key={m.id} className="min-w-[120px] max-w-[200px] truncate" title={m.title}>
                           {m.title}
                         </th>
                       ))}
                       <th className="md:text-right min-w-[100px]">대화 보기</th>
                    </tr>
                 </thead>
                 <tbody>
                    {sessions.map((sess) => (
                      <tr key={sess.id} className="group">
                         <td>
                            <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${sess.id === sess.guest_id ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-neutral-50 text-neutral-400 border-neutral-100'}`}>
                               {sess.id === sess.guest_id ? '1회용' : '상시'}
                            </div>
                         </td>
                         <td className="space-y-0.5">
                            <div className="text-[11px] font-bold text-neutral-900">{sess.guest_id || '미확인'}</div>
                            <div className="font-mono text-[9px] font-bold text-neutral-300">
                               {sess.ip_address || "IP 미확인"}
                            </div>
                         </td>
                         <td>
                            <div className="space-y-1">
                               <div className="flex items-center gap-1.5 text-neutral-900 font-bold text-[12px]">
                                  <Clock className="w-3.5 h-3.5 text-neutral-300" />
                                  {new Date(sess.created_at).toLocaleString('ko-KR', { 
                                     timeZone: 'Asia/Seoul', 
                                     month: 'short', 
                                     day: 'numeric', 
                                     hour: '2-digit', 
                                     minute: '2-digit' 
                                  })}
                               </div>
                               {sess.ended_at && (
                                 <p className="text-[10px] text-neutral-400 font-medium ml-5">
                                    총 {Math.round((new Date(sess.ended_at) - new Date(sess.created_at)) / 1000 / 60)}분 상담 진행
                                 </p>
                               )}
                            </div>
                         </td>
                         <td>
                            <div className="flex items-center gap-2">
                               {sess.status === 'pending' ? (
                                 <>
                                   <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                                   <span className="text-[11px] font-bold text-neutral-400">미진행</span>
                                 </>
                               ) : sess.status === 'active' ? (
                                 <>
                                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                   <span className="text-[11px] font-bold text-blue-500">진행중</span>
                                 </>
                               ) : (
                                 <>
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                   <span className="text-[11px] font-bold text-emerald-500">완료</span>
                                 </>
                               )}
                            </div>
                         </td>
                         
                         {/* Map Mission Results to Columns */}
                         {allMissions.map(m => {
                           const result = sess.mission_results?.find(r => r.mission_id === m.id);
                           return (
                             <td key={m.id}>
                               {result ? (
                                 <div className="flex items-center gap-2">
                                   <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${result.status === 'success' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                   <span className={`text-[11px] font-bold truncate max-w-[150px] ${m.type === 'verify' ? (result.status === 'success' ? 'text-emerald-600' : 'text-red-500') : 'text-neutral-900'}`}>
                                      {m.type === 'collect' ? renderResultData(result.result_data) : (result.status === 'success' ? '성공' : '실패')}
                                   </span>
                                 </div>
                               ) : (
                                 <span className="text-neutral-200 text-[11px] font-bold">-</span>
                               )}
                             </td>
                           );
                         })}

                         <td className="md:text-right">
                            <button className="text-[10px] font-black text-neutral-300 uppercase tracking-widest hover:text-black transition-colors">
                                내역 보기
                            </button>
                         </td>
                      </tr>
                    ))}
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan={5 + allMissions.length} className="py-20 text-center text-neutral-300 font-bold text-[12px] italic">
                           아직 기록된 세션 히스토리가 없습니다.
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </section>

      </main>
    </div>
  );
}
