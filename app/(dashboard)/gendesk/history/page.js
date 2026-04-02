"use client";

import { useEffect, useState } from "react";
import { Link2, Copy, History, Link as LinkIcon, Plus, Loader2 } from "lucide-react";
import { getProjects, getSessions, createSession } from "@/lib/db";

export default function HistoryPage() {
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [guestId, setGuestId] = useState("GUEST_" + Math.floor(Math.random() * 9000 + 1000));
  const [generatedLink, setGeneratedLink] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [projectsData, sessionsData] = await Promise.all([
        getProjects(),
        getSessions()
      ]);
      setProjects(projectsData || []);
      setSessions(sessionsData || []);
      if (projectsData?.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerate = async () => {
    if (!selectedProjectId) return;
    setGenerating(true);
    try {
      const session = await createSession(selectedProjectId, guestId);
      const url = `${window.location.origin}/session/${selectedProjectId}?id=${guestId}`;
      setGeneratedLink(url);
      fetchData(); // Refresh list
    } catch (err) {
      alert("링크 생성에 실패했습니다: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("딥링크가 성공적으로 복사되었습니다!");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900">히스토리</h3>
        </div>
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          신규 딥링크 발급
        </button>
      </div>

      {showGenerateModal && (
        <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-xl mb-12 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-8 border-b border-neutral-100 pb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-900">세션 링크 생성 엔진</h2>
            <button onClick={() => setShowGenerateModal(false)} className="text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:text-black transition-colors">Close</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2">대상 시나리오 (프로젝트)</label>
                <select 
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-100 text-neutral-900 text-sm font-bold rounded-xl focus:bg-white focus:ring-1 focus:ring-black outline-none block p-4"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-neutral-400 uppercase tracking-widest mb-2">고객 식별 메타데이터</label>
                <input 
                  type="text"
                  value={guestId}
                  onChange={(e) => setGuestId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-100 text-neutral-900 text-sm font-bold rounded-xl focus:bg-white focus:ring-1 focus:ring-black outline-none block p-4"
                  placeholder="GUEST_1234"
                />
              </div>
              
              <button 
                onClick={handleGenerate}
                disabled={generating || projects.length === 0}
                className="w-full bg-black hover:bg-neutral-800 text-white font-black uppercase tracking-widest rounded-xl text-xs px-5 py-5 shadow-xl active:scale-95 transition-all disabled:opacity-30"
              >
                {generating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Deploy Tracking Link"}
              </button>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-100 flex flex-col justify-center gap-6">
              {generatedLink ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-widest">Active Link</span>
                     <Link2 className="w-4 h-4 text-neutral-200" />
                  </div>
                  <div className="flex bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedLink} 
                      className="w-full px-5 py-4 text-xs text-neutral-400 bg-transparent outline-none font-bold"
                    />
                    <button onClick={copyToClipboard} className="bg-neutral-50 px-5 border-l border-neutral-200 hover:bg-black hover:text-white text-neutral-400 transition-all">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-bold opacity-60 leading-relaxed uppercase tracking-tighter">복사된 링크를 고객에게 전달하여 실시간 미러링 상담을 시작하세요.</p>
                </div>
              ) : (
                <div className="text-center text-neutral-300 flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                     <LinkIcon className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] leading-relaxed">Select parameters to<br/>generate dynamic url</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="table-container-premium overflow-hidden">
        <table className="table-premium">
          <thead>
            <tr>
              <th className="md:w-32">Session ID</th>
              <th>Project Context</th>
              <th>Client ID</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th className="md:text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-20 text-center font-bold text-neutral-300 text-xs uppercase tracking-widest">No active sessions found</td>
              </tr>
            ) : (
              sessions.map((log) => (
                <tr key={log.id} className="group">
                <td className="font-mono text-[10px] text-neutral-400">{log.id.slice(0, 8)}</td>
                  <td>
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400 group-hover:bg-black group-hover:text-white transition-all">
                           {log.projects?.name?.[0]}
                        </div>
                        <span className="font-bold text-neutral-900">{log.projects?.name}</span>
                     </div>
                  </td>
                  <td>
                     <span className="bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight">{log.guest_id}</span>
                  </td>
                  <td className="text-neutral-400 text-[12px] font-medium">
                     {new Date(log.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      log.status === "active" ? "bg-green-50 text-green-600" : "bg-neutral-100 text-neutral-400"
                    }`}>
                      {log.status === "active" && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
                      {log.status === "active" ? "LIVE" : log.status}
                    </span>
                  </td>
                  <td className="md:text-right">
                    <div className="flex items-center md:justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/session/${log.project_id}?id=${log.guest_id}`;
                          navigator.clipboard.writeText(url);
                          alert("세션 링크가 복사되었습니다.");
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
    </div>
  );
}
