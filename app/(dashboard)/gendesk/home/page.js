"use client";

import { TrendingUp, Users, Clock, MousePointerClick, BarChart3, PieChart } from "lucide-react";

export default function StatisticsPage() {
  const stats = [
    { label: "누적 세션 발생 수", value: "1,204", change: "+12.5%", positive: true, icon: Users },
    { label: "평균 세션 소요시간", value: "8분 42초", change: "-1분 12초", positive: true, icon: Clock },
    { label: "링크 접속 성공률", value: "94.2%", change: "+2.4%", positive: true, icon: MousePointerClick },
    { label: "소모된 크레딧", value: "84,200", change: "+15.2%", positive: false, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900">홈</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card-premium group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-2 bg-neutral-50 rounded-lg group-hover:bg-black group-hover:text-white transition-all">
                   <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${stat.positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                  {stat.change}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-neutral-400 uppercase tracking-tighter mb-1">{stat.label}</span>
                <span className="text-3xl font-black italic tracking-tighter text-neutral-900">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="bg-white p-10 rounded-xl border border-neutral-200 shadow-sm flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="label-premium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Session Trends
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">Last 30 Days</span>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
                 <BarChart3 className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Data Visualization Preparing...</p>
           </div>
        </div>
        
        <div className="bg-white p-10 rounded-xl border border-neutral-200 shadow-sm flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Resolution Funnel
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">Total Performance</span>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
                 <PieChart className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Funnel Analysis Preparing...</p>
           </div>
        </div>
      </div>
    </div>
  );
}
