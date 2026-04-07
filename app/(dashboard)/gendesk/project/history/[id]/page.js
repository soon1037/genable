"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, Settings, Edit, Link as LinkIcon, 
  Copy, Check, Clock, User, Globe, Activity,
  CheckCircle2, XCircle, AlertCircle, Loader2, Plus, Info,
  ArrowDownRight, MessageSquare, Download
} from "lucide-react";
import { getProjectById, getProjectSessionDetails, createOneTimeSession, updateProject } from "@/lib/db";

const PROJECT_TYPES = [
  { id: 'support', name: '고객지원' },
  { id: 'onboarding', name: '온보딩' },
  { id: 'education', name: '교육' },
  { id: 'interview', name: '면접' },
  { id: 'test', name: '테스트' },
];

const PAGE_SIZE = 50;

export default function ProjectHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const [copying, setCopying] = useState(null);
  const [selectedSess, setSelectedSess] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  
  const observerTarget = useRef(null);

  useEffect(() => {
    if (id) initialLoad();
  }, [id]);

  useEffect(() => {
    if (isDrawerOpen && !isClosing) {
      setTimeout(() => setDrawerMounted(true), 10);
    } else {
      setDrawerMounted(false);
    }
  }, [isDrawerOpen, isClosing]);

  // 무한 스크롤 감지 센서 설정
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loadingMore && !loading) {
      loadMoreSessions();
    }
  }, [hasMore, loadingMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [handleObserver]);

  async function initialLoad() {
    setLoading(true);
    setPage(0);
    setHasMore(true);
    try {
      const [projData, sessData] = await Promise.all([
        getProjectById(id),
        getProjectSessionDetails(id, PAGE_SIZE, 0)
      ]);
      setProject(projData);
      setSessions(sessData || []);
      if (!sessData || sessData.length < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error("Failed to fetch history data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreSessions() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const moreData = await getProjectSessionDetails(id, PAGE_SIZE, nextPage * PAGE_SIZE);
      if (!moreData || moreData.length < PAGE_SIZE) setHasMore(false);
      setSessions(prev => [...prev, ...(moreData || [])]);
      setPage(nextPage);
    } catch (err) {
      console.error("Failed to load more sessions:", err);
    } finally {
      setLoadingMore(false);
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
       const val = data.text || data.value || data.number || data.data || data.result;
       if (val !== undefined && val !== null) return String(val);
       const keys = Object.keys(data);
       if (keys.length === 1) {
          const firstVal = data[keys[0]];
          if (typeof firstVal !== 'object') return String(firstVal);
       }
       return JSON.stringify(data).replace(/"/g, '""');
    }
    return String(data).replace(/"/g, '""');
  };

  // 📥 CSV 다운로드 로직 (전체 페칭 대응)
  const handleDownloadCSV = async () => {
    try {
      setLoadingMore(true); // 시각적 피드백
      // 🎯 CSV 내보내기를 위해 전체 히스토리 다시 한 번 긁어오기 (No Limit)
      const allSessions = await getProjectSessionDetails(id, null);
      if (!allSessions || allSessions.length === 0) return;

      const staticHeaders = ["세션 구분", "ID/IP", "IP 주소", "접속 시각", "종료 시각", "소요 시간(분)", "상태"];
      const missionHeaders = (project.missions?.flatMap(stage => stage.missions.map(m => m.title)) || []);
      const csvHeader = [...staticHeaders, ...missionHeaders].join(",");

      const csvRows = allSessions.map(sess => {
        const type = (sess.id === sess.guest_id || sess.guest_id?.startsWith('Secure-')) ? '1회용' : '상시';
        const startTime = new Date(sess.created_at).toLocaleString('ko-KR');
        const endTime = sess.ended_at ? new Date(sess.ended_at).toLocaleString('ko-KR') : "-";
        const duration = sess.ended_at ? Math.round((new Date(sess.ended_at) - new Date(sess.created_at)) / 1000 / 60) : "-";
        const statusMap = { 'pending': '대기중', 'active': '진행중', 'completed': '완료' };
        
        const staticPart = [
          type, 
          `"${sess.guest_id}"`, 
          `"${sess.ip_address || '-'}"`, 
          `"${startTime}"`, 
          `"${endTime}"`, 
          duration, 
          statusMap[sess.status] || sess.status
        ];

        const missionPart = (project.missions?.flatMap(stage => 
          stage.missions.map(m => {
            const res = sess.mission_results?.find(r => 
              String(r.mission_id) === String(m.id) || 
              r.mission_id?.toLowerCase() === m.title?.toLowerCase()
            );
            if (!res) return "-";
            return m.type === 'collect' ? `"${renderResultData(res.result_data)}"` : (res.status === 'success' ? '성공' : '실패');
          })
        ) || []);

        return [...staticPart, ...missionPart].join(",");
      });

      const csvContent = "\uFEFF" + [csvHeader, ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `genable_history_${project.name}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("CSV 생성에 실패했습니다.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleStatusChange = async (newValue) => {
    if (project.settings?.is_permanent_enabled === newValue) return;
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
      initialLoad(); // Refresh
    } catch (err) {
      console.error("1-time link error details:", err);
      const msg = err?.message || JSON.stringify(err);
      alert(`1회용 링크 생성에 실패했습니다: ${msg}`);
    }
  };

  const handleRowClick = (sess) => {
    setSelectedSess(sess);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsClosing(true);
    setDrawerMounted(false);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
      setSelectedSess(null);
    }, 500); 
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

  const allMissions = project.missions?.flatMap(stage => 
    stage.missions.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type
    }))
  ) || [];

  return (
    <div className="bg-white font-sans text-neutral-900 pb-20">
      {/* Header */}
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 pr-8 pl-0 py-4">
        <div className="flex items-start justify-between">
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
             <button 
                onClick={handleDownloadCSV}
                className="btn-secondary flex items-center gap-2 py-2.5 px-6"
                disabled={loadingMore}
             >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                CSV 다운로드
             </button>
             <Link href={`/gendesk/project/${id}/settings`} className="btn-primary flex items-center gap-2 py-2.5 px-6 shadow-xl shadow-black/5">
                <Settings className="w-4 h-4" />
                수정이동
             </Link>
          </div>
        </div>
      </header>

      <main className="pr-8 pl-0 py-10 space-y-12">
        
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
              <div className="card-premium min-h-[176px] flex flex-col justify-between">
                 <div>
                    <div className="flex items-start justify-between">
                       <h4 className="text-sm font-bold flex items-center gap-2 mt-1">
                           <Globe className="w-4 h-4 text-blue-500" />
                           상시 운영용 URL
                        </h4>
                        {/* Segmented Picker for Status */}
                        <div className="flex p-1 bg-neutral-100 rounded-xl">
                          <button 
                            onClick={() => handleStatusChange(false)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${project.settings?.is_permanent_enabled === false ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                          >
                            비활성
                          </button>
                          <button 
                            onClick={() => handleStatusChange(true)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${project.settings?.is_permanent_enabled !== false ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                          >
                            활성
                          </button>
                        </div>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-medium mt-1">누구나 언제든 접속 가능한 공식 주소입니다.</p>
                 </div>

                 <div className="space-y-3 mt-4">
                    {project.settings?.is_permanent_enabled !== false ? (
                      <div className="flex p-1.5 bg-neutral-50 rounded-xl border border-neutral-100 items-center justify-between animate-in fade-in zoom-in duration-300">
                         <span className="text-[11px] font-mono text-neutral-400 px-3 truncate max-w-[350px]">{permanentUrl}</span>
                         <button 
                            onClick={() => handleCopy(permanentUrl, 'permanent')}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all ${copying === 'permanent' ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-neutral-100 text-neutral-300 shadow-sm border border-neutral-200'}`}
                         >
                            {copying === 'permanent' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                         </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-[11px] font-bold italic animate-in fade-in slide-in-from-bottom-2 duration-300">
                         상시 운영용 URL이 비활성(OFF) 상태입니다.
                      </div>
                    )}
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
                      <tr 
                        key={sess.id} 
                        onClick={() => handleRowClick(sess)}
                        className="group hover:bg-neutral-50 cursor-pointer transition-all border-b border-neutral-50 last:border-0"
                      >
                         <td>
                            {/* guest_id가 Secure-로 시작하거나 sess.id와 같으면 1회용으로 간주 */}
                            <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${(sess.id === sess.guest_id || sess.guest_id?.startsWith('Secure-')) ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-neutral-50 text-neutral-400 border-neutral-100'}`}>
                               {(sess.id === sess.guest_id || sess.guest_id?.startsWith('Secure-')) ? '1회용' : '상시'}
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
                                  {(() => {
                                     // Ensure we parse the DB timestamp accurately
                                     const d = new Date(sess.created_at);
                                     if (isNaN(d.getTime())) return "시간 미확인";
                                     
                                     const y = d.getFullYear();
                                     const m = String(d.getMonth() + 1).padStart(2, '0');
                                     const date = String(d.getDate()).padStart(2, '0');
                                     const h = String(d.getHours()).padStart(2, '0');
                                     const min = String(d.getMinutes()).padStart(2, '0');
                                     return `${y}.${m}.${date} ${h}:${min}`;
                                  })()}
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
                                {sess.status === 'pending' || (sess.status === 'active' && !sess.ip_address) ? (
                                  <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                    <span className="text-[11px] font-bold text-orange-500">대기중</span>
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
                           // Match by ID or Title (Case-insensitive)
                           // Match by ID, Title (Case-insensitive), or Alias
                           const result = sess.mission_results?.find(r => 
                               String(r.mission_id) === String(m.id) || 
                               r.mission_id?.toLowerCase() === m.title?.toLowerCase() ||
                               (r.mission_id?.startsWith('mission_') && project.missions?.some((stage, sIdx) => {
                                  // This is a fallback to try and map mission_1, mission_2 to the actual mission
                                  // based on the same indexing used in the hook.
                                  let counter = 1;
                                  for (const s of project.missions || []) {
                                     for (const msgObj of s.missions || []) {
                                        if (`mission_${counter++}` === r.mission_id) return String(msgObj.id) === String(m.id);
                                     }
                                  }
                                  return false;
                               }))
                           );
                           return (
                             <td key={m.id}>
                               {result ? (
                               <div className="flex items-center gap-2">
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
                             <div className="text-[10px] font-black text-neutral-300 uppercase tracking-widest group-hover:text-black transition-colors">
                                 상세 보기
                             </div>
                          </td>
                       </tr>
                     ))}
                     {sessions.length === 0 && (
                       <tr>
                         <td colSpan={5 + allMissions.length} className="py-20 text-center text-neutral-300 font-bold text-[12px] italic">
                            아직 기록된 세션 히스토리 가 없습니다.
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
               
               {/* 🎯 Infinite Scroll Sentinel & Loading Indicator */}
               <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mt-4">
                  {loadingMore && hasMore && (
                    <div className="flex items-center gap-2 text-neutral-400 text-[11px] font-bold animate-pulse">
                       <Loader2 className="w-3.5 h-3.5 animate-spin" />
                       추가 히스토리 불러오는 중...
                    </div>
                  )}
                  {!hasMore && sessions.length > 0 && (
                    <div className="text-neutral-200 text-[10px] font-black uppercase tracking-widest">
                       모든 히스토리를 불러왔습니다
                    </div>
                  )}
               </div>
            </div>
         </section>

       </main>

       {/* Detail Drawer */}
       {isDrawerOpen && selectedSess && (
         <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
           {/* Backdrop */}
           <div 
             className={`fixed inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity duration-500 ease-in-out ${
               drawerMounted && !isClosing ? "opacity-100" : "opacity-0"
             }`}
             onClick={handleCloseDrawer} 
           />
           
           {/* Drawer Content */}
           <div className={`
             relative w-full max-w-xl bg-white border-l border-neutral-100 shadow-2xl z-[10000] h-full transition-transform duration-500 ease-in-out transform flex flex-col
             ${drawerMounted && !isClosing ? "translate-x-0" : "translate-x-full"}
           `}>
             {/* Drawer Header */}
             <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100 bg-white sticky top-0 z-10">
               <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${(selectedSess.id === selectedSess.guest_id || selectedSess.guest_id?.startsWith('Secure-')) ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-neutral-50 text-neutral-400 border-neutral-100'}`}>
                     {(selectedSess.id === selectedSess.guest_id || selectedSess.guest_id?.startsWith('Secure-')) ? '1회용' : '상시'}
                  </span>
                  <h3 className="text-lg font-black italic tracking-tighter text-black truncate max-w-[200px]">{selectedSess.id}</h3>
               </div>
               <button onClick={handleCloseDrawer} className="p-2 hover:bg-neutral-100 rounded-xl transition-all">
                 <XCircle className="w-6 h-6 text-neutral-300 hover:text-black" />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-12">
               {/* Core Stats */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-neutral-50 rounded-3xl space-y-1.5 border border-neutral-100">
                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        IP Address
                     </p>
                     <p className="text-sm font-mono font-bold text-black">{selectedSess.ip_address || "미확인"}</p>
                  </div>
                  <div className="p-5 bg-neutral-50 rounded-3xl space-y-1.5 border border-neutral-100">
                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3" />
                        Guest ID
                     </p>
                     <p className="text-sm font-bold text-black truncate">{selectedSess.guest_id || "미확인"}</p>
                  </div>
                  <div className="p-5 bg-neutral-50 rounded-3xl space-y-1.5 border border-neutral-100 col-span-2">
                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Session Time
                     </p>
                     <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold text-black">
                           {(() => {
                              const d = new Date(selectedSess.created_at);
                              return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                           })()}
                        </span>
                        <ArrowDownRight className="w-3 h-3 text-neutral-200" />
                        <span className="text-[12px] font-bold text-black">
                           {selectedSess.ended_at ? (() => {
                              const d = new Date(selectedSess.ended_at);
                              return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                           })() : "진행중"}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Mission Status */}
               <div className="space-y-6">
                  <label className="label-premium flex items-center justify-between">
                     미션 진행 결과
                     <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">{selectedSess.mission_results?.length || 0} / {allMissions.length} 완료</span>
                  </label>
                  <div className="space-y-3">
                     {allMissions.map((m) => {
                        const res = selectedSess.mission_results?.find(r => 
                           String(r.mission_id) === String(m.id) || 
                           r.mission_id?.toLowerCase() === m.title?.toLowerCase()
                        );
                        return (
                           <div key={m.id} className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${res ? 'bg-white border-neutral-100 shadow-sm' : 'bg-neutral-50 border-neutral-50 opacity-40'}`}>
                              <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${res ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-300'}`}>
                                    {res ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                                 </div>
                                 <div>
                                    <h5 className="text-[12px] font-bold text-neutral-900">{m.title}</h5>
                                    <p className="text-[10px] font-medium text-neutral-400 capitalize">{m.type}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className={`text-[12px] font-black italic tracking-tight ${res?.status === 'success' ? 'text-neutral-900' : 'text-neutral-300'}`}>
                                    {res ? (m.type === 'collect' ? renderResultData(res.result_data) : 'SUCCESS') : 'PENDING'}
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Transcript */}
               <div className="space-y-6">
                  <label className="label-premium flex items-center justify-between">
                     대화 트랜스크립트
                     <div className="p-1 px-3 bg-neutral-900 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">Live Log</div>
                  </label>
                  <div className="bg-neutral-50 rounded-[2.5rem] p-8 space-y-8 border border-neutral-100 min-h-[300px]">
                     {selectedSess.transcript && selectedSess.transcript.length > 0 ? selectedSess.transcript.map((msg, idx) => {
                        // Standardize role and text since data formats have evolved
                        const role = msg.role || (msg.user !== undefined && msg.user !== "" ? 'user' : 'assistant');
                        const text = msg.text || (role === 'user' ? msg.user : msg.assistant);
                        
                        // If both are empty, skip empty bubble
                        if (!text) return null;

                        return (
                          <div key={idx} className={`flex flex-col ${role === 'user' ? 'items-end' : 'items-start'}`}>
                             <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-[13px] font-medium leading-relaxed ${role === 'user' ? 'bg-black text-white rounded-tr-none shadow-xl shadow-black/5' : 'bg-white text-neutral-900 border border-neutral-100 rounded-tl-none shadow-sm'}`}>
                                {text}
                             </div>
                             <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-2 px-1">
                                {role === 'user' ? 'Guest Participant' : 'Genable AI Assistant'}
                             </span>
                          </div>
                        );
                      }) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                           <Info className="w-10 h-10" strokeWidth={1.5} />
                           <p className="text-[12px] font-bold">기록된 대화 내역이 없습니다.</p>
                        </div>
                     )}
                  </div>
               </div>
             </div>

             <div className="p-8 border-t border-neutral-100 bg-neutral-50/50">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Session Data Verified</p>
                     <p className="text-[11px] font-bold text-neutral-400 italic">Genable Data Shield &copy; 2026</p>
                  </div>
                  <button onClick={handleCloseDrawer} className="btn-primary py-3 px-8 text-xs font-bold shadow-xl shadow-black/10">
                     닫기
                  </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
