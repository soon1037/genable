"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  FileText,
  Star,
  Copy,
  ChevronRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { getDesignTemplates, createDesignProject, deleteDesignTemplate } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function DesignTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await getDesignTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUseTemplate = async (template, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const newProject = await createDesignProject({
        name: `\${template.name}에서 복제됨`,
        data: template.data,
        thumbnail_url: template.thumbnail_url
      });
      router.push(`/design/projects/${newProject.id}`);
    } catch (err) {
      alert("프로젝트 생성 실패");
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await deleteDesignTemplate(id);
      setTemplates(templates.filter(p => p.id !== id));
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const filteredTemplates = templates.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative p-12 rounded-[3rem] bg-neutral-900 overflow-hidden text-white">
        <div className="relative z-10 flex flex-col items-start gap-4">
          <div className="label-premium !text-white/80 !mb-0 px-4 py-1 rounded-full bg-white/10 border border-white/10 !inline-flex">
            Design Templates
          </div>
          <h1 className="text-4xl font-black tracking-tight">전문적인 템플릿으로 시작하세요</h1>
          <p className="text-lg text-neutral-400 font-medium max-w-lg mb-4">
            이미 잘 만들어진 템플릿을 활용해 브랜드의 메시지를 더 효과적으로 전달하세요.
          </p>
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative flex-1 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
               <input 
                 type="text" 
                 placeholder="템플릿 제목 검색..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="input-standard !bg-white/5 !border-white/10 !text-white !py-3.5 !pl-12 !pr-6 !text-[14px] focus:!bg-white/10 focus:!border-white/30"
               />
            </div>
          </div>
        </div>
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-neutral-800 to-transparent opacity-50" />
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-neutral-800 blur-3xl opacity-50" />
      </div>

      {/* Grid */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
           <h2 className="text-2xl font-black text-black">모든 템플릿 <span className="text-neutral-300 font-bold ml-2">{filteredTemplates.length}</span></h2>
           <div className="flex items-center gap-4 text-[13px] font-bold text-neutral-400">
              <button className="text-black">전체</button>
              <button className="hover:text-black">비즈니스</button>
              <button className="hover:text-black">교육</button>
              <button className="hover:text-black">홍보</button>
           </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] rounded-[2.5rem] bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-24 text-center bg-neutral-50 rounded-[3rem] border border-dashed border-neutral-200">
             <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-sm">
                <FileText className="w-10 h-10 text-neutral-200" />
             </div>
             <h3 className="text-xl font-black text-black">아직 저장된 템플릿이 없습니다</h3>
             <p className="text-neutral-400 font-bold mt-2">제작한 디자인을 템플릿으로 저장하여 재사용할 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id} 
                className="group card-premium !p-6 flex flex-col gap-5"
              >
                <div className="aspect-[3/4] rounded-[2rem] bg-neutral-50 overflow-hidden relative border border-neutral-100/50">
                  {template.thumbnail_url ? (
                    <img src={template.thumbnail_url} className="w-full h-full object-cover" alt={template.name} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                       <FileText className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                     <button 
                       onClick={(e) => handleUseTemplate(template, e)}
                       className="btn-primary !bg-white !text-black !px-8 !py-3 !rounded-2xl !text-[13px] group"
                     >
                        이 템플릿으로 시작 <ChevronRight className="w-4 h-4 ml-1" />
                     </button>
                     <button 
                       onClick={(e) => handleDelete(template.id, e)}
                       className="label-premium !text-white/60 hover:!text-red-400 !mb-0"
                     >
                        삭제하기
                     </button>
                  </div>
                  <div className="absolute top-4 left-4">
                     <div className="bg-black/20 backdrop-blur-md border border-white/10 text-white rounded-full p-2">
                        <Sparkles className="w-3.5 h-3.5" />
                     </div>
                  </div>
                </div>

                <div className="px-2 flex items-center justify-between">
                   <div>
                      <h3 className="text-[16px] font-black text-neutral-900">{template.name}</h3>
                      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Design System v1.0</p>
                   </div>
                   <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-[12px] font-black text-neutral-900 text-neutral-400">4.9</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
