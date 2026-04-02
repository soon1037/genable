"use client";

import { useEffect, useState } from "react";
import { 
  Layout, 
  FileText, 
  PlusCircle, 
  ArrowRight,
  Sparkles,
  Layers,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { getDesignProjects, getDesignTemplates, createDesignProject } from "@/lib/db";
import { useRouter } from "next/navigation";

export default function DesignHome() {
  const [stats, setStats] = useState({ projects: 0, templates: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadStats() {
      try {
        const [projects, templates] = await Promise.all([
          getDesignProjects(),
          getDesignTemplates()
        ]);
        setStats({
          projects: projects?.length || 0,
          templates: templates?.length || 0
        });
      } catch (err) {
        console.error("Failed to load design stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleCreateNew = async () => {
    try {
      const newProject = await createDesignProject({
        name: "제목 없는 프로젝트",
        data: {
          pages: [
            {
              id: "page-1",
              canvas: { width: 1080, height: 1080, backgroundColor: "#ffffff" },
              elements: [
                {
                  id: "el-1",
                  type: "text",
                  content: "새로운 디자인을 시작하세요",
                  style: {
                    top: 480,
                    left: 240,
                    fontSize: 48,
                    fontWeight: "800",
                    color: "#000000",
                    textAlign: "center",
                    width: 600,
                    height: 80,
                    zIndex: 1
                  }
                }
              ]
            }
          ]
        }
      });
      router.push(`/design/projects/${newProject.id}`);
    } catch (err) {
      alert("프로젝트 생성에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-black p-12 text-white">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <div className="label-premium !text-white/80 !mb-0 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 !inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Genable Design AI
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
            아이디어를 디자인으로,<br />
            <span className="text-neutral-400">가장 쉽고 빠르게.</span>
          </h1>
          <p className="text-lg text-neutral-400 font-medium max-w-lg leading-relaxed">
            카드뉴스 제작부터 AI 디자인 가이드까지, 제너블 디자인과 함께 브랜드의 가치를 시각화하세요.
          </p>
          <button 
            onClick={handleCreateNew}
            className="btn-primary !bg-white !text-black !px-8 !py-4 !text-lg !rounded-2xl mt-4 group"
          >
            새 프로젝트 만들기
            <PlusCircle className="w-5 h-5 ml-3 transition-transform group-hover:rotate-90 duration-300" />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] bg-gradient-to-br from-neutral-800/50 to-transparent blur-3xl rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[80%] bg-neutral-900/40 blur-3xl rounded-full" />
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium flex flex-col gap-4 group !p-8">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="label-premium !text-neutral-400 !mb-1">내 카드뉴스</p>
            <h3 className="text-3xl font-black text-black">{loading ? "-" : stats.projects} <span className="text-base font-bold text-neutral-400">개</span></h3>
          </div>
          <Link href="/design/projects" className="mt-2 inline-flex items-center gap-2 text-[13px] font-bold text-neutral-900 hover:gap-3 transition-all">
            모두 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="card-premium flex flex-col gap-4 group !p-8">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-black">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="label-premium !text-neutral-400 !mb-1">저장된 템플릿</p>
            <h3 className="text-3xl font-black text-black">{loading ? "-" : stats.templates} <span className="text-base font-bold text-neutral-400">개</span></h3>
          </div>
          <Link href="/design/templates" className="mt-2 inline-flex items-center gap-2 text-[13px] font-bold text-neutral-900 hover:gap-3 transition-all">
            모두 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="card-premium flex flex-col gap-4 group !p-8 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="label-premium !text-neutral-400 !mb-1">AI 크레딧</p>
            <h3 className="text-3xl font-black text-black">무제한</h3>
          </div>
          <p className="text-[12px] font-bold text-neutral-400">베타 기간 동안 자유롭게 이용하세요</p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight px-1 text-black">빠른 시작</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={handleCreateNew}
            className="card-flat aspect-[16/9] flex items-center justify-center cursor-pointer group !p-0"
          >
            <div className="flex flex-col items-center gap-4 group-hover:scale-110 transition-transform duration-500">
               <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-xl">
                  <PlusCircle className="w-10 h-10" />
               </div>
               <span className="text-lg font-black text-black">새 빈 프로젝트</span>
            </div>
          </div>
          
          <Link 
            href="/design/templates"
            className="card-premium aspect-[16/9] flex items-center justify-center group !p-0 !bg-neutral-900 !border-transparent overflow-hidden"
          >
            <div className="flex flex-col items-center gap-4 group-hover:scale-110 transition-transform duration-500 text-white relative z-10">
               <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                  <Layout className="w-10 h-10" />
               </div>
               <span className="text-lg font-black">템플릿에서 시작</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </Link>
        </div>
      </section>
    </div>
  );
}
