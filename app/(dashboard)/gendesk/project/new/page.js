"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronLeft, CheckCircle2, 
  Headphones, Camera, Monitor, 
  Plus, Trash2, 
  HelpCircle, Rocket, GraduationCap, Users, TestTube,
  PlayCircle, Loader2, Volume2, ChevronDown, Settings2, Target,
  Sparkles, ArrowRight, X, ArrowUpRight, ChevronRight, Globe,
  Activity
} from "lucide-react";
import { createProject, getVoices } from "@/lib/db";

function NewProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic"); // "basic" | "workflow"

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "support",
    support_qa: "",
    support_flow: "",
    onboarding_checklist: "",
    edu_content: "",
    edu_desc: "",
    interview_checklist: "",
    test_method: "",
    ai_prompt: "",
    voice_id: "Puck",
    voice_guide: "차분하고 친절하면서도 전문적인 톤을 유지해주세요.",
    stages: [], // [{ id, title, instructions, is_visible, missions: [] }]
    media: { audio: true, camera: false, screen: false },
    url_type: "one-time",
    duration: 600,
    is_unlimited: true,
    show_warning: true
  });

  // Fetch Dynamic Voices from DB
  useEffect(() => {
    async function fetchVoices() {
      const data = await getVoices();
      if (data && data.length > 0) {
        setVoices(data);
        if (!data.find(v => v.api_id === formData.voice_id)) {
          setFormData(prev => ({ ...prev, voice_id: data[0].api_id }));
        }
      }
    }
    fetchVoices();
  }, []);

  // Load Draft from LocalStorage
  useEffect(() => {
    const draft = localStorage.getItem(`draft_${formData.type}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [formData.type]);

  // Auto-save Draft
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`draft_${formData.type}`, JSON.stringify({
        support_qa: formData.support_qa,
        support_flow: formData.support_flow,
        onboarding_checklist: formData.onboarding_checklist,
        edu_content: formData.edu_content,
        edu_desc: formData.edu_desc,
        interview_checklist: formData.interview_checklist,
        test_method: formData.test_method,
        voice_guide: formData.voice_guide,
        stages: formData.stages
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  useEffect(() => {
    const name = searchParams.get("name");
    const type = searchParams.get("type");
    if (name) updateFormData("name", name);
    if (type) updateFormData("type", type);
    
    if (!name && !formData.name) {
      router.replace("/gendesk/project");
    }
  }, [searchParams]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleMedia = (type) => {
    setFormData(prev => ({
      ...prev,
      media: { ...prev.media, [type]: !prev.media[type] }
    }));
  };

  const addStage = () => {
    const newStage = {
      id: Date.now(),
      title: `단계 ${formData.stages.length + 1}`,
      instructions: "",
      is_visible: true,
      missions: []
    };
    setFormData(prev => ({ ...prev, stages: [...prev.stages, newStage] }));
  };

  const removeStage = (id) => {
    setFormData(prev => ({ ...prev, stages: prev.stages.filter(s => s.id !== id) }));
  };

  const updateStage = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const addMissionToStage = (stageId, type = 'collect') => {
    const newMission = {
      id: Date.now(),
      type: type,
      title: "",
      data_type: 'text',
      verify_method: 'yes_no',
      is_required: true,
      config: type === 'collect' ? { label: "" } : { checklist: [""] }
    };

    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === stageId ? { 
        ...s, 
        missions: [...s.missions, newMission] 
      } : s)
    }));
  };

  const removeMissionFromStage = (stageId, missionId) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === stageId ? { 
        ...s, 
        missions: s.missions.filter(m => m.id !== missionId) 
      } : s)
    }));
  };

  const updateMissionInStage = (stageId, missionId, field, value) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === stageId ? { 
        ...s, 
        missions: s.missions.map(m => m.id === missionId ? { ...m, [field]: value } : m) 
      } : s)
    }));
  };

  const generateSystemPrompt = () => {
    const { type, voice_guide } = formData;
    let scenarioText = "";
    
    if (type === 'support') scenarioText = `Q&A 가이드: ${formData.support_qa}\n프로세스: ${formData.support_flow}`;
    else if (type === 'onboarding') scenarioText = `체크리스트: ${formData.onboarding_checklist}`;
    else if (type === 'education') scenarioText = `학습 내용: ${formData.edu_content}`;
    else if (type === 'interview') scenarioText = `평가 기준: ${formData.interview_checklist}`;
    else if (type === 'test') scenarioText = `검증 방법: ${formData.test_method}`;

    return `
# 역할 및 페르소나:
${voice_guide}

# 시나리오 컨텍스트 (${type.toUpperCase()}):
${scenarioText}

# 실행 워크플로우 (엄격한 순차적 수행 단계):
${formData.stages.map((s, i) => `
단계 ${i+1}: ${s.title}
- 지침: ${s.instructions}
- 미션:
${s.missions.map(m => `  * [${m.type === 'collect' ? '데이터 수집' : '정보 검증'}] ${m.title} (${m.is_required ? '필수' : '선택'}${m.type === 'collect' ? `, 타입: ${m.data_type}` : ''})`).join('\n')}
`).join('\n')}

**핵심 가이드라인:**
현재 단계의 모든 '필수' 미션을 완료하기 전에는 절대로 다음 단계 내용을 언급하거나 넘어가면 안 됩니다.
대화 흐름에 맞게 자연스럽게 전문 상담원처럼 행동하세요. 답변은 짧고 핵심적으로 1문장으로만 해주세요.
    `.trim();
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert("프로젝트 제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const scenario_data = {
        support: { qa: formData.support_qa, flow: formData.support_flow },
        onboarding: { checklist: formData.onboarding_checklist },
        education: { content: formData.edu_content, description: formData.edu_desc },
        interview: { checklist: formData.interview_checklist },
        test: { method: formData.test_method }
      }[formData.type];

      const res = await createProject({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        ai_prompt: generateSystemPrompt(),
        scenario: scenario_data,
        voice_id: formData.voice_id,
        voice_guide: formData.voice_guide,
        missions: formData.stages,
        media_requirements: formData.media,
        settings: {
          url_type: formData.url_type,
          duration: formData.is_unlimited ? null : formData.duration,
          show_warning: formData.show_warning
        }
      });

      if (res) {
        localStorage.removeItem(`draft_${formData.type}`);
        router.push("/gendesk/project");
      }
    } catch (err) {
      alert("발행 실패: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 pb-24 w-full px-8">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between mb-0 pt-0 h-16">
        <div className="flex items-center gap-3">
          <div className="relative group shrink-0">
            <select
              value={formData.type}
              onChange={(e) => updateFormData("type", e.target.value)}
              className="appearance-none bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-bold text-neutral-500 hover:text-black transition-all outline-none cursor-pointer"
            >
              {[
                { id: 'support', name: '고객지원' },
                { id: 'onboarding', name: '온보딩' },
                { id: 'education', name: '교육' },
                { id: 'interview', name: '면접' },
                { id: 'test', name: '테스트' },
              ].map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none group-hover:text-black transition-all" />
          </div>

          <div className="inline-grid items-center min-w-[32px]">
            <span className="invisible px-1 col-start-1 row-start-1 whitespace-pre text-2xl font-bold border-none">
              {formData.name || "프로젝트 제목 입력"}
            </span>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="프로젝트 제목 입력"
              className="col-start-1 row-start-1 w-full text-2xl font-bold text-neutral-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-neutral-200 transition-all font-bold"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
             onClick={() => router.back()} 
             className="text-sm font-bold text-neutral-400 hover:text-black transition-colors"
          >
             취소
          </button>
          <button 
            onClick={handleCreate}
            disabled={loading}
            className="bg-black text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center gap-2 shadow-2xl shadow-black/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            최종 프로젝트 발행
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* 접속 설정 바 */}
        <div className="pt-8 pb-8 border-b border-neutral-100 transition-all">
           <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
              <div className="flex items-center gap-4">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest shrink-0">접속 링크 타입</label>
                <div className="flex p-0.5 bg-neutral-50 rounded-lg border border-neutral-100 w-44">
                   <button 
                     onClick={() => updateFormData("url_type", "one-time")}
                     className={`flex-1 py-1.5 text-[9px] font-bold rounded-md transition-all ${formData.url_type === 'one-time' ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-500"}`}
                   >
                     1회용
                   </button>
                   <button 
                     onClick={() => updateFormData("url_type", "permanent")}
                     className={`flex-1 py-1.5 text-[9px] font-bold rounded-md transition-all ${formData.url_type === 'permanent' ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-500"}`}
                   >
                     상시
                   </button>
                </div>
              </div>

              <div className="w-px h-4 bg-neutral-100" />

              <div className="flex items-center gap-4">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest shrink-0">사용 권한</label>
                <div className="flex gap-1">
                  {[
                    { id: 'audio', icon: Headphones, label: '오디오' },
                    { id: 'camera', icon: Camera, label: '카메라' },
                    { id: 'screen', icon: Monitor, label: '화면공유' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleMedia(item.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${
                        formData.media[item.id] ? "bg-white border-neutral-200 text-black shadow-sm" : "bg-neutral-50 border-neutral-100 text-neutral-300 hover:text-neutral-400"
                      }`}
                      title={item.label}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px h-4 bg-neutral-100" />

              <div className="flex items-center gap-4">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest shrink-0">자동 종료 타이머</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateFormData("is_unlimited", !formData.is_unlimited)}
                    className={`w-6 h-3 rounded-full relative transition-all ${!formData.is_unlimited ? "bg-black" : "bg-neutral-200"}`}
                  >
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${!formData.is_unlimited ? "left-3.5" : "left-0.5"}`} />
                  </button>
                  {!formData.is_unlimited ? (
                    <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                        <input 
                          type="number" 
                          value={formData.duration}
                          onChange={(e) => updateFormData("duration", e.target.value)}
                          className="bg-transparent text-xs font-bold text-neutral-900 outline-none w-10 text-center"
                        />
                        <span className="text-[9px] font-bold text-neutral-300">초</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 px-1 py-1.5">제한없음</span>
                  )}
                </div>
              </div>
           </div>
        </div>

        {/* 탭 내비게이션 */}
        <div className="flex items-center gap-8 border-b border-neutral-100 pb-0 mb-8">
           {[
             { id: 'basic', name: '기본' },
             { id: 'workflow', name: '고급' }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`pb-4 px-1 text-xs font-bold transition-all relative ${
                 activeTab === tab.id ? "text-black" : "text-neutral-300 hover:text-neutral-500"
               }`}
             >
               {tab.name}
               {activeTab === tab.id && (
                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
               )}
             </button>
           ))}
        </div>

        {activeTab === 'basic' && (
          <div className="grid grid-cols-12 gap-16 items-start animate-in fade-in slide-in-from-left-2 duration-500">
            {/* 시나리오 리스트 */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="space-y-8">
                  {formData.type === 'support' && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">서비스 응대 시나리오 (Q&A)</label>
                          <textarea 
                            value={formData.support_qa}
                            onChange={(e) => updateFormData("support_qa", e.target.value)}
                            placeholder="사용자가 물어볼만한 예상 질문과 AI의 답변 가이드를 작성하세요..."
                            className="w-full p-6 bg-white border border-neutral-200 rounded-2xl focus:border-black outline-none transition-all text-sm font-medium leading-relaxed min-h-[220px] shadow-sm resize-none"
                          />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">프로세스 및 흐름</label>
                          <textarea 
                            value={formData.support_flow}
                            onChange={(e) => updateFormData("support_flow", e.target.value)}
                            placeholder="상담을 진행할 화면의 전체적인 흐름을 설명하세요..."
                            className="w-full p-6 bg-white border border-neutral-200 rounded-2xl focus:border-black outline-none transition-all text-sm font-medium leading-relaxed min-h-[140px] shadow-sm resize-none"
                          />
                       </div>
                    </div>
                  )}

                  {formData.type === 'onboarding' && (
                    <div className="space-y-4">
                       <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">온보딩 체크리스트</label>
                       <textarea 
                        value={formData.onboarding_checklist}
                        onChange={(e) => updateFormData("onboarding_checklist", e.target.value)}
                        placeholder="신규 사용자에게 반드시 설명해야 할 항목들을 작성하세요..."
                        className="w-full p-6 bg-white border border-neutral-200 rounded-2xl focus:border-black outline-none transition-all text-sm font-medium leading-relaxed min-h-[400px] shadow-sm resize-none"
                      />
                    </div>
                  )}

                  {formData.type === 'education' && (
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">교육 학습 컨텐츠</label>
                          <textarea 
                             value={formData.edu_content}
                             onChange={(e) => updateFormData("edu_content", e.target.value)}
                             placeholder="학습자에게 전달할 지식과 내용을 입력하세요..."
                             className="w-full p-6 bg-white border border-neutral-200 rounded-2xl focus:border-black outline-none transition-all text-sm font-medium leading-relaxed min-h-[300px] shadow-sm resize-none"
                           />
                       </div>
                       <div className="p-4 bg-white rounded-2xl flex items-center justify-between border border-neutral-100 shadow-sm">
                          <div className="flex items-center gap-3">
                             <GraduationCap className="w-4 h-4 text-neutral-300" />
                             <span className="text-[11px] font-bold text-black">화면에 표시될 교육 제목</span>
                          </div>
                          <input 
                            type="text"
                            value={formData.edu_desc}
                            onChange={(e) => updateFormData("edu_desc", e.target.value)}
                            placeholder="학습자용 제목"
                            className="bg-transparent text-sm font-bold outline-none text-right placeholder:text-neutral-200 font-bold"
                          />
                       </div>
                    </div>
                  )}

                  {['interview', 'test'].includes(formData.type) && (
                    <div className="space-y-4">
                       <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">{formData.type === 'interview' ? '지원자 역량 평가 리스트' : '테스트 시나리오 및 기준'}</label>
                       <textarea 
                         value={formData.type === 'interview' ? formData.interview_checklist : formData.test_method}
                         onChange={(e) => updateFormData(formData.type === 'interview' ? "interview_checklist" : "test_method", e.target.value)}
                         placeholder="평가가 필요한 세부 항목들이나 테스트 성공 조건을 작성하세요..."
                         className="w-full p-6 bg-white border border-neutral-200 rounded-2xl focus:border-black outline-none transition-all text-sm font-medium leading-relaxed min-h-[400px] shadow-sm resize-none"
                       />
                    </div>
                  )}
                </div>
            </div>

            {/* 음성 및 페르소나 */}
            <div className="col-span-12 lg:col-span-4 space-y-12">
               <div className="space-y-4">
                  <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">AI 음성 선택</label>
                  <div className="relative">
                     <button 
                       onClick={() => setIsVoiceOpen(!isVoiceOpen)}
                       className="w-full flex items-center justify-between p-5 bg-white border border-neutral-200 rounded-2xl hover:border-black transition-all shadow-sm group"
                     >
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
                            <Volume2 className="w-5 h-5" />
                         </div>
                         <div className="text-left">
                            <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-neutral-900">
                                 {voices.find(v => v.api_id === formData.voice_id)?.name_ko || formData.voice_id}
                               </span>
                               <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                              {voices.find(v => v.api_id === formData.voice_id)?.persona_match || "Gemini 라이브 보이스"}
                            </p>
                         </div>
                       </div>
                       <ChevronDown className="w-4 h-4 text-neutral-300 group-hover:text-black" />
                     </button>
                     {isVoiceOpen && (
                       <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white border border-neutral-200 rounded-2xl shadow-2xl p-2 space-y-1 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                         {voices.map((v) => (
                            <button
                              key={v.api_id}
                              onClick={() => {
                                updateFormData("voice_id", v.api_id);
                                setIsVoiceOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                                formData.voice_id === v.api_id ? "bg-black text-white" : "hover:bg-neutral-50 text-neutral-800"
                              }`}
                            >
                              <div className="flex items-center gap-3 text-left">
                                 <span className="text-xs font-bold">{v.name_ko}</span>
                                 <span className={`text-[9px] font-bold uppercase tracking-widest ${formData.voice_id === v.api_id ? "text-white/40" : "text-neutral-300"}`}>
                                   {v.persona_match}
                                 </span>
                              </div>
                            </button>
                         ))}
                       </div>
                     )}
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">AI 페르소나 지침 (톤앤매너)</label>
                  <textarea 
                     value={formData.voice_guide}
                     onChange={(e) => updateFormData("voice_guide", e.target.value)}
                     placeholder="AI가 어떤 말투와 성격으로 대화해야 하는지 알려주세요..."
                     className="w-full p-6 bg-white border border-neutral-200 rounded-2xl focus:border-black outline-none transition-all text-xs font-bold leading-relaxed min-h-[220px] shadow-sm resize-none"
                   />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="animate-in fade-in duration-500 w-full text-black">
             <div className="space-y-12">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                     <h2 className="text-sm font-bold text-neutral-900">순차적 워크플로우 설계</h2>
                     <div className="px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-bold rounded uppercase tracking-widest shadow-sm">
                        순차 수행 모드
                     </div>
                  </div>
                  
                  <button
                     onClick={addStage}
                     className="bg-black px-6 py-2.5 rounded-xl text-white hover:bg-neutral-800 transition-all shadow-lg shadow-black/10 text-xs font-bold"
                  >
                     단계 추가
                  </button>
               </div>

               <div className="space-y-10">
                 {formData.stages.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-40 border border-neutral-100 rounded-[32px] bg-white shadow-sm">
                      <p className="text-[11px] text-neutral-300 font-bold tracking-widest text-center uppercase">워크플로우의 첫 번째 단계를 추가해주세요</p>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-10">
                      {formData.stages.map((stage, sIdx) => (
                        <div key={stage.id} className="relative bg-white border border-neutral-200 rounded-[32px] p-10 transition-all hover:border-black flex flex-col group/stage shadow-sm">
                          
                          {/* 단계 헤더 */}
                          <div className="flex items-start justify-between mb-10 pb-6 border-b border-neutral-100">
                             <div className="flex items-center gap-6 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white text-sm font-bold shrink-0">
                                  {sIdx + 1}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <input 
                                      value={stage.title}
                                      onChange={(e) => updateStage(stage.id, "title", e.target.value)}
                                      placeholder="단계 제목 입력"
                                      className="text-lg font-bold text-neutral-900 border-none p-0 focus:ring-0 outline-none w-full bg-transparent"
                                    />
                                    <div className="flex items-center gap-6">
                                       <div className="flex items-center gap-3">
                                          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">사용자 노출</span>
                                          <button 
                                            onClick={() => updateStage(stage.id, "is_visible", !stage.is_visible)}
                                            className={`w-8 h-4 rounded-full relative transition-all ${stage.is_visible ? "bg-black" : "bg-neutral-100"}`}
                                          >
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${stage.is_visible ? "left-4" : "left-0.5"}`} />
                                          </button>
                                       </div>
                                       <div className="w-px h-3 bg-neutral-100" />
                                       <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest">STAGE {sIdx + 1}</span>
                                    </div>
                                </div>
                             </div>
                             <button onClick={() => removeStage(stage.id)} className="text-[11px] font-bold text-neutral-300 hover:text-red-500 px-3 py-1.5 rounded-lg transition-all">
                                단계 삭제
                             </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* AI 지침 */}
                            <div className="space-y-4">
                               <div className="px-1">
                                  <span className="text-[11px] font-bold text-black uppercase tracking-wider">AI 수행 가이드</span>
                               </div>
                               <textarea 
                                 value={stage.instructions}
                                 onChange={(e) => updateStage(stage.id, "instructions", e.target.value)}
                                 placeholder="이 단계의 대화 지침을 상세히 입력하세요..."
                                 className="w-full bg-neutral-50 rounded-2xl p-6 border-none focus:ring-0 outline-none text-xs font-bold min-h-[220px] h-fit resize-none placeholder:text-neutral-200 leading-relaxed shadow-sm"
                               />
                            </div>

                            {/* 미션 설계 */}
                            <div className="flex flex-col">
                               <div className="flex items-center justify-between mb-4 px-1">
                                  <div className="flex items-center gap-3">
                                     <span className="text-[11px] font-bold text-black uppercase tracking-wider">미션 및 데이터 설계</span>
                                     <div className="px-1.5 py-0.5 rounded bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                       {stage.missions.length}
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <button onClick={() => addMissionToStage(stage.id, 'collect')} className="text-[10px] font-bold text-neutral-500 hover:text-black hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-all border border-neutral-100">
                                        데이터 수집 추가
                                     </button>
                                     <button onClick={() => addMissionToStage(stage.id, 'verify')} className="text-[10px] font-bold text-neutral-500 hover:text-black hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-all border border-neutral-100">
                                        검증 항목 추가
                                     </button>
                                  </div>
                               </div>

                               <div className="flex-1 space-y-3">
                                  {stage.missions.map((m) => (
                                    <div key={m.id} className="bg-white p-6 rounded-2xl border border-neutral-100 hover:border-black transition-all shadow-sm">
                                       <div className="flex items-center gap-4 mb-4">
                                          <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${m.type === 'collect' ? 'bg-black text-white' : 'bg-neutral-100 text-black'}`}>
                                             {m.type === 'collect' ? '데이터 수집' : '정보 검증'}
                                          </div>
                                          <input 
                                            value={m.title}
                                            onChange={(e) => updateMissionInStage(stage.id, m.id, "title", e.target.value)}
                                            placeholder={m.type === 'collect' ? "수집 항목 제목" : "검증 항목 제목"}
                                            className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 outline-none text-neutral-900"
                                          />
                                          <button onClick={() => removeMissionFromStage(stage.id, m.id)} className="text-[10px] font-bold text-neutral-300 hover:text-red-500 transition-all">
                                             삭제
                                          </button>
                                       </div>
                                       
                                       <div className="flex items-center justify-between border-t border-neutral-50 pt-4">
                                          {m.type === 'collect' ? (
                                            <div className="flex gap-2">
                                              {['text', 'number', 'date'].map(dt => (
                                                <button
                                                  key={dt}
                                                  onClick={() => updateMissionInStage(stage.id, m.id, "data_type", dt)}
                                                  className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${m.data_type === dt ? "bg-black text-white" : "bg-neutral-50 text-neutral-400 hover:text-neutral-600"}`}
                                                >
                                                  {dt}
                                                </button>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">
                                               AI 매칭 검증 (YES/NO)
                                            </span>
                                          )}
                                          
                                          <div className="flex items-center gap-4">
                                             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">필수 여부</span>
                                             <button 
                                               onClick={() => updateMissionInStage(stage.id, m.id, "is_required", !m.is_required)}
                                               className={`w-8 h-4 rounded-full relative transition-all ${m.is_required ? "bg-black" : "bg-neutral-100"}`}
                                             >
                                               <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${m.is_required ? "left-4" : "left-0.5"}`} />
                                             </button>
                                          </div>
                                       </div>
                                    </div>
                                  ))}

                                  {stage.missions.length === 0 && (
                                    <div className="h-full min-h-[160px] flex items-center justify-center border border-dashed border-neutral-100 rounded-2xl bg-neutral-50/10 px-10">
                                       <p className="text-[10px] font-bold text-neutral-300 tracking-widest uppercase text-center">미션을 설계하십시오</p>
                                    </div>
                                  )}
                               </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button 
                         onClick={addStage}
                         className="w-full min-h-[160px] border border-dashed border-neutral-100 rounded-[32px] text-neutral-300 hover:text-black hover:border-neutral-200 transition-all flex flex-col items-center justify-center bg-neutral-50/10 group"
                      >
                         <span className="text-[12px] font-bold uppercase tracking-[0.3em] group-hover:tracking-[0.4em] transition-all">새로운 단계 추가</span>
                      </button>
                   </div>
                 )}
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-200" />
      </div>
    }>
      <NewProjectContent />
    </Suspense>
  );
}
