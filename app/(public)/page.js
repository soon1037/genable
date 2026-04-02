import Link from "next/link";
import { MonitorUp, Zap, Users, ArrowRight, ShieldCheck, Globe, Cpu, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white selection:bg-neutral-100 overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-60 pb-32 px-8 overflow-hidden min-h-screen flex items-center">
        {/* Background Visual Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.03] pointer-events-none select-none rotate-12">
           <Globe className="w-full h-full text-black" strokeWidth={0.5} />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 relative z-10 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
               <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
               시스템 가동 중: 오픈 베타
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-neutral-900 leading-[0.95] flex flex-col gap-2 italic">
              <span>중력 없는</span>
              <span className="text-neutral-300">고객 경험.</span>
            </h1>
            
            <p className="max-w-[36rem] text-lg font-bold text-neutral-400 leading-relaxed tracking-tight">
              프로그램 설치 없이 딥링크 하나로 사용자의 화면을 실시간 미러링하고, 
              AI 어시스턴트가 실시간 상황 분석을 통해 가장 정확한 가이드를 음성으로 안내합니다.
            </p>
            
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Link
                href="/signup"
                className="group flex px-10 py-5 bg-black text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95 items-center gap-3 overflow-hidden"
              >
                무료 체험 시작하기 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex px-10 py-5 bg-white border border-neutral-200 text-neutral-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-neutral-50 transition-all items-center gap-2"
              >
                대시보드 관리
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-8">
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-neutral-900 leading-none">99.9%</span>
                  <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mt-1">연결성</span>
               </div>
               <div className="h-8 w-px bg-neutral-100"></div>
               <div className="flex flex-col">
                  <span className="text-2xl font-black text-neutral-900 leading-none">&lt; 100ms</span>
                  <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mt-1">지연율</span>
               </div>
            </div>
          </div>

          <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
             <div className="relative z-10 w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-100 group">
                <img 
                  src="/Users/soon/.gemini/antigravity/brain/1cccde80-a01f-4f38-bc2e-972f86afc12a/genable_hero_visual_1775034930832.png" 
                  alt="Futuristic Mirroring Session"
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity"></div>
                <div className="absolute bottom-8 left-8 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white max-w-xs group-hover:translate-y-2 transition-transform">
                   <div className="flex items-center gap-2 mb-3">
                      <Cpu className="w-4 h-4 text-neutral-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-200">AI 가이드 활성화</span>
                   </div>
                   <p className="text-xs font-bold leading-relaxed opacity-70">
                     AI가 실시간으로 사용자 화면의 시각적 요소를 분석하고 최적의 가이드를 생성합니다.
                   </p>
                </div>
             </div>
             {/* Decorative Elements */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-neutral-100 rounded-full blur-[80px] -z-10"></div>
             <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-neutral-50 rounded-full blur-[100px] -z-10"></div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-32 px-8 bg-neutral-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full space-y-16">
          <div className="max-w-2xl">
             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-4 block">핵심 기술 인프라</span>
             <h2 className="text-4xl md:text-6xl font-black text-white italic leading-tight tracking-tighter">
                똑똑하고 빠른, <br/>차세대 지원 인프라
             </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] transition-all group">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 text-white group-hover:scale-110 transition-transform">
                 <MonitorUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">실시간 보이스 가이드</h3>
              <p className="text-white/40 text-sm font-bold leading-relaxed">설치 없이 딥링크로 즉시 화면을 공유하고 실시간 대화하듯 안내를 제공합니다.</p>
              <div className="mt-10 flex items-center gap-2 text-white/20 group-hover:text-white/60 transition-colors">
                 <span className="text-[10px] font-black uppercase tracking-widest">Learn More</span>
                 <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] transition-all group">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 text-yellow-400 group-hover:scale-110 transition-transform">
                 <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">AI 비전 어시스턴트</h3>
              <p className="text-white/40 text-sm font-bold leading-relaxed">최신 Gemini 1.5 비전 모델이 화면을 분석하여 상담원의 한계를 넘는 가이드를 제시합니다.</p>
              <div className="mt-10 flex items-center gap-2 text-white/20 group-hover:text-white/60 transition-colors">
                 <span className="text-[10px] font-black uppercase tracking-widest">Learn More</span>
                 <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/[0.08] transition-all group">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 text-neutral-300 group-hover:scale-110 transition-transform">
                 <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">전방위 통합 관리</h3>
              <p className="text-white/40 text-sm font-bold leading-relaxed">기업 운영에 필요한 모든 프로젝트와 상담원 권한을 직관적인 대시보드에서 관리하세요.</p>
              <div className="mt-10 flex items-center gap-2 text-white/20 group-hover:text-white/60 transition-colors">
                 <span className="text-[10px] font-black uppercase tracking-widest">더 알아보기</span>
                 <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-16 px-8 border-t border-neutral-100 flex flex-col items-center gap-8">
        <Link href="/" className="text-xl font-black italic tracking-tighter text-black flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
           GENABLE
        </Link>
        <p className="text-neutral-300 text-[10px] font-bold uppercase tracking-widest">© 2026 GENABLE INC. 모든 권리 보유.</p>
      </footer>
    </div>
  );
}
