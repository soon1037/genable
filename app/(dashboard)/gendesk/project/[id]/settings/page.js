"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft, CheckCircle2, Headphones, Camera, Monitor, MessageSquare,
  Plus, Trash2, HelpCircle, Rocket, GraduationCap, Users, TestTube,
  PlayCircle, Loader2, Volume2, ChevronDown, Settings2, Target,
  Sparkles, ArrowRight, X, ArrowUpRight, ChevronRight, Globe,
  XCircle, Activity
} from "lucide-react";
import { getProjectById, updateProject, getVoices } from "@/lib/db";

function EditProjectContent() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voices, setVoices] = useState([]);
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
    stages: [],
    media: { audio: true, camera: false, screen: false, text: false },
    url_type: "one-time",
    duration: 600,
    is_unlimited: true,
    show_warning: true,
    is_permanent_enabled: true
  });

  // 1. Fetch Project Data & Voices
  useEffect(() => {
    async function init() {
      try {
        const [proj, voiceList] = await Promise.all([
          getProjectById(id),
          getVoices()
        ]);

        if (voiceList) setVoices(voiceList);

        if (proj) {
          setFormData({
            name: proj.name || "",
            description: proj.description || "",
            type: proj.type || "support",
            support_qa: proj.scenario?.qa || "",
            support_flow: proj.scenario?.flow || "",
            onboarding_checklist: proj.scenario?.checklist || "",
            edu_content: proj.scenario?.content || "",
            edu_desc: proj.scenario?.description || "",
            interview_checklist: proj.scenario?.checklist || "",
            test_method: proj.scenario?.method || "",
            voice_id: proj.voice_id || "Puck",
            voice_guide: proj.voice_guide || "",
            stages: proj.missions && proj.missions.length > 0 && proj.missions[0].missions ? proj.missions :
              (proj.missions ? [{
                id: Date.now(),
                title: "기본 단계",
                instructions: "기존 미션들입니다.",
                is_visible: true,
                missions: proj.missions.map(m => ({
                  ...m,
                  id: m.id || Math.random(),
                  type: m.type || 'collect',
                  title: m.title || m.label || "미션",
                  is_required: m.is_required ?? true,
                  data_type: m.data_type || 'text',
                  config: m.config || { label: m.title || "" }
                }))
              }] : []),
            media: proj.media_requirements || { audio: true, camera: false, screen: false, text: false },
            url_type: proj.settings?.url_type || "one-time",
            duration: proj.settings?.duration || 600,
            is_unlimited: proj.settings?.duration === null,
            show_warning: proj.settings?.show_warning ?? true,
            is_permanent_enabled: proj.settings?.is_permanent_enabled ?? true,
            ai_prompt: proj.ai_prompt || ""
          });
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        alert("프로젝트 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id]);

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleMedia = (type) => {
    setFormData(prev => {
      const currentMedia = prev.media;
      const willBeActive = !currentMedia[type];
      
      // 최소 하나는 켜져 있어야 함
      const activeCount = Object.values(currentMedia).filter(v => v).length;
      if (!willBeActive && activeCount <= 1) {
        alert("최소 하나의 서비스 수단(오디오, 텍스트 등)은 활성화되어야 합니다.");
        return prev;
      }

      return {
        ...prev,
        media: { ...currentMedia, [type]: willBeActive }
      };
    });
  };

  const addStage = () => {
    const newStage = {
      id: `ST_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
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
    const prefix = type === 'collect' ? 'CO' : 'VE';
    const newMission = {
      id: `${prefix}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
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

    // ID 정규화 도우미 (숫자 ID에 접두사가 없으면 붙여줌)
    const fmtId = (id, prefix) => {
      const sId = String(id);
      return sId.startsWith(prefix) ? sId : `${prefix}_${sId}`;
    };

    return `
# 역할 및 페르소나:
${voice_guide}

# 서비스 시나리오 및 관련 정보:
${scenarioText}

# 실시간 상담 상황 및 도구 사용 지침:
사용자와의 대화 중 아래 정의된 미션(데이터 수집 또는 정보 검증)이 완료될 때마다 반드시 \`save_mission_result\` 도구를 호출하여 그 결과를 시스템에 즉시 기록해야 합니다. 

도구 호출 시 해당 미션에 부여된 ID(예: CO_ABC123)를 \`mission_id\` 파라미터에 정확하게 전달하십시오.

# 실행 워크플로우 및 미션 정의:
${formData.stages.map((s, i) => `
## 단계 ${i + 1}: ${s.title} (ID: ${fmtId(s.id, 'ST')})
- 단계 지침: ${s.instructions}
- 수행할 미션 목록:
${s.missions.map(m => `  * [${m.type === 'collect' ? '데이터 수집' : '정보 검증'}] ${m.title} (ID: ${fmtId(m.id, m.type === 'collect' ? 'CO' : 'VE')}, ${m.is_required ? '필수' : '선택'}${m.type === 'collect' ? `, 수집타입: ${m.data_type}` : ''})`).join('\n')}
`).join('\n')}

# 핵심 가이드라인:
1. 현재 단계의 모든 '필수' 미션을 완료하고 \`save_mission_result\`를 호출하기 전에는 절대로 다음 단계 내용을 언급하거나 넘어가면 안 됩니다.
2. 답변은 가급적 짧고 핵심적으로 1~2문장 내외로 해주세요.
3. 사용자가 미션에 해당하는 정보를 제공하면 즉시 도구를 사용하여 기록을 남긴 후 다음 대화를 이어가세요.
    `.trim();
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      alert("프로젝트 제목을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const scenario_data = {
        support: { qa: formData.support_qa, flow: formData.support_flow },
        onboarding: { checklist: formData.onboarding_checklist },
        education: { content: formData.edu_content, description: formData.edu_desc },
        interview: { checklist: formData.interview_checklist },
        test: { method: formData.test_method }
      }[formData.type];

      await updateProject(id, {
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
          show_warning: formData.show_warning,
          is_permanent_enabled: formData.is_permanent_enabled
        }
      });

      alert("수정사항이 저장되었습니다.");
      router.push("/gendesk/project");
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-200" />
      </div>
    );
  }

  return (
    <div className="bg-white font-sans text-neutral-900 pb-24 px-8">
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 pr-8 pl-0 py-4 mb-4 -mx-8 px-8">
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
                <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => updateFormData("type", e.target.value)}
                      className="appearance-none bg-neutral-50 border border-neutral-100 px-2.5 py-1 rounded text-[10px] font-black text-neutral-400 uppercase tracking-widest outline-none cursor-pointer hover:border-neutral-200 transition-all"
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
                </div>
                <div className="inline-grid items-center min-w-[32px]">
                  <span className="invisible px-0 col-start-1 row-start-1 whitespace-pre text-xl font-black italic tracking-tighter">
                    {formData.name || "Untitled"}
                  </span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="프로젝트 제목 입력"
                    className="col-start-1 row-start-1 w-full text-xl font-black italic tracking-tighter text-neutral-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-neutral-200 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="btn-primary flex items-center gap-2 py-2.5 px-8 shadow-xl shadow-black/5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              설정 저장 및 배포
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-8">


        {/* 탭 내비게이션 */}
        <div className="flex items-center gap-8 border-b border-neutral-100 pb-0 mb-8">
          {[
            { id: 'basic', name: '기본' },
            { id: 'workflow', name: '고급' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-xs font-bold transition-all relative ${activeTab === tab.id ? "text-black" : "text-neutral-300 hover:text-neutral-500"
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
          <div className="animate-in fade-in slide-in-from-left-2 duration-500 space-y-12">
            {/* 사용 권한 섹션 */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-black uppercase tracking-wider block px-1">서비스 사용 권한</label>
              <div className="flex gap-2 bg-white border border-neutral-100 p-4 rounded-3xl shadow-sm w-fit">
                {[
                  { id: 'audio', icon: Headphones, label: '오디오' },
                  { id: 'camera', icon: Camera, label: '카메라' },
                  { id: 'screen', icon: Monitor, label: '화면공유' },
                  { id: 'text', icon: MessageSquare, label: '텍스트 채팅' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleMedia(item.id)}
                    className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all border ${formData.media[item.id] ? "bg-black border-black text-white shadow-xl" : "bg-neutral-50 border-neutral-100 text-neutral-300 hover:text-neutral-400"
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{item.label}</span>
                    {formData.media[item.id] && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-16 items-start">
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
                          className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${formData.voice_id === v.api_id ? "bg-black text-white" : "hover:bg-neutral-50 text-neutral-800"
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
                  className="btn-primary px-6 py-2.5 text-xs"
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

export default function EditProjectPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-200" />
      </div>
    }>
      <EditProjectContent />
    </Suspense>
  );
}
