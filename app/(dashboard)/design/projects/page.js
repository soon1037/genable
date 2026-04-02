"use client";

import { useEffect, useState } from "react";
import { 
  PlusCircle, 
  Trash2, 
  Loader2,
  Layers as LayersIcon,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { getDesignProjects, createDesignProject, deleteDesignProject } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function DesignProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await getDesignProjects();
      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateNew = async () => {
    try {
      const newProject = await createDesignProject({
        name: "제목 없는 카드뉴스",
        data: { pages: [] }
      });
      router.push(`/design/projects/${newProject.id}`);
    } catch (err) {
      alert("프로젝트 생성에 실패했습니다.");
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 프로젝트를 삭제하시겠습니까?")) return;
    try {
      await deleteDesignProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      alert("삭제 실패");
    }
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
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-100">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900">카드뉴스</h3>
        </div>
        <button 
          onClick={handleCreateNew}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-xl shadow-black/10"
        >
          <PlusCircle className="w-4 h-4" />
          새 프로젝트 생성
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-24 text-center shadow-sm">
           <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-neutral-100 text-neutral-200">
              <LayersIcon className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-black tracking-tight">아직 프로젝트가 없습니다.</h3>
           <p className="text-neutral-400 text-sm font-medium mt-2">나노바나나2와 함께 첫 번째 카드뉴스를 만들어 보세요.</p>
           <button 
             onClick={handleCreateNew}
             className="bg-black text-white px-8 py-3.5 rounded-xl font-bold text-sm mt-10 shadow-xl shadow-black/10 hover:shadow-black/20 transition-all active:scale-95"
           >
             새 프로젝트 시작하기
           </button>
        </div>
      ) : (
        <div className="table-container-premium overflow-x-auto custom-scrollbar">
          <table className="table-premium min-w-[800px]">
            <thead>
              <tr className="!bg-neutral-50/50">
                 <th className="!py-5 !px-8">프로젝트명</th>
                 <th className="!px-8 w-40">페이지</th>
                 <th className="!px-8">상태</th>
                 <th className="!px-8">생성일</th>
                 <th className="w-px whitespace-nowrap !px-8">관리</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => {
                const hasImages = proj.data?.pages?.some(p => p.imageUrl);
                return (
                  <tr key={proj.id} className="group hover:bg-neutral-50/10 transition-colors">
                    <td className="!py-6 !px-8">
                      <Link href={`/design/projects/${proj.id}`} className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-lg bg-neutral-50 border border-neutral-100 overflow-hidden shrink-0 shadow-sm transition-all group-hover:border-black/20">
                            {proj.thumbnail_url ? (
                              <img src={proj.thumbnail_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-200">
                                 <LayersIcon className="w-6 h-6 opacity-30" />
                              </div>
                            )}
                         </div>
                         <span className="font-bold text-neutral-900 group-hover:text-black transition-colors leading-none">
                            {proj.name || "제목 없는 카드뉴스"}
                         </span>
                      </Link>
                    </td>
                    <td className="w-40 !px-8">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                         <LayersIcon className="w-3.5 h-3.5 opacity-40" />
                         {proj.data?.pages?.length || 0}
                      </div>
                    </td>
                    <td className="w-px whitespace-nowrap !px-8">
                       <div className="flex items-center gap-2 text-left">
                          <div className={`w-1.5 h-1.5 rounded-full ${hasImages ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                          <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">{hasImages ? '생성완료' : '초안'}</span>
                       </div>
                    </td>
                    <td className="w-px whitespace-nowrap !px-8">
                      <span className="text-[12px] font-bold text-neutral-400 block">
                         {new Date(proj.created_at).toLocaleDateString('ko-KR').replace(/ /g, '')}
                      </span>
                    </td>
                    <td className="w-px whitespace-nowrap !px-8">
                      <div className="flex items-center gap-6 transition-all">
                        <Link href={`/design/projects/${proj.id}`} className="text-neutral-300 hover:text-black transition-colors font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">
                           수정하기
                        </Link>
                        <button 
                          onClick={(e) => handleDelete(proj.id, e)}
                          className="text-neutral-200 hover:text-red-500 transition-colors font-bold text-[10px] uppercase tracking-widest whitespace-nowrap"
                        >
                           삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
