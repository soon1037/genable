"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { MonitorUp, Mic, Camera, Square, Loader2, Info, ArrowRight, Activity, Terminal, Target, CheckCircle2, Settings2 } from "lucide-react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { getProjectById, findSession, createSession, addSessionLog, getSessionLogs } from "@/lib/db";

import { useGeminiLiveHook } from "@/lib/gemini-live-hook";

function SessionContent() {
  const { projectId } = useParams();
  const searchParams = useSearchParams();
  const guestId = searchParams.get("id");
  
  const [project, setProject] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isIdVerified, setIsIdVerified] = useState(!!guestId);
  const [hasJoined, setHasJoined] = useState(false);
  const [userIdInput, setUserIdInput] = useState(guestId || "");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [isEnded, setIsEnded] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  const [permissions, setPermissions] = useState({
    audio: false,
    camera: false,
    screen: false
  });

  const { 
    status, isSpeaking, logs, setLogs, startSession, stopSession, 
    transcript, conversation, currentStageIndex, completedMissions 
  } = useGeminiLiveHook("aidesk-video");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, transcript]);

  useEffect(() => {
    if (isIdVerified && projectId && userIdInput) {
      initSession();
    }
  }, [isIdVerified, projectId, userIdInput]);

  async function initSession() {
    setLoading(true);
    setFetchError(null);
    try {
      console.log("Fetching project for ID:", projectId);
      const projData = await getProjectById(projectId);
      console.log("Project data received:", projData);
      
      if (!projData) {
        // Explicitly handle project not found
        setProject(null);
      } else {
        setProject(projData);

        let sess = await findSession(projectId, userIdInput);
        if (!sess) {
          sess = await createSession(projectId, userIdInput);
        }
        setSessionId(sess.id);

        const existingLogs = await getSessionLogs(sess.id);
        if (existingLogs) {
          setLogs(existingLogs.map(l => l.content));
        }
      }
    } catch (err) {
      console.error("Init session error:", err);
      setFetchError(err.message || "서버와 통신하는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const handleIdSubmit = (e) => {
    e.preventDefault();
    if (userIdInput.trim().length > 0) {
      setIsIdVerified(true);
    }
  };

  const requestPermission = async (type) => {
    try {
      if (type === 'audio') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setPermissions(prev => ({ ...prev, audio: true }));
      } else if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setPermissions(prev => ({ ...prev, camera: true }));
      } else if (type === 'screen') {
        setPermissions(prev => ({ ...prev, screen: true }));
      }
    } catch (err) {
      console.error(`Permission denied for ${type}:`, err);
      alert(`${type} 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.`);
    }
  };

  const isReadyToJoin = () => {
    if (!project) return false;
    const req = project.media_requirements || { audio: true, camera: false, screen: false };
    if (req.audio && !permissions.audio) return false;
    if (req.camera && !permissions.camera) return false;
    if (req.screen && !permissions.screen) return false;
    return true;
  };

  // Determine if it's a voice-only session for immersive mode
  const isVoiceOnly = project && !project.media_requirements?.screen && !project.media_requirements?.camera;

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-[#f9f9fb] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (isEnded) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center p-8 z-[100] text-center font-sans overflow-hidden">
        <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-10 animate-in fade-in zoom-in duration-1000">
           <CheckCircle2 className="w-10 h-10 text-white/40" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">세션이 종료되었습니다</h2>
        <p className="text-white/40 text-[14px] font-medium leading-relaxed max-w-sm mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          모든 상담 과정이 안전하게 중단되었습니다.<br/>
          제공된 가이드를 바탕으로 유익한 서비스가 되었기를 바랍니다.
        </p>
        
        <button 
          onClick={() => {
            setIsEnded(false);
            setHasJoined(false);
            setIsIdVerified(!!guestId); // guestId가 있으면 유지, 없으면 False
          }}
          className="bg-white text-black px-10 py-5 rounded-[2rem] font-bold text-[14px] hover:bg-neutral-200 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
        >
          확인 및 처음 화면으로
        </button>
      </div>
    );
  }

  if (isIdVerified && !loading && fetchError) {
    return (
      <div className="fixed inset-0 bg-[#f9f9fb] flex flex-col items-center justify-center p-8 z-50 text-center font-sans">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-6">
           <Activity className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter text-black mb-2">서버에 연결할 수 없습니다</h2>
        <p className="text-neutral-400 text-[13px] font-medium leading-relaxed max-w-sm mb-10">
          모바일 네트워크 환경이나 보안 설정으로 인해<br/>
          데이터베이스 서버와의 통신이 차단되었을 가능성이 있습니다.
          <br/><span className="text-[11px] mt-2 block font-mono text-red-400">Error: {fetchError}</span>
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-[13px] hover:bg-neutral-800 transition-all"
        >
          페이지 새로고침
        </button>
      </div>
    );
  }

  if (isIdVerified && !loading && !project) {
    return (
      <div className="fixed inset-0 bg-[#f9f9fb] flex flex-col items-center justify-center p-8 z-50 text-center font-sans">
        <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
           <Info className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter text-black mb-2">프리미엄 세션 정보를 찾을 수 없습니다</h2>
        <p className="text-neutral-400 text-[13px] font-medium leading-relaxed max-w-sm mb-10">
          요청하신 프로젝트 ID가 유효하지 않거나 삭제된 것 같습니다.<br/>
          올바른 URL인지 다시 한번 확인해 주세요.
        </p>
        <button 
          onClick={() => router.push('/gendesk')}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-[13px] hover:bg-neutral-800 transition-all"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  if (!isIdVerified) {
    return (
      <div className="fixed inset-0 bg-[#f9f9fb] flex items-center justify-center p-4 z-50 text-neutral-900 font-sans">
        <div className="bg-white border border-neutral-200 rounded-[2rem] p-10 max-w-sm w-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)]">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 flex items-center justify-center shadow-lg shadow-neutral-200">
              <MonitorUp className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-2xl font-black italic text-center text-black mb-2 tracking-tighter">GENABLE</h2>
          <p className="text-neutral-400 text-[13px] font-medium text-center mb-10 leading-relaxed px-4">
            전문 서비스 세션을 시작하려면<br/>부여받은 세션 ID를 입력해 주세요.
          </p>
          
          <form onSubmit={handleIdSubmit} className="space-y-4">
            <input 
              type="text" 
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="세션 ID 입력"
              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl px-5 py-4 text-black focus:outline-none focus:border-neutral-300 focus:bg-white transition-all text-center tracking-[0.2em] font-bold text-lg"
              required
            />
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white px-5 py-4 rounded-2xl font-bold text-[14px] transition-all"
            >
              상담 세션 입장
              <ArrowRight className="w-4 h-4" strokeWidth={3} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isIdVerified && !hasJoined) {
    const req = project?.media_requirements || { audio: true, camera: false, screen: false };
    
    return (
      <div className="fixed inset-0 bg-[#f9f9fb] flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white border border-neutral-200 rounded-[2.5rem] p-10 max-w-lg w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] space-y-8 my-auto">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-50 mb-4">
              <Settings2 className="w-6 h-6 text-neutral-400" />
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter text-black">준비 되셨나요?</h2>
            <p className="text-neutral-400 text-[13px] font-medium leading-relaxed">
              성공적인 세션 진행을 위해 다음 권한들을 미리 확인해 주세요.<br/>
              필수 권한이 모두 활성화되면 서비스를 시작할 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${permissions.audio ? "bg-emerald-50/30 border-emerald-100" : "bg-neutral-50 border-neutral-100"}`}>
               <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${permissions.audio ? "bg-emerald-500 text-white" : "bg-white text-neutral-400 shadow-sm"}`}>
                     <Mic className="w-5 h-5" strokeWidth={permissions.audio ? 2.5 : 1.5} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-neutral-900 flex items-center gap-2">
                       실시간 보이스 {req.audio && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-widest leading-none">필수</span>}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-medium">원활한 음성 소통이 가능합니다.</p>
                  </div>
               </div>
               {!permissions.audio ? (
                 <button onClick={() => requestPermission('audio')} className="px-4 py-2 bg-white border border-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-50 transition-all">허용하기</button>
               ) : (
                 <CheckCircle2 className="w-6 h-6 text-emerald-500" />
               )}
            </div>

            {req.camera && (
              <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${permissions.camera ? "bg-emerald-50/30 border-emerald-100" : "bg-neutral-50 border-neutral-100"}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${permissions.camera ? "bg-emerald-500 text-white" : "bg-white text-neutral-400 shadow-sm"}`}>
                      <Camera className="w-5 h-5" strokeWidth={permissions.camera ? 2.5 : 1.5} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-neutral-900 flex items-center gap-2">
                        비디오 스트림 <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-widest leading-none">필수</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-medium">화상 소통 및 카메라 인증에 사용됩니다.</p>
                    </div>
                </div>
                {!permissions.camera ? (
                   <button onClick={() => requestPermission('camera')} className="px-4 py-2 bg-white border border-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-50 transition-all">허용하기</button>
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                )}
              </div>
            )}

            {req.screen && (
              <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${permissions.screen ? "bg-emerald-50/30 border-emerald-100" : "bg-neutral-50 border-neutral-100"}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${permissions.screen ? "bg-emerald-500 text-white" : "bg-white text-neutral-400 shadow-sm"}`}>
                      <MonitorUp className="w-5 h-5" strokeWidth={permissions.screen ? 2.5 : 1.5} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-neutral-900 flex items-center gap-2">
                        화면 공유 모드 <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-widest leading-none">필수</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-medium">실시간 화면을 보며 가이드를 제공합니다.</p>
                    </div>
                </div>
                {!permissions.screen ? (
                  <button onClick={() => requestPermission('screen')} className="px-4 py-2 bg-white border border-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-50 transition-all">준비됨</button>
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                )}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button 
              disabled={!isReadyToJoin() || loading}
              onClick={() => {
                setHasJoined(true);
                startSession({ ...project, current_session_id: sessionId });
              }}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 text-white px-5 py-5 rounded-[1.5rem] font-bold text-[14px] transition-all scale-100 active:scale-95"
            >
              세션 입장 및 시작하기
              <ArrowRight className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Voice Immersive Mode ---
  if (isVoiceOnly) {
    const lastMsg = conversation.length > 0 ? conversation[conversation.length - 1] : null;
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans overflow-hidden">
        <header className="h-20 px-8 flex items-center justify-between shrink-0 z-40 bg-black/50 backdrop-blur-md border-b border-white/5">
          <h1 className="text-xl font-black italic tracking-tighter text-white">
            GENABLE <span className="not-italic font-normal text-white/20 ml-1">/</span> <span className="not-italic font-bold text-[13px] text-white/40 ml-1 uppercase tracking-widest leading-none">{project?.name}</span>
          </h1>
          <div className="flex items-center gap-2 text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">
            <div className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-white/10"}`}></div>
            <span>{status} session</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center relative px-8">
           <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className={`w-64 h-64 rounded-full bg-white/5 filter blur-3xl transition-all duration-1000 ${isSpeaking ? "scale-150 opacity-40 bg-indigo-500/20" : "scale-100 opacity-20"}`}></div>
              </div>
              <svg className="w-full h-48 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" viewBox="0 0 400 100">
                <defs>
                   <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                     <stop offset="50%" stopColor="white" />
                     <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                   </linearGradient>
                </defs>
                <path 
                  d="M0 50 Q 50 20, 100 50 T 200 50 T 300 50 T 400 50" 
                  fill="none" 
                  stroke="url(#waveGrad)" 
                  strokeWidth="2" 
                  className={`transition-all duration-500 ${isSpeaking || transcript.user ? 'animate-waveform' : 'opacity-20'}`}
                />
                <path 
                  d="M0 50 Q 50 80, 100 50 T 200 50 T 300 50 T 400 50" 
                  fill="none" 
                  stroke="url(#waveGrad)" 
                  strokeWidth="1" 
                  className={`opacity-30 transition-all duration-700 ${isSpeaking || transcript.user ? 'animate-waveform-slow' : 'opacity-10'}`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 <div className={`w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110 border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.15)] bg-white/5' : ''}`}>
                    <Mic className={`w-8 h-8 ${isSpeaking ? 'text-white' : 'text-white/20'}`} strokeWidth={1} />
                 </div>
              </div>
           </div>
        </main>

        <div className="pb-24 px-8 max-w-xl mx-auto w-full space-y-8">
           <div className="space-y-4 min-h-[140px] flex flex-col justify-end">
              {lastMsg && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                   <p className="text-white/30 text-[13px] font-medium leading-relaxed italic text-center px-4">
                     {lastMsg.role === 'user' ? 'GUEST: ' : 'AI: '}{lastMsg.text}
                   </p>
                </div>
              )}
              <div className="relative">
                {(transcript.user || transcript.assistant) ? (
                   <div className="animate-in fade-in zoom-in-95 duration-500">
                     <p className="text-white text-[18px] md:text-[22px] font-bold text-center leading-tight tracking-tight drop-shadow-sm whitespace-pre-wrap">
                        {transcript.assistant || transcript.user}
                     </p>
                   </div>
                ) : (
                  <div className="opacity-20 text-center flex flex-col items-center gap-3 py-6">
                    <Activity className="w-5 h-5 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Listening...</p>
                  </div>
                )}
              </div>
           </div>
           {/* End Session Button */}
           <div className="flex justify-center pt-8 pb-12 relative z-50">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  stopSession();
                  setIsEnded(true);
                }}
                style={{ touchAction: 'manipulation' }}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-[#E11D48] active:bg-[#F43F5E] text-white transition-all duration-300 scale-100 active:scale-90 shadow-[0_0_50px_rgba(225,29,72,0.4)]"
              >
                <div className="absolute inset-0 rounded-full bg-[#E11D48] animate-ping opacity-20 pointer-events-none"></div>
                <Square className="w-8 h-8 fill-current" />
              </button>
           </div>
        </div>

        <style jsx global>{`
          @keyframes waveform {
            0% { transform: scaleY(1) translateY(0); }
            50% { transform: scaleY(1.8) translateY(-2px); }
            100% { transform: scaleY(1) translateY(0); }
          }
          @keyframes waveform-slow {
            0% { transform: scaleY(1) translateY(0); }
            50% { transform: scaleY(1.4) translateY(2px); }
            100% { transform: scaleY(1) translateY(0); }
          }
          .animate-waveform { animation: waveform 1.2s ease-in-out infinite; transform-origin: center; }
          .animate-waveform-slow { animation: waveform-slow 2s ease-in-out infinite; transform-origin: center; }
        `}</style>
      </div>
    );
  }

  // --- Standard Dashboard Rendering ---
  return (
    <div className="min-h-screen bg-[#f9f9fb] text-neutral-900 flex flex-col font-sans selection:bg-neutral-100">
      <header className="h-20 bg-white border-b border-neutral-100 px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black italic tracking-tighter text-black">
            GENABLE <span className="not-italic font-normal text-neutral-300 ml-1">/</span> <span className="not-italic font-bold text-[13px] text-neutral-400 ml-1 uppercase tracking-widest">{project?.name || "SERVICE SESSION"}</span>
          </h1>
          <div className="h-4 w-px bg-neutral-100"></div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-neutral-400">
            <div className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500 animate-pulse" : "bg-neutral-300"}`}></div>
            <span>접속 ID: {userIdInput}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {status === "active" && isSpeaking && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white rounded-full text-[11px] font-bold uppercase tracking-wider animate-in fade-in zoom-in">
              <Mic className="w-3.5 h-3.5" strokeWidth={2.5} />
              AI 음성 송출 중
            </div>
          )}
          {status === "idle" && (
            <button
              onClick={() => startSession({ ...project, current_session_id: sessionId })}
              className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm active:scale-95"
            >
              <MonitorUp className="w-4 h-4" strokeWidth={2.5} />
              세션 재시작
            </button>
          )}
          {status !== "idle" && (
            <button
              onClick={() => {
                stopSession();
                setIsEnded(true);
              }}
              className="flex items-center gap-2 bg-white hover:bg-neutral-50 text-red-500 border border-neutral-200 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              세션 종료
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1700px] mx-auto w-full">
        <div className={`flex flex-col gap-6 ${project?.media_requirements?.screen ? "lg:col-span-8" : "lg:col-span-6"}`}>
          <div className="relative bg-white border border-neutral-200 rounded-[2.5rem] overflow-hidden aspect-video shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] border-none">
            {project?.media_requirements?.screen ? (
              <>
                <video 
                  id="aidesk-video"
                  ref={(el) => { if (el) el.muted = true; }}
                  className="w-full h-full object-cover bg-neutral-200"
                  playsInline
                />
                {status === "idle" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-50/80 backdrop-blur-sm space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center">
                       <MonitorUp className="w-8 h-8 text-neutral-200" />
                    </div>
                    <p className="text-[13px] font-bold text-neutral-400 font-sans tracking-tight">화면 공유를 시작하면 이곳에 표시됩니다.</p>
                  </div>
                )}
              </>
            ) : (
                <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center p-12 text-center">
                   <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? "bg-white shadow-[0_0_80px_rgba(255,255,255,0.4)] scale-110" : "bg-neutral-800 scale-100"}`}>
                      <Activity className={`w-12 h-12 transition-colors ${isSpeaking ? "text-neutral-900" : "text-neutral-600"}`} />
                   </div>
                   <h3 className={`mt-10 text-xl font-black italic tracking-tighter transition-colors ${isSpeaking ? "text-white" : "text-neutral-500"}`}>실시간 세션 진행 중</h3>
                   <p className="mt-2 text-neutral-400 text-[13px] font-medium leading-relaxed max-w-xs">{project?.voice_guide}</p>
                </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white border border-neutral-100 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center">
                   <Mic className={`w-5 h-5 ${status === 'active' ? 'text-green-500' : 'text-neutral-300'}`} />
                </div>
                <div>
                   <p className="text-[10px] font-black italic text-neutral-300 uppercase tracking-widest">AUDIO STATUS</p>
                   <p className="text-[13px] font-bold text-neutral-900">{status === 'active' ? '라이브 연결됨' : '대기 중'}</p>
                </div>
             </div>
             <div className="bg-white border border-neutral-100 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center">
                   <Target className={`w-5 h-5 ${completedMissions.size > 0 ? 'text-blue-500' : 'text-neutral-300'}`} />
                </div>
                <div>
                   <p className="text-[10px] font-black italic text-neutral-300 uppercase tracking-widest">MISSION PROGRESS</p>
                   <p className="text-[13px] font-bold text-neutral-900">{completedMissions.size}개 미션 완료</p>
                </div>
             </div>
          </div>
          {project?.missions?.length > 0 && (
            <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[12px] font-black uppercase text-neutral-900 tracking-tighter flex items-center gap-2">
                   <Target className="w-4 h-4" />
                   실시간 미션 진행 현황
                </h4>
                <div className="px-2 py-1 bg-neutral-50 rounded-lg text-[10px] font-bold text-neutral-400">
                   단계 {currentStageIndex + 1} / {project.missions.length}
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  {project.missions.map((s, idx) => (
                    <div key={idx} className="flex-1 h-1.5 rounded-full relative overflow-hidden bg-neutral-100">
                      <div className={`absolute inset-0 transition-all duration-700 ${idx < currentStageIndex ? "bg-black" : idx === currentStageIndex ? "bg-blue-500 animate-pulse" : "bg-neutral-100"}`} />
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-neutral-50 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white text-[10px] font-bold">
                        {currentStageIndex + 1}
                      </div>
                      <span className="text-[13px] font-bold text-neutral-900">{project.missions[currentStageIndex]?.title}</span>
                   </div>
                   <div className="flex gap-2">
                     {project.missions[currentStageIndex]?.missions.map((m, midx) => (
                       <div key={midx} className={`w-2 h-2 rounded-full ${completedMissions.has(m.id) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-200"}`} />
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-6 ${project?.media_requirements?.screen ? "lg:col-span-4" : "lg:col-span-6"}`}>
           <div className="flex-1 bg-white border border-neutral-200 rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden min-h-[500px]">
              <div className="h-14 border-b border-neutral-100 px-6 flex items-center justify-between shrink-0 bg-neutral-50/30">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">실시간 대화 내역</span>
                 </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide flex flex-col">
                 <div className="space-y-6 flex flex-col">
                    {conversation.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 shrink-0`}>
                        <div className={`max-w-[90%] px-5 py-3 rounded-2xl text-[13px] font-medium leading-relaxed break-words whitespace-pre-wrap ${msg.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-neutral-100 text-neutral-900 rounded-tl-none border border-neutral-200/50'}`}>
                           {msg.text}
                        </div>
                        <span className="text-[9px] text-neutral-300 font-bold mt-1 px-1">{msg.role === 'user' ? 'GUEST' : 'AI AI'}</span>
                      </div>
                    ))}
                    {transcript.user && (
                      <div className="flex flex-col items-end animate-pulse shrink-0">
                        <div className="max-w-[90%] px-5 py-3 rounded-2xl rounded-tr-none bg-neutral-50 text-neutral-400 text-[13px] font-medium italic border border-dashed border-neutral-200 break-words whitespace-pre-wrap">
                          {transcript.user}...
                        </div>
                      </div>
                    )}
                    {transcript.assistant && (
                      <div className="flex flex-col items-start animate-in fade-in transition-all shrink-0">
                        <div className="max-w-[90%] px-5 py-3 rounded-2xl rounded-tl-none bg-indigo-50/50 text-indigo-900 text-[13px] font-medium leading-relaxed border border-indigo-100/50 break-words whitespace-pre-wrap">
                           {transcript.assistant}
                        </div>
                      </div>
                    )}
                    {conversation.length === 0 && !transcript.user && !transcript.assistant && (
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-30 mt-auto">
                        <Terminal className="w-10 h-10 text-neutral-300" strokeWidth={1} />
                        <p className="text-[12px] font-bold text-neutral-400">음성 대화가 시작되면<br/>이곳에 메시지가 표시됩니다.</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
           <div className="h-44 bg-neutral-900 rounded-[2.5rem] p-6 flex flex-col overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-1">
                 <span>SYSTEM STREAM</span>
                 <div className="flex items-center gap-2">
                    {status === 'active' && <div className="w-1 h-1 bg-green-500 rounded-full animate-ping" />}
                    <span>{status}</span>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] text-neutral-500 scrollbar-hide">
                 {logs.slice(-6).map((log, i) => (
                   <div key={i} className="flex gap-2 hover:text-neutral-300 transition-colors">
                      <span className="text-neutral-800 shrink-0">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="break-all">{log}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      <footer className="py-8 text-center text-[10px] text-neutral-300 font-bold uppercase tracking-[0.3em] mt-auto">
        Authentication & Session provided by GENABLE DB
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function DeepLinkSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <SessionContent />
    </Suspense>
  );
}
