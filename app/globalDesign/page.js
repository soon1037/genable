"use client";

import { useState } from "react";
import { 
  Plus, Trash2, CheckCircle2, 
  ChevronDown, Volume2, Settings, 
  Search, Bell, User, MessageSquare,
  Home, Activity, Rocket, Target, Menu
} from "lucide-react";

export default function GlobalDesignPage() {
  const [toggle, setToggle] = useState(false);
  const [activeTab, setActiveTab] = useState("buttons");

  return (
    <div className="min-h-screen bg-white p-12 text-neutral-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* 헤더 */}
        <div className="border-b border-neutral-100 pb-12 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter">글로벌 디자인 시스템</h1>
            <p className="text-neutral-400 font-bold">제네이블 프리미엄 UI 컴포넌트 라이브러리 (v1.0)</p>
          </div>
          <div className="flex gap-4">
             <button className="btn-secondary">토큰 내보내기</button>
             <button className="btn-primary">자산 다운로드</button>
          </div>
        </div>

        {/* 1. 타이포그래피 및 팔레트 */}
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
           <label className="label-premium">1. 타이포그래피 및 팔레트 (Typography & Palette)</label>
           <div className="grid grid-cols-12 gap-12 items-start mt-8">
              <div className="col-span-8 space-y-10">
                 <div className="space-y-6">
                    <h1 className="text-6xl font-black tracking-tighter">헤딩 디스플레이 XL</h1>
                    <h2 className="text-4xl font-bold tracking-tight">보조 헤딩 L</h2>
                    <h3 className="text-2xl font-bold tracking-tight">컴포넌트 제목 M</h3>
                    <p className="text-base text-neutral-600 leading-relaxed max-w-2xl font-medium">
                       이것은 표준 본문 텍스트입니다. 긴 설명과 상호 작용 가이드에서 최대의 가독성을 위해 설계되었습니다.
                       간결하고 고급스러운 미학을 위해 간격과 무게가 최적화되었습니다. 모든 텍스트는 브랜드의 톤앤매너를 유지합니다.
                    </p>
                    <label className="label-premium">마이크로 레이블 (소문자 강조)</label>
                 </div>
              </div>
              <div className="col-span-4 flex flex-wrap gap-4">
                 {[
                   { bg: 'bg-black', label: '프라이머리 블랙' },
                   { bg: 'bg-neutral-600', label: '중간 회색 600' },
                   { bg: 'bg-neutral-400', label: '밝은 회색 400' },
                   { bg: 'bg-neutral-200', label: '연한 회색 200' },
                   { bg: 'bg-neutral-100', label: '배경 회색 100' },
                   { bg: 'bg-neutral-50', label: '최소 회색 50' },
                 ].map(color => (
                   <div key={color.label} className="w-24 space-y-2">
                      <div className={`w-24 h-24 rounded-2xl ${color.bg} shadow-sm border border-neutral-100/50`} />
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest text-center">{color.label}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* 2. 액션 컴포넌트 */}
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
           <label className="label-premium">2. 액션 컴포넌트 (버튼 및 토글)</label>
           <div className="grid grid-cols-12 gap-12 mt-8">
              <div className="col-span-12 card-premium">
                 <div className="grid grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">프라이머리 버튼</label>
                        <div className="space-y-2">
                           <button className="btn-primary w-full">기본 액션</button>
                           <button className="btn-primary w-full opacity-50" disabled>비활성 상태</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">보조 및 외곽선 버튼</label>
                        <div className="space-y-2">
                           <button className="btn-secondary w-full">보조 버튼</button>
                           <button className="btn-danger w-full">위험 액션</button>
                        </div>
                    </div>
                    <div className="space-y-4 text-center">
                        <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">인터랙티브 토글</label>
                        <div className="flex flex-col items-center gap-4 pt-2">
                           <button 
                             onClick={() => setToggle(!toggle)}
                             className={`toggle-switch ${toggle ? 'toggle-switch-on' : ''}`}
                           >
                             <div className={`toggle-knob ${toggle ? 'toggle-knob-on' : ''}`} />
                           </button>
                           <span className="text-[10px] font-black uppercase tracking-widest">{toggle ? '활성화 상태' : '비활성화'}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">아이콘 버튼군</label>
                        <div className="flex flex-wrap gap-2">
                           {[Search, Bell, User, MessageSquare].map((Icon, idx) => (
                             <button key={idx} className="w-10 h-10 rounded-xl bg-neutral-50 hover:bg-black hover:text-white transition-all flex items-center justify-center border border-neutral-100">
                                <Icon className="w-4 h-4" />
                             </button>
                           ))}
                        </div>
                    </div>
                 </div>

                 {/* Segment Picker Example */}
                 <div className="mt-12 pt-12 border-t border-neutral-50 grid grid-cols-2 gap-12">
                    <div className="space-y-4">
                       <label className="label-premium">세그먼트 픽커 (진입 링크 타입류)</label>
                       <div className="flex p-0.5 bg-neutral-50 rounded-lg border border-neutral-100 w-44">
                          <button className="flex-1 py-1.5 text-[10px] font-bold rounded-md bg-white text-black shadow-sm">1회용</button>
                          <button className="flex-1 py-1.5 text-[10px] font-bold rounded-md text-neutral-400 hover:text-neutral-600 transition-all">상시 운영</button>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-xs font-bold text-neutral-400 leading-relaxed pt-6">진입 차단 기능이나 단순 택일이 필요한 업무에서 활용되는 정밀 세그먼트 컨트롤입니다.</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* 3. 내비게이션 및 상태 */}
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
           <label className="label-premium">3. 사이드 내비게이션 및 메뉴</label>
           <div className="grid grid-cols-12 gap-12 mt-8">
              <div className="col-span-3 card-premium !p-4 h-fit">
                 <div className="space-y-1">
                    <button className="nav-item nav-item-active w-full">
                       <Home className="w-4 h-4" />
                       대시보드 홈
                    </button>
                    <button className="nav-item nav-item-inactive w-full">
                       <Activity className="w-4 h-4" />
                       실시간 로그 분석
                    </button>
                    <button className="nav-item nav-item-inactive w-full">
                       <Rocket className="w-4 h-4" />
                       미션 스튜디오
                    </button>
                    <button className="nav-item nav-item-inactive w-full">
                       <Target className="w-4 h-4" />
                       워크플로우 설계
                    </button>
                 </div>
              </div>
              <div className="col-span-9 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="card-premium h-40 flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <label className="label-premium">고급형 프리미엄 카드</label>
                          <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                             <Plus className="w-4 h-4" />
                          </div>
                       </div>
                       <p className="text-xs font-bold text-neutral-400">깊은 그림자와 32px 곡률이 적용된 고사양 카드 디자인입니다.</p>
                    </div>
                    <div className="card-flat h-40 flex flex-col justify-between">
                       <label className="label-premium">표준 플랫 카드</label>
                       <p className="text-xs font-bold text-neutral-400">보조 컨테이너 및 배경 요소로 활용되는 플랫 스타일입니다.</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* 4. 데이터 테이블 */}
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
           <label className="label-premium">4. 데이터 관리 (프리미엄 테이블)</label>
           <div className="table-container-premium">
              <table className="table-premium">
                 <thead>
                    <tr>
                       <th>프로젝트명</th>
                       <th>유형</th>
                       <th>상태</th>
                       <th>생성일</th>
                       <th>관리액션</th>
                    </tr>
                 </thead>
                 <tbody>
                    {[
                      { name: '고객 지원 상담 봇', type: '지원', status: '운영중', date: '2026.04.01' },
                      { name: '사내 온보딩 가이드', type: '온보딩', status: '초안', date: '2026.03.22' },
                      { name: '신제품 시장 반응 테스트', type: '테스트', status: '유지보수', date: '2026.02.15' },
                    ].map((row, i) => (
                      <tr key={i}>
                         <td className="font-bold">{row.name}</td>
                         <td className="text-neutral-400">{row.type}</td>
                         <td>
                            <div className="flex items-center gap-2">
                               <div className={`w-1.5 h-1.5 rounded-full ${row.status === '운영중' ? 'bg-emerald-500' : row.status === '초안' ? 'bg-neutral-300' : 'bg-orange-400'}`} />
                               <span className="text-[11px] font-bold">{row.status}</span>
                            </div>
                         </td>
                         <td className="text-neutral-400">{row.date}</td>
                         <td>
                            <button className="text-neutral-300 hover:text-black transition-colors font-bold text-[10px] uppercase tracking-widest">관리하기</button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

        {/* 5. 입력 필드 및 폼 */}
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-400">
           <label className="label-premium">5. 시맨틱 입력 필드</label>
           <div className="grid grid-cols-12 gap-12 mt-8">
              <div className="col-span-6 space-y-8">
                 <div className="space-y-2">
                    <label className="label-premium">프로젝트 식별자</label>
                    <input className="input-standard" placeholder="운영용 프로젝트명을 입력하세요..." />
                 </div>
                 <div className="space-y-2">
                    <label className="label-premium">시스템 상세 설정 가이드</label>
                    <textarea className="input-standard min-h-[140px] resize-none" placeholder="시스템 레벨의 가이드라인을 입력하세요..." />
                 </div>
              </div>
              <div className="col-span-6 space-y-8">
                 <div className="card-premium">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h4 className="text-sm font-bold">자동 응답 엔진 스케일링</h4>
                          <p className="text-[11px] font-bold text-neutral-300">AI가 연산 자원을 동적으로 확장하도록 허용합니다.</p>
                       </div>
                       <button 
                          onClick={() => setToggle(!toggle)}
                          className={`toggle-switch ${toggle ? 'toggle-switch-on' : ''}`}
                        >
                          <div className={`toggle-knob ${toggle ? 'toggle-knob-on' : ''}`} />
                        </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="label-premium">드롭다운 셀렉터 (활성 상태 예시)</label>
                    <div className="relative">
                       <div className="w-full input-standard flex items-center justify-between border-black ring-4 ring-neutral-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                             <Volume2 className="w-4 h-4 text-black" />
                             <span className="text-black font-bold text-sm">AI 성우: Puck (차분한 남성)</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-black" />
                       </div>
                       
                       {/* Dropdown Menu Mockup */}
                       <div className="absolute top-full mt-2 left-0 right-0 z-10 bg-white border border-neutral-100 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-4 bg-black text-white rounded-xl flex items-center justify-between mb-1">
                             <div className="flex items-center gap-3">
                                <Volume2 className="w-4 h-4" />
                                <span className="text-xs font-bold font-sans">Puck (한국어/남성)</span>
                             </div>
                             <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          {[
                            { name: 'Aria', meta: '한국어/여성' },
                            { name: 'Roger', meta: '한국어/남성' }
                          ].map(v => (
                            <div key={v.name} className="p-4 hover:bg-neutral-50 rounded-xl flex items-center justify-between group transition-all cursor-pointer">
                               <div className="flex items-center gap-3">
                                  <Volume2 className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
                                  <span className="text-xs font-bold font-sans text-neutral-400 group-hover:text-black transition-colors">{v.name} ({v.meta})</span>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
              </div>
           </div>
        </section>

      </div>
      <div className="mt-40 text-center pb-20">
         <p className="text-[10px] font-black text-neutral-200 uppercase tracking-[0.5em]">시스템 디자인 무결성 © 2026 GENABLE INC</p>
      </div>
    </div>
  );
}
