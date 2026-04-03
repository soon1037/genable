"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Type, 
  Zap, 
  ChevronDown,
  Bell,
  Search,
  Users,
  CreditCard,
  ShieldCheck,
  Building2,
  LogOut,
  Check,
  Menu,
  X,
  Key,
  Settings as SettingsIcon,
  HelpCircle,
  ExternalLink,
  Layout,
  FileText
} from "lucide-react";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/db";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Workspace Switcher, Sidebar & Profile Menu State
  const [activeWorkspace, setActiveWorkspace] = useState("genable"); 
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      
      try {
        const profileData = await getProfile();
        setProfile(profileData);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        setUser(session.user);
      }
    });

    // Handle outside clicks for profile menu
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [router]);

  // Define Menu Items for each Workspace
  const menuConfig = {
    genable: {
      title: "Genable Live",
      items: [
        { id: "home", label: "홈", href: "/gendesk/home", icon: Home },
        { id: "project", label: "프로젝트", href: "/gendesk/project", icon: Type },
        { id: "history", label: "히스토리", href: "/gendesk/history", icon: Zap },
      ]
    },
    company: {
      title: profile?.companies?.name || (profile?.full_name + " 기업" || "내 기업"),
      items: [
        { id: "home", label: "홈", href: "/company/home", icon: Home },
        { id: "setting", label: "기업 설정", href: "/company/setting", icon: Building2 },
        { id: "users", label: "사용자 설정", href: "/company/users", icon: Users },
        { id: "plan", label: "플랜 설정", href: "/company/plan", icon: CreditCard },
      ]
    },
    design: {
      title: "Genable Design",
      items: [
        { id: "projects", label: "카드뉴스", href: "/design/projects", icon: Layout },
      ]
    }
  };

  const activeMenu = menuConfig[activeWorkspace];
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const toggleWorkspace = (ws) => {
    setActiveWorkspace(ws);
    setIsSwitcherOpen(false);
    // Automatically navigate to the first item of the selected workspace
    router.push(menuConfig[ws].items[0].href);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-neutral-100 border-t-neutral-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-neutral-900 selection:bg-neutral-100">
      
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#f8f8f8] border-r border-neutral-100 flex flex-col z-20 shrink-0 transition-all duration-300 ease-in-out relative ${isSwitcherOpen ? '' : 'overflow-hidden'}`}>
        <div className={`pt-6 ${isSidebarOpen ? 'px-6' : 'px-5'} flex-1 flex flex-col items-start overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 ${isSwitcherOpen ? 'overflow-visible' : ''}`}>
          <div className={`${isSidebarOpen ? 'w-full' : 'w-10'} ml-[2px] mt-[2px] mb-8 transition-all duration-300`}>
            <Link href="/gendesk/home" className={`text-2xl font-black italic tracking-tighter text-black block transition-all duration-300 ${isSidebarOpen ? '' : 'text-center scale-110'}`}>
              G{isSidebarOpen && <span className="animate-in fade-in duration-300">ENABLE</span>}
            </Link>
          </div>
          
          <div className={`relative mb-6 w-full ${isSidebarOpen ? '' : 'flex justify-center'}`}>
             <button 
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className={`${isSidebarOpen ? 'w-full px-4 py-3' : 'w-10 h-10 px-0 py-0'} flex items-center justify-between rounded-2xl bg-white text-neutral-900 shadow-sm hover:border-neutral-300 transition-all border border-neutral-200 group`}
             >
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} overflow-hidden w-full`}>
                   <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-[10px] font-bold overflow-hidden text-neutral-400 group-hover:text-black transition-colors shrink-0">
                     {activeMenu.title[0]}
                   </div>
                   {isSidebarOpen && (
                     <span className="font-bold text-[13px] truncate whitespace-nowrap">
                       {activeMenu.title}
                     </span>
                   )}
                </div>
                {isSidebarOpen && <ChevronDown className={`w-4 h-4 text-neutral-300 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />}
             </button>

             {/* Workspace Dropdown Overlay */}
             {isSwitcherOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsSwitcherOpen(false)}></div>
                 <div className={`
                   ${isSidebarOpen 
                     ? 'absolute top-full left-0 right-0' 
                     : 'fixed left-20 top-[102px] w-56 shadow-2xl border border-neutral-100'} 
                   mt-1 bg-white rounded-2xl z-50 p-1 animate-in zoom-in-95 duration-100 origin-top
                 `}>
                    {Object.entries(menuConfig).map(([key, ws]) => (
                       <button
                          key={key}
                          onClick={() => toggleWorkspace(key)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                            activeWorkspace === key ? "bg-neutral-100 text-black" : "text-neutral-400 hover:bg-neutral-50 hover:text-black"
                          }`}
                       >
                          <div className="flex items-center gap-3">
                             <div className={`w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-[8px] overflow-hidden ${activeWorkspace === key ? "bg-black text-white" : ""}`}>
                                {ws.title[0]}
                             </div>
                             <span>{ws.title}</span>
                          </div>
                          {activeWorkspace === key && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                       </button>
                    ))}
                 </div>
               </>
             )}
          </div>

          <nav className={`flex flex-col gap-2 w-full ${isSidebarOpen ? '' : 'items-center'}`}>
            {activeMenu.items
              .filter(item => {
                // Permission Filtering Logic
                if (!profile) return false;
                
                // 1. Check if the domain (gendesk or company) exists in permissions
                const domain = activeWorkspace === 'genable' ? 'gendesk' : 'company';
                const userPerms = profile.permissions;
                
                // 2. Multi-case safety: Admin(Role), is_admin(Flag), or Explicit menu ID in permissions list
                if (profile.role === 'super_admin' || profile.role === 'admin') return true;
                if (userPerms?.is_admin) return true;
                
                // If no specific permission data is defined yet (legacy user), allow all as default admin
                if (!userPerms) return true; 

                // 3. Strict Check: menu id must be in the domain list
                if (!userPerms[domain]) return true; // Allow new domains by default for now
                return userPerms[domain]?.includes(item.id);
              })
              .map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4 py-2.5' : 'justify-center w-10 h-10 p-0'} rounded-xl text-[13px] font-bold transition-all ${
                      active 
                      ? "bg-white text-black shadow-sm border border-neutral-200" 
                      : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                    title={!isSidebarOpen ? item.label : ""}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-black" : "text-neutral-400"}`} strokeWidth={active ? 2.5 : 2} />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
            })}
          </nav>
        </div>
        
        {/* User Card at Bottom with Dropdown */}
        <div className="p-4 border-t border-neutral-100 bg-[#f8f8f8] relative" ref={profileMenuRef}>
          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className={`absolute bottom-full left-4 bg-white border border-neutral-200 rounded-2xl shadow-2xl p-1.5 mb-2 z-50 animate-in slide-in-from-bottom-2 duration-300 ${isSidebarOpen ? 'w-[calc(100%-32px)]' : 'w-48 left-full -ml-2'}`}>
              <div className="px-3 py-2 mb-1 border-b border-neutral-50 mb-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">계정 관리</p>
              </div>
              <button 
                onClick={() => { setIsProfileMenuOpen(false); router.push("/company/setting"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-black transition-all"
              >
                <SettingsIcon className="w-4 h-4 text-neutral-400" />
                내 정보 수정
              </button>
              <button 
                onClick={() => { setIsProfileMenuOpen(false); alert("비밀번호 재설정 이메일이 발송되었습니다 (Supabase 기능 필요)"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-black transition-all"
              >
                <Key className="w-4 h-4 text-neutral-400" />
                비밀번호 변경
              </button>
              <div className="h-px bg-neutral-100 my-1.5" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`flex items-center ${isSidebarOpen ? 'gap-3 w-full p-2' : 'justify-center w-12 h-12'} rounded-2xl hover:bg-white transition-all group ${isProfileMenuOpen ? 'bg-white shadow-sm ring-1 ring-neutral-200' : ''}`}
          >
             <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center font-black text-black text-[12px] uppercase shadow-sm group-hover:border-neutral-300 transition-all">
                  {profile?.full_name?.[0] || user?.email?.[0]}
                </div>
                {isAdmin && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center shadow-sm" title="Admin">
                   <ShieldCheck className="w-2.5 h-2.5 text-white" />
                </div>}
             </div>
             {isSidebarOpen && (
               <div className="flex flex-col text-[12px] items-start overflow-hidden">
                 <span className="font-black text-neutral-900 truncate leading-none mb-1">{profile?.full_name || "사용자"}</span>
                 <span className="text-neutral-400 truncate text-[11px] font-bold opacity-60 italic">{profile?.role === 'admin' ? '관리자' : '멤버'}</span>
               </div>
             )}
             {isSidebarOpen && <ChevronDown className={`ml-auto w-4 h-4 text-neutral-300 group-hover:text-black transition-all ${isProfileMenuOpen ? 'rotate-180' : ''}`} />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden bg-white">
        
        {/* Top Header (Compact) */}
        <header className="h-12 bg-white px-8 flex items-center justify-between shrink-0 border-b border-neutral-100 z-10 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-black transition-all"
            >
              <Menu className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-neutral-400 hover:text-black transition-all relative p-1.5 rounded-lg hover:bg-neutral-50" title="Notifications">
              <Bell className="w-4 h-4" strokeWidth={2.5} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-black rounded-full ring-2 ring-white"></span>
            </button>
            <div className="h-4 w-px bg-neutral-100"></div>
            <Link href="#" className="flex items-center gap-1.5 p-1.5 px-2 hover:bg-neutral-50 rounded-lg group transition-all">
              <HelpCircle className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-black">사용 가이드</span>
            </Link>
            <Link href="/company/plan" className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-100 rounded-lg group transition-all">
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-black transition-colors">스탠다드</span>
               <div className="w-1 h-1 bg-neutral-200 rounded-full" />
               <span className="text-[10px] font-bold text-neutral-900">v1.2.0</span>
            </Link>
            <Link href="/company/plan" className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg shadow-md shadow-black/10 transition-all active:scale-95 group">
               <CreditCard className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" strokeWidth={2.5} />
               <span className="text-[11px] font-black tracking-tight">{profile?.credits || 0}</span>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter group-hover:text-white transition-colors">크레딧</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-auto bg-white pt-0 px-8 pb-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
