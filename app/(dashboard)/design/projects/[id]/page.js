"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight,
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  X, 
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Zap,
  Square,
  RectangleVertical,
  Maximize2,
  Camera,
  Menu,
  Bell,
  HelpCircle,
  CreditCard,
  Layout
} from "lucide-react";
import Link from "next/link";
import { 
  getDesignProjectById, 
  updateDesignProject, 
  uploadFile,
  getProfile
} from "@/lib/db";
import { useRouter, useParams } from "next/navigation";
import JSZip from "jszip";

export default function CardNewsEditor() {
// ... existing state ...
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showStartChoice, setShowStartChoice] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [initialReferenceUrl, setInitialReferenceUrl] = useState(null);
  const [isAiStartMode, setIsAiStartMode] = useState(false);
  const [navDirection, setNavDirection] = useState("right");
  
  const autoSaveTimerRef = useRef(null);

  const handlePrevPage = () => {
    setNavDirection("left");
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setNavDirection("right");
    setCurrentPageIndex(prev => prev + 1);
  };

  useEffect(() => {
    async function init() {
      try {
        const [projectData, profileData] = await Promise.all([
          getDesignProjectById(id),
          getProfile()
        ]);
        setProfile(profileData);
        if (!projectData.data?.pages || projectData.data.pages.length === 0) {
          setShowStartChoice(true);
          projectData.data = { pages: [], settings: { ratio: "1:1" } };
        } else {
          setShowStartChoice(false);
          setSelectedRatio(projectData.data.settings?.ratio || "1:1");
        }
        setProject(projectData);
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id]);

  // Auto-save logic
  useEffect(() => {
    if (!project || loading) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateDesignProject(id, {
          name: project.name,
          data: project.data,
          prompt: project.data.pages?.[currentPageIndex]?.prompt || null,
          thumbnail_url: project.data.pages?.[0]?.imageUrl || null
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [project?.data, project?.name, id, loading]);

  const currentPage = project?.data?.pages?.[currentPageIndex];

  const updateProjectData = useCallback((newData) => {
    setProject(prev => ({ ...prev, data: newData }));
  }, []);

  const handleBananaGenerate = async (targetPageIndex = currentPageIndex, forcedPrompt = aiPrompt, isInitial = false) => {
    const promptToUse = forcedPrompt || aiPrompt;
    if (!promptToUse) return;
    setIsAiLoading(true);
    try {
      let referenceImageUrl = initialReferenceUrl;
      const targetPageInState = project.data.pages[targetPageIndex];

      // Smart Reference Logic
      if (!isInitial) {
        if (targetPageInState?.imageUrl) {
          // Refinement Mode: Use current image as style seed
          referenceImageUrl = targetPageInState.imageUrl;
        } else if (targetPageIndex > 0 && project.data.pages[targetPageIndex - 1]?.imageUrl) {
          // Initial Creation Mode: Follow the previous page's theme
          referenceImageUrl = project.data.pages[targetPageIndex - 1].imageUrl;
        }
      }

      const res = await fetch("/api/design/nanobanana", {
        method: "POST",
        body: JSON.stringify({
          prompt: promptToUse,
          referenceImageUrl,
          aspectRatio: selectedRatio,
          type: targetPageIndex === 0 ? "cover" : "body"
        })
      });
      const result = await res.json();
      
      console.log("[NANO BANANA DEBUG] Full Server Response:", JSON.stringify(result, null, 2));
      
      if (result.error && !result.imageUrl) {
        if (result.rawError) console.error("[NANO BANANA DEBUG] Raw AI Error:", result.rawError);
        throw new Error(result.error);
      }
      
      const newData = { ...project.data };
      if (isInitial) {
        newData.settings = { ratio: selectedRatio };
        newData.pages = [{
          id: `page-${Date.now()}`,
          imageUrl: result.imageUrl,
          prompt: promptToUse,
          fullPrompt: result.fullPrompt,
          type: "cover"
        }];
        setShowStartChoice(false);
        setIsAiStartMode(false);
      } else {
        const targetPage = newData.pages[targetPageIndex];
        targetPage.imageUrl = result.imageUrl;
        targetPage.prompt = promptToUse;
        targetPage.fullPrompt = result.fullPrompt;
      }
      updateProjectData(newData);
      setAiPrompt("");
      setInitialReferenceUrl(null);
    } catch (err) {
      alert("생성 실패: " + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUpload = async (e, mode = 'direct') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileName = `assets/${id}/${Date.now()}-${file.name}`;
      const url = await uploadFile('thumbnails', fileName, file);
      
      if (mode === 'direct') {
        const newData = {
          settings: { ratio: selectedRatio },
          pages: [{ id: `page-${Date.now()}`, imageUrl: url, prompt: "직접 업로드 이미지", type: "cover" }]
        };
        updateProjectData(newData);
        setShowStartChoice(false);
      } else if (mode === 'reference') {
        setInitialReferenceUrl(url);
      }
    } catch (err) {
      alert("업로드 실패: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPage = () => {
    if (project.data.pages.length >= 10) { alert("최대 10장까지만 생성 가능합니다."); return; }
    const newData = { ...project.data };
    const newPage = { id: `page-${Date.now()}`, imageUrl: "", prompt: "", type: "body" };
    newData.pages.splice(currentPageIndex + 1, 0, newPage);
    updateProjectData(newData);
    setNavDirection("right");
    setCurrentPageIndex(currentPageIndex + 1);
  };

  const handleDeletePage = (index) => {
    if (project.data.pages.length <= 1) {
      setShowStartChoice(true);
      updateProjectData({ pages: [], settings: { ratio: "1:1" } });
      return;
    }
    const newData = { ...project.data };
    newData.pages.splice(index, 1);
    updateProjectData(newData);
    setNavDirection("left");
    setCurrentPageIndex(Math.max(0, index - 1));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-neutral-100 border-t-black rounded-full animate-spin" /></div>;

  const isLastPage = currentPageIndex === project.data.pages.length - 1;

  return (
    <div className="flex-1 flex flex-col bg-white font-sans overflow-hidden min-h-[calc(100vh-48px)] -m-8 relative">
      
      {/* Zero-Flash Image Preloader */}
      <div className="hidden opacity-0 pointer-events-none absolute h-0 w-0">
         {project?.data?.pages?.map(p => p.imageUrl && <img key={p.id} src={p.imageUrl} />)}
      </div>

      {/* Secondary Project-Specific Header (Sub-bar) */}
      <header className="h-12 bg-white px-8 flex items-center justify-between shrink-0 border-b border-neutral-100 z-20 transition-all duration-300">
        <div className="flex items-center gap-4">
          <Link href="/design/projects" className="p-1.5 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-black transition-all">
             <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </Link>
          <div className="h-4 w-px bg-neutral-100" />
          <input 
             value={project.name}
             onChange={(e) => setProject({...project, name: e.target.value})}
             placeholder="카드뉴스 제목 입력..."
             className="text-[14px] font-black tracking-tight text-black bg-transparent border-none outline-none focus:ring-1 ring-neutral-100 rounded-md px-2 -ml-2 w-56"
          />
        </div>

        <div className="flex items-center gap-4">
           {/* Ratio Selector Button (Now on the Right) */}
           <button 
              onClick={() => {
                if (currentPage?.imageUrl) return;
                const ratios = ["1:1", "4:5", "9:16"];
                const nextIndex = (ratios.indexOf(selectedRatio) + 1) % ratios.length;
                const newRatio = ratios[nextIndex];
                setSelectedRatio(newRatio);
                setProject(prev => ({
                  ...prev,
                  data: { ...prev.data, settings: { ...prev.data.settings, ratio: newRatio } }
                }));
              }}
              disabled={!!currentPage?.imageUrl}
              className={`group flex items-center gap-1.5 px-3 py-1 border rounded-lg transition-all ${currentPage?.imageUrl ? 'bg-neutral-50 border-neutral-100 cursor-not-allowed opacity-60' : 'bg-white border-neutral-200 hover:border-black'}`}
           >
              <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest group-hover:text-black transition-colors">{selectedRatio}</div>
              {!currentPage?.imageUrl && <RefreshCw className="w-3 h-3 text-neutral-200 group-hover:text-black transition-colors group-hover:rotate-180 duration-500" />}
           </button>

           <div className="h-4 w-px bg-neutral-100 mx-2" />

          <div className="flex items-center gap-2 mr-4">
             {isSaving ? <span className="flex items-center gap-1.5 text-neutral-300 text-[11px] font-bold"><Loader2 className="w-3 h-3 animate-spin" /> 저장 중</span> 
             : <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold"><CheckCircle2 className="w-3 h-3" /> 동기화됨</span>}
          </div>
          
          <div className="flex items-center gap-4 border-l border-neutral-100 pl-6">
            <button 
               onClick={async () => { 
                  if (!project?.data?.pages) return;
                  setIsSaving(true); // Re-use for loading state here
                  const zip = new JSZip();
                  const folder = zip.folder(`genable-project-${id}`);
                  
                  try {
                    const downloadPromises = project.data.pages.map(async (page, index) => {
                      if (!page.imageUrl) return null;
                      const response = await fetch(page.imageUrl);
                      const blob = await response.blob();
                      folder.file(`card-${index + 1}.png`, blob);
                      return true;
                    });
                    
                    await Promise.all(downloadPromises);
                    const content = await zip.generateAsync({ type: "blob" });
                    const url = window.URL.createObjectURL(content);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `genable-project-${id}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error("ZIP formation failed:", err);
                    alert("전체 내보내기에 실패했습니다.");
                  } finally {
                    setIsSaving(false);
                  }
               }} 
               disabled={isSaving || !project?.data?.pages?.some(p => p.imageUrl)}
               className="btn-primary !px-6 !py-2 !text-[12px] shadow-lg shadow-black/10 disabled:opacity-20 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> 전체 내보내기
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative flex flex-col bg-neutral-50/50 overflow-hidden">
        
        {showStartChoice ? (
          /* Start Screen (Same Frame) */
          <div className="absolute inset-0 flex items-center justify-center bg-white z-30 animate-in fade-in duration-500 p-8">
             <div className="max-w-4xl w-full space-y-12 pb-20">
                <div className="text-center space-y-3">
                  <h2 className="text-4xl font-black tracking-tighter">어떻게 시작할까요?</h2>
                  <p className="text-neutral-400 font-bold opacity-60">규격을 선택한 뒤 첫 번째 이미지를 생성해 보세요.</p>
                </div>
                
                <div className="flex justify-center gap-4">
                   {[
                      { id: "1:1", label: "INSTA SQUARE (1:1)", icon: Square },
                      { id: "4:5", label: "PORTRAIT (4:5)", icon: RectangleVertical },
                      { id: "9:16", label: "STORY (9:16)", icon: Maximize2 }
                   ].map(size => (
                      <button 
                        key={size.id} 
                        onClick={() => setSelectedRatio(size.id)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[12px] font-black border transition-all ${selectedRatio === size.id ? 'bg-black text-white border-black shadow-2xl scale-105' : 'bg-white text-neutral-300 border-neutral-100 hover:bg-neutral-50 hover:text-neutral-900 group'}`}
                      >
                         <size.icon className={`w-4 h-4 ${selectedRatio === size.id ? 'text-white' : 'text-neutral-200 group-hover:text-black'}`} />
                         {size.label}
                      </button>
                   ))}
                </div>
                
                {!isAiStartMode ? (
                   <div className="grid grid-cols-2 gap-8 pt-4">
                      <div onClick={() => setIsAiStartMode(true)} className="card-premium group cursor-pointer hover:border-black transition-all p-12 space-y-20 flex flex-col items-center text-center">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-neutral-50 border border-neutral-100 flex items-center justify-center group-hover:bg-yellow-400 transition-colors"><Zap className="w-8 h-8 text-neutral-300 group-hover:text-black" /></div>
                         <div className="space-y-2"><h4 className="text-xl font-black">AI 자동 생성</h4><p className="text-sm font-medium text-neutral-400">나노바나나2가 직접 그립니다.</p></div>
                      </div>
                      
                      <div className="relative">
                        <label htmlFor="direct-upload-start" className="card-premium group cursor-pointer hover:border-black transition-all p-12 space-y-20 flex flex-col items-center text-center w-full h-full">
                           <div className="w-16 h-16 rounded-[1.5rem] bg-neutral-50 border border-neutral-100 flex items-center justify-center group-hover:bg-black transition-colors"><Upload className="w-8 h-8 text-neutral-300 group-hover:text-white" /></div>
                           <div className="space-y-2"><h4 className="text-xl font-black">이미지 업로드</h4><p className="text-sm font-medium text-neutral-400">보유한 원본을 사용합니다.</p></div>
                        </label>
                        <input id="direct-upload-start" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'direct')} />
                      </div>
                   </div>
                ) : (
                   /* AI Initial Configuration */
                   <div className="card-premium max-w-xl mx-auto p-12 space-y-8 animate-in slide-in-from-bottom-8 duration-500 relative">
                      <button onClick={() => setIsAiStartMode(false)} className="absolute top-8 right-8 text-neutral-300 hover:text-black transition-all"><X className="w-6 h-6" /></button>
                      <div className="space-y-2"><h3 className="text-2xl font-black tracking-tight">AI 생성 가이드</h3><p className="text-sm text-neutral-400 font-bold">첫 번째 장(커버)의 테마를 입력해 주세요.</p></div>
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">대표 스타일 레퍼런스 (선택)</label>
                            {initialReferenceUrl ? (
                               <div className="relative w-full h-32 rounded-2xl overflow-hidden group">
                                  <img src={initialReferenceUrl} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setInitialReferenceUrl(null)} className="p-3 bg-white text-black rounded-full shadow-2xl"><Trash2 className="w-5 h-5" /></button></div>
                               </div>
                            ) : (
                               <label className="w-full h-32 rounded-2xl border-2 border-dashed border-neutral-100 bg-neutral-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 hover:border-neutral-200 transition-all text-neutral-300">
                                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Camera className="w-10 h-10 opacity-20" />}
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'reference')} />
                               </label>
                            )}
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">설명</label>
                            <textarea 
                               placeholder="예: 현대적인 오피스 배경의 협업 중인 팀원들"
                               value={aiPrompt}
                               onChange={(e) => setAiPrompt(e.target.value)}
                               className="input-standard !min-h-[120px] !p-5"
                            />
                         </div>
                         <button onClick={() => handleBananaGenerate(0, aiPrompt, true)} disabled={!aiPrompt || isAiLoading} className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-40 shadow-xl shadow-black/10">
                            {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} 제작 시작
                         </button>
                      </div>
                   </div>
                )}
             </div>
          </div>
        ) : (
          /* Main Editor Layout - Clean and Unified */
          <>
            <main className="flex-1 overflow-auto flex flex-col items-center pt-12 pb-60 relative scrollbar-hide">
              <div className="relative flex items-center justify-center gap-16">
                
                {/* Navigation L */}
                <button 
                   onClick={handlePrevPage}
                   disabled={currentPageIndex === 0}
                   className={`w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all ${currentPageIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:scale-110 active:scale-95 text-black border border-neutral-50'}`}
                >
                   <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Unified Canvas Container (Shifted UP) */}
                <div className="relative bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] rounded-[6px] overflow-hidden transition-all duration-700"
                   style={{ 
                      width: selectedRatio === "9:16" ? 337 : selectedRatio === "4:5" ? 400 : 500, 
                      height: 500, 
                      transform: isAiLoading ? 'scale(0.98)' : 'scale(1)'
                    }}>
                   
                   {/* Animated Image Wrapper - Optimized to reduce flashing */}
                   <div key={currentPageIndex} className={`w-full h-full bg-white ${navDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'}`}>
                     {currentPage?.imageUrl ? <img src={currentPage.imageUrl} className={`w-full h-full object-cover ${isAiLoading ? 'opacity-30 blur-xl scale-110' : 'opacity-100'}`} />
                     : <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50/50 space-y-4"><ImageIcon className="w-10 h-10 text-neutral-100" /></div>}
                   </div>

                   {isAiLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-xl z-20"><div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center shadow-xl animate-bounce"><Sparkles className="w-8 h-8 text-black" strokeWidth={3} /></div><p className="mt-8 text-sm font-black text-black tracking-tight uppercase">Rendering with Nano Banana 2...</p></div>}
                   
                   {/* Delete Badge Overlay */}
                   {currentPage?.imageUrl && !isAiLoading && (
                      <button onClick={() => handleDeletePage(currentPageIndex)} className="absolute top-4 right-4 p-2.5 bg-white/80 hover:bg-red-500 hover:text-white rounded-xl backdrop-blur-md transition-all shadow-sm group">
                         <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </button>
                   )}
                </div>

                {/* Navigation R */}
                <div className="flex flex-col items-center justify-center">
                   {isLastPage ? (
                     <button 
                        onClick={handleAddPage} 
                        className="w-12 h-12 rounded-full bg-white border border-neutral-100 shadow-lg flex items-center justify-center text-neutral-300 hover:text-black hover:scale-110 transition-all active:scale-95 group"
                     >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                     </button>
                   ) : (
                     <button 
                        onClick={handleNextPage}
                        className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-black border border-neutral-100 hover:scale-110 active:scale-95 transition-all"
                     >
                        <ChevronRight className="w-6 h-6" />
                     </button>
                   )}
                </div>
              </div>
            </main>

            {/* Combined Bottom Console - Always Visible and Uniform */}
            <div className="absolute bottom-0 left-0 right-0 p-10 z-30 pointer-events-none">
               <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 pointer-events-auto">
                  
                  {/* Floating Prompt Bar (Multi-line Support) */}
                  <div className="w-full bg-white/90 backdrop-blur-3xl rounded-[2.5rem] p-3 pl-8 flex items-center gap-4 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] border border-neutral-100 animate-in slide-in-from-bottom-6 duration-500">
                    <div className="shrink-0 flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-neutral-900 rounded-full text-[9px] font-black text-white uppercase tracking-widest">{currentPageIndex + 1} / {project.data.pages.length}</div>
                    </div>
                    <textarea 
                      value={aiPrompt} 
                      onChange={(e) => setAiPrompt(e.target.value)} 
                      placeholder={currentPageIndex === 0 ? "커버 테마를 입력하거나 수정하세요..." : "본문 내용을 설명해 주세요..."} 
                      className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-black placeholder:text-neutral-300 py-4 max-h-[120px] resize-none" 
                    />
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleBananaGenerate()} disabled={isAiLoading || !aiPrompt} className="h-12 px-8 bg-black text-white rounded-[1.5rem] font-black text-[12px] flex items-center gap-2 active:scale-95 transition-all disabled:opacity-20 shadow-xl group">
                         {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <Sparkles className="w-4 h-4 text-yellow-400 group-hover:scale-125 transition-transform" />}
                         {isAiLoading ? 'GENERATING' : (currentPage?.imageUrl ? '다시 그리기' : '생성하기')}
                       </button>
                    </div>
                  </div>

                  {/* Reference & Metadata Area */}
                  <div className="flex items-center gap-8 animate-in fade-in duration-1000">
                     <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">레퍼런스</span>
                        {initialReferenceUrl ? (
                           <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-2xl border border-white group">
                              <img src={initialReferenceUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setInitialReferenceUrl(null)} className="p-1.5 bg-white text-black rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></div>
                           </div>
                        ) : (currentPageIndex === 0 ? (
                           <label className="w-16 h-16 rounded-xl border-2 border-dashed border-neutral-100 bg-white/50 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-white transition-all text-neutral-200 group">
                              <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'reference')} />
                           </label>
                        ) : (
                           <div className="flex h-16 items-center px-4 bg-neutral-100/50 rounded-xl border border-neutral-100">
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Automatic Style Sync Active</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .btn-primary { background: black; color: white; border-radius: 1rem; font-weight: 800; transition: all 0.25s; cursor: pointer; border: none; font-family: inherit; }
        .btn-primary:not(:disabled):hover { opacity: 0.85; transform: translateY(-1px); }
        .input-standard { background: #f2f2f2; border-radius: 1.25rem; border: none; padding: 1.25rem; width: 100%; outline: none; font-weight: 600; font-family: inherit; font-size: 14px; }
        .card-premium { background: white; border-radius: 2rem; border: 1px solid #f2f2f2; padding: 2.5rem; box-shadow: 0 15px 40px -15px rgba(0,0,0,0.06); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-bounce { animation: bounce 1.2s infinite ease-in-out; }

        @keyframes slide-in-right {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-right { animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-left { animation: slide-in-left 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
