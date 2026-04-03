"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  PlusCircle, MoreHorizontal, PlayCircle, Settings, Loader2,
  HelpCircle, Rocket, GraduationCap, Users, TestTube,
  CheckCircle2, ArrowRight, X, BarChart3, Activity
} from "lucide-react";
import { getProjects, getProjectSessionCounts } from "@/lib/db";
import { useRouter } from "next/navigation";

const PROJECT_TYPES = [
  { 
    id: 'support', 
    name: '고객지원', 
    icon: HelpCircle, 
    description: 'FAQ 응대 및 고객의 문제 해결을 위한 상담 가이드 AI' 
  },
  { 
    id: 'onboarding', 
    name: '온보딩', 
    icon: Rocket, 
    description: '신규 사용자 가이드 및 주요 기능 사용법 안내' 
  },
  { 
    id: 'education', 
    name: '교육', 
    icon: GraduationCap, 
    description: '학습 내용 전달 및 이해도 체크를 위한 교육 조교' 
  },
  { 
    id: 'interview', 
    name: '면접', 
    icon: Users, 
    description: '지원자의 역량 평가 및 심층 질문 수행' 
  },
  { 
    id: 'test', 
    name: '테스트', 
    icon: TestTube, 
    description: '정해진 시나리오에 따른 성능/스킬 검증' 
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [sessionCounts, setSessionCounts] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("support");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const [projData, counts] = await Promise.all([
        getProjects(),
        getProjectSessionCounts()
      ]);
      setProjects(projData || []);
      setSessionCounts(counts || {});
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleProceed = () => {
    if (!newName) return;
    router.push(`/gendesk/project/new?name=${encodeURIComponent(newName)}&type=${newType}`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Entrance Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">새 프로젝트 생성</h2>
                  <p className="text-xs text-neutral-400 font-medium mt-1">간단한 정보 입력 후 상세 설정을 시작합니다.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-300 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                    <label className="label-premium">Project Name</label>
                    <input 
                      type="text" 
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="제목을 입력하세요"
                      className="input-standard"
                    />
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Service Objective</label>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {PROJECT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNewType(type.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                          newType === type.id 
                          ? "border-black bg-neutral-900 text-white shadow-md" 
                          : "border-neutral-100 bg-neutral-50/50 hover:border-neutral-200"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          newType === type.id ? "bg-white/10 text-white" : "bg-white border border-neutral-100 text-neutral-400"
                        }`}>
                          <type.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-xs font-bold ${newType === type.id ? "text-white" : "text-neutral-900"}`}>{type.name}</h3>
                          <p className={`text-[10px] mt-0.5 font-medium line-clamp-1 ${newType === type.id ? "text-white/50" : "text-neutral-400"}`}>{type.description}</p>
                        </div>
                        {newType === type.id && (
                          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleProceed}
                  disabled={!newName}
                  className="w-full bg-black text-white py-4 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  상세 설정 시작 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900">프로젝트</h3>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5"
        >
          <PlusCircle className="w-4 h-4" />
          새 프로젝트 생성
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-20 text-center shadow-sm">
           <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-neutral-100 text-neutral-300">
              <Rocket className="w-8 h-8" />
           </div>
           <p className="text-neutral-900 font-bold text-lg">생성된 프로젝트가 없습니다.</p>
           <p className="text-neutral-400 text-xs font-medium mt-1 uppercase tracking-wider">No projects found</p>
           <button 
             onClick={() => setShowModal(true)}
             className="bg-black text-white px-6 py-3 rounded-xl text-xs font-bold mt-8 shadow-xl shadow-black/10 hover:shadow-black/20 transition-all active:scale-95"
           >
             첫 번째 프로젝트를 만들어보세요
           </button>
        </div>
      ) : (
        <div className="table-container-premium">
           <table className="table-premium">
            <thead>
              <tr>
                 <th>프로젝트 제목</th>
                 <th>참여 세션</th>
                 <th>생성 일시</th>
                 <th className="md:text-right">관리 액션</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr key={proj.id} className="group">
                  <td>
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100 shrink-0">
                        {PROJECT_TYPES.find(t => t.id === proj.type)?.name || '기타'}
                      </span>
                      <span className="font-bold text-neutral-900 text-[13px] shrink-0 min-w-[120px]">{proj.name}</span>
                    </div>
                  </td>
                  <td className="text-[11px] font-bold text-neutral-800">
                    {sessionCounts[proj.id] || 0}<span className="text-neutral-400 font-medium ml-1">회</span>
                  </td>
                  <td className="text-[11px] font-bold text-neutral-400">
                    {new Date(proj.created_at).toLocaleDateString('ko-KR')}
                  </td>
                   <td className="md:text-right">
                    <div className="flex items-center md:justify-end gap-6 opacity-100 transition-opacity">
                      <Link href={`/gendesk/project/history/${proj.id}`} className="text-neutral-300 hover:text-black transition-colors font-bold text-[11px] uppercase tracking-widest flex items-center gap-2" title="View History">
                        <Activity className="w-4 h-4" />
                        히스토리
                      </Link>
                      <Link href={`/gendesk/project/${proj.id}/settings`} className="text-neutral-300 hover:text-black transition-colors font-bold text-[11px] uppercase tracking-widest flex items-center gap-2" title="Settings">
                        <Settings className="w-4 h-4" />
                        설정
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
