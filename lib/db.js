import { supabase } from './supabase'

/**
 * Profiles & RBAC
 */
export async function getProfile() {
  console.log("[SUPABASE] Calling getProfile()");
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    console.log("[SUPABASE] No session found in getProfile");
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', session.user.id)
    .single()
  
  if (error) {
    console.warn("[SUPABASE] Profile fetch error:", error);
    if (error.code === "PGRST116") {
      // 1. Check for PRE-CREATED INVITATION via EMAIL (New Invitation system)
      const { data: invite, error: inviteError } = await supabase
        .from("invitations")
        .select("*")
        .eq("email", session.user.email)
        .maybeSingle();
      
      if (!inviteError && invite) {
        console.log("[SUPABASE] Found invitation for new user, creating profile...");
        // 2. Create official profile using invited info
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([{
            id: session.user.id,
            email_address: session.user.email,
            company_id: invite.company_id,
            role: invite.role,
            position: invite.position,
            permissions: invite.permissions,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0]
          }])
          .select("*, companies(*)")
          .single();
        
        if (!createError) {
          // 3. Cleanup: Delete the invitation after successful profile creation
          await supabase.from("invitations").delete().eq("id", invite.id);
          return newProfile;
        } else {
          console.error("[SUPABASE] Failed to create profile from invitation:", createError);
        }
      }

      // 2. Default: Create a NEW company and profile for the user using metadata if available
      const meta = session.user.user_metadata || {};
      const companyName = meta.company_name || `${session.user.email?.split("@")[0]}님의 기업`;
      const businessNumber = meta.business_number || "";
      const fullName = meta.full_name || session.user.email?.split("@")[0];
      const position = meta.position || "";

      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert([{ 
          name: companyName,
          business_number: businessNumber
        }])
        .select()
        .single();
      
      if (companyError) throw companyError;

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert([{ 
          id: session.user.id, 
          full_name: fullName, 
          email_address: session.user.email,
          position: position,
          role: "admin", 
          credits: 100,
          company_id: newCompany.id,
          permissions: {
            gendesk: ["home", "project", "history"],
            company: ["setting", "users", "plan"],
            design: ["home", "projects", "templates"],
            is_admin: true
          }
        }])
        .select("*, companies(*)")
        .single();

      if (insertError) throw insertError;
      return newProfile;
    }
    throw error;
  }

  // 3. ADDITIONAL SAFETY: If the profile EXISTS but company_id is null
  if (data && !data.company_id) {
    const companyName = `\${data.full_name || "사용자"}님의 기업`;
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert([{ name: companyName }])
      .select()
      .single();
    
    if (!companyError && newCompany) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ company_id: newCompany.id })
        .eq("id", session.user.id)
        .select("*, companies(*)")
        .single();
      
      if (!updateError) return updatedProfile;
    }
  }

  return data;
}

export async function updateCompany(companyId, companyData) {
  const { data, error } = await supabase
    .from('companies')
    .update(companyData)
    .eq('id', companyId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(profileData) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', session.user.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Admin: User Management within Company
 */
export async function getCompanyUsers(companyId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', companyId)
    .order('full_name', { ascending: true })
  
  if (error) throw error
  return data
}

export async function inviteCompanyUser(userData) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch('/api/company/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ""}`
    },
    body: JSON.stringify(userData)
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to invite user");
  
  return result.data;
}

export async function updateCompanyUser(userId, userData) {
  const { data, error } = await supabase
    .from('profiles')
    .update(userData)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  
  if (error) throw error
  return true
}

export async function updateUserCredits(userId, credits) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ credits })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Projects CRUD (Updated for Company)
 */
export async function getProjects() {
  console.log("[SUPABASE] Calling getProjects()");
  const profile = await getProfile()
  if (!profile) return []

  let query = supabase.from('projects').select('*')
  
  // Super Admin sees all, Admin/User sees company projects
  if (profile.role !== 'super_admin' && profile.company_id) {
    query = query.eq('company_id', profile.company_id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) {
    console.error("[SUPABASE] getProjects error:", error);
    throw error
  }
  console.log("[SUPABASE] getProjects result:", data);
  return data
}

/**
 * Voice Definitions (Gemini Live 3.1)
 */
export async function getVoices() {
  const { data, error } = await supabase
    .from('voice_definitions')
    .select('*')
    .order('name_ko', { ascending: true })
  
  if (error) {
    console.error('Error fetching voices:', error)
    return null
  }
  return data
}

export async function createProject(projectData) {
  const profile = await getProfile()
  if (!profile) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from('projects')
    .insert([{ 
      ...projectData, 
      user_id: profile.id,
      company_id: profile.company_id 
    }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

/* Rest of the functions stay similar but honor RLS naturally */
export async function getProjectById(id) {
  console.log("[SUPABASE] Calling getProjectById(id:", id, ")");
  
  // 1. Try UUID lookup first (Standard)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  
  if (isUuid) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    
    if (data) return data;
    if (error) {
      console.error("[SUPABASE] getProjectById UUID error:", error);
      throw error;
    }
  }

  // 2. Fallback: Lookup by Slug (stored in settings JSONB)
  const { data: slugData, error: slugError } = await supabase
    .from('projects')
    .select('*')
    .eq('settings->>slug', id)
    .maybeSingle();

  if (slugError) {
    console.error("[SUPABASE] getProjectBySlug error:", slugError);
    throw slugError;
  }
  
  return slugData || null;
}

export async function updateProject(id, projectData) {
  const { data, error } = await supabase
    .from('projects')
    .update(projectData)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
  return true
}

/**
 * Sessions & Links
 */
export async function createSession(projectId, guestId) {
  console.log("[SUPABASE] createSession Attempting - Project:", projectId, "Guest:", guestId);
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ project_id: projectId, guest_id: guestId, status: 'active' }])
    .select()
    .single()
  
  if (error) {
    console.error("[SUPABASE] createSession Error Details:", error.code, error.message, error);
    throw error
  }
  return data
}

export async function createOneTimeSession(projectId) {
  const randomStr = Math.random().toString(36).substring(7).toUpperCase();
  const payload = { 
    project_id: projectId, 
    status: 'pending', 
    guest_id: `Secure-${randomStr}` 
  };
  console.log("[SUPABASE] createOneTimeSession Attempting payload:", payload);
  const { data, error } = await supabase
    .from('sessions')
    .insert([payload])
    .select()
    .single()
  
  if (error) {
    console.error("[SUPABASE] createOneTimeSession Error Details:", error.code, error.message, error);
    throw error;
  }
  return data
}

export async function updateSession(id, sessionData) {
  const { data, error } = await supabase
    .from('sessions')
    .update(sessionData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error("[SUPABASE] updateSession error:", error);
    throw error
  }
  return data
}

export async function findSession(projectId, guestId) {
  console.log("[SUPABASE] Calling findSession(projectId:", projectId, ", guestId:", guestId, ")");
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('project_id', projectId)
    .eq('guest_id', guestId)
    .maybeSingle()
  if (error) {
    if (error.code === 'PGRST116') return null
    console.error("[SUPABASE] findSession error:", error);
    throw error
  }
  console.log("[SUPABASE] findSession result:", data);
  return data
}

export async function getSessions(projectId = null) {
  let query = supabase.from('sessions').select('*, projects(name)')
  if (projectId) {
    query = query.eq('project_id', projectId)
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getProjectSessionDetails(projectId, limit = 50, offset = 0) {
  let query = supabase
    .from('sessions')
    .select(`
      *,
      mission_results(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (limit !== null) {
    query = query.range(offset, offset + limit - 1)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export async function getProjectSessionCounts() {
  const { data, error } = await supabase.from('sessions').select('project_id');
  if (error) throw error;
  
  const counts = data.reduce((acc, s) => {
    acc[s.project_id] = (acc[s.project_id] || 0) + 1;
    return acc;
  }, {});
  return counts;
}

/**
 * Logs
 */
export async function addSessionLog(sessionId, content, type = 'system') {
  const { data, error } = await supabase
    .from('session_logs')
    .insert([{ session_id: sessionId, content, type }])
    .select()
  if (error) throw error
  return data
}

export async function getSessionLogs(sessionId) {
  const { data, error } = await supabase
    .from('session_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Mission Results
 */
export async function saveMissionResult(resultData) {
  console.log("[SUPABASE] Calling saveMissionResult(data:", resultData, ")");
  const { data, error } = await supabase
    .from('mission_results')
    .insert([resultData])
    .select()
    .single()
  
  if (error) {
    console.error("[SUPABASE] saveMissionResult error:", error);
    throw error
  }
  console.log("[SUPABASE] saveMissionResult Success:", data);
  return data
}

export async function getSessionMissionResults(sessionId) {
  const { data, error } = await supabase
    .from('mission_results')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}

export async function getProjectMissionResults(projectId) {
  const { data, error } = await supabase
    .from('mission_results')
    .select(`
      *,
      sessions:session_id (
        id,
        guest_id,
        project_id
      )
    `)
    .eq('sessions.project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  // Filter out any results that joined with wrong project (Supabase inner join simulation)
  return data.filter(r => r.sessions && r.sessions.project_id === projectId)
}

/**
 * Storage: File Uploads
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    })
  
  if (error) throw error

  // Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)
  
  return publicUrl
}

/**
 * Design Projects CRUD
 */
export async function getDesignProjects() {
  const profile = await getProfile()
  if (!profile) return []

  let query = supabase.from('design_projects').select('*')
  if (profile.role !== 'super_admin' && profile.company_id) {
    query = query.eq('company_id', profile.company_id)
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createDesignProject(projectData) {
  const profile = await getProfile()
  if (!profile) throw new Error("Unauthorized")
  const { data, error } = await supabase
    .from('design_projects')
    .insert([{ ...projectData, user_id: profile.id, company_id: profile.company_id }])
    .select().single()
  if (error) throw error
  return data
}

export async function getDesignProjectById(id) {
  const { data, error } = await supabase.from('design_projects').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function updateDesignProject(id, projectData) {
  const { data, error } = await supabase.from('design_projects').update(projectData).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteDesignProject(id) {
  const { error } = await supabase.from('design_projects').delete().eq('id', id)
  if (error) throw error
  return true
}

/**
 * Design Templates CRUD
 */
export async function getDesignTemplates() {
  const profile = await getProfile()
  if (!profile) return []
  let query = supabase.from('design_templates').select('*')
  if (profile.role !== 'super_admin' && profile.company_id) {
    query = query.eq('company_id', profile.company_id)
  }
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createDesignTemplate(templateData) {
  const profile = await getProfile()
  if (!profile) throw new Error("Unauthorized")
  const { data, error } = await supabase
    .from('design_templates')
    .insert([{ ...templateData, user_id: profile.id, company_id: profile.company_id }])
    .select().single()
  if (error) throw error
  return data
}

export async function deleteDesignTemplate(id) {
  const { error } = await supabase.from('design_templates').delete().eq('id', id)
  if (error) throw error
  return true
}

/**
 * AI Usage Logging
 */
export async function saveUsageLog(usageData) {
  console.log("[USAGE LOG] Saving usage record:", usageData);
  const { data, error } = await supabase
    .from('usage_logs')
    .insert([usageData])
    .select()
    .single()
  
  if (error) {
    console.error("[USAGE LOG] Failed to save log:", error);
    // Non-blocking error: don't throw to prevent disrupting main service
    return null;
  }
  return data;
}

/**
 * Company Dashboard Data
 */
export async function getCompanyUsageLogs(companyId, limit = 10) {
  console.log("[SUPABASE] Calling getCompanyUsageLogs(companyId:", companyId, ")");
  const { data, error } = await supabase
    .from('usage_logs')
    .select(`
      *,
      projects (name),
      sessions (guest_id)
    `)
    .eq('projects.company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[SUPABASE] getCompanyUsageLogs error:", error);
    throw error;
  }
  
  // Filter out logs that don't match the company join properly (inner join simulation)
  return (data || []).filter(log => log.projects);
}

/**
 * Gendesk 전용 통계 데이터 조회
 */
export async function getGendeskStats(companyId) {
  if (!companyId) return null;

  try {
    // 1. 누적 세션 수
    const { count: totalSessions, error: sessionError } = await supabase
      .from("sessions")
      .select("*, projects!inner(company_id)", { count: "exact", head: true })
      .eq("projects.company_id", companyId);

    if (sessionError) throw sessionError;

    // 2. 통합 매출 및 사용량 데이터 로드
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("id, cost_krw, created_at, project_id, projects!inner(name, company_id), sessions(guest_id)")
      .eq("projects.company_id", companyId);

    if (usageError) throw usageError;

    // 3. 프로젝트별 매출 집계 (TOP 3)
    const projectRevenueMap = {};
    usageData.forEach(log => {
      const pid = log.project_id;
      if (!projectRevenueMap[pid]) {
        projectRevenueMap[pid] = { name: log.projects?.name, total: 0 };
      }
      projectRevenueMap[pid].total += Number(log.cost_krw) || 0;
    });

    const topProjects = Object.entries(projectRevenueMap)
      .map(([id, info]) => ({ id, name: info.name, total: info.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // 4. 전체 매출 통계 및 최근 히스토리
    const totalRevenue = usageData.reduce((acc, curr) => acc + (Number(curr.cost_krw) || 0), 0);
    const recentLogs = usageData.slice(0, 5).map(log => ({
      id: log.id,
      created_at: log.created_at,
      project_name: log.projects?.name || "Unknown",
      guest_id: log.sessions?.guest_id || "Guest",
      gen_consumed: (Number(log.cost_krw) || 0).toLocaleString()
    }));

    // 5. 최근 7일간의 상담 트렌드 (단순 세션 카운트)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: trendData, error: trendError } = await supabase
      .from("sessions")
      .select("created_at, projects!inner(company_id)")
      .eq("projects.company_id", companyId)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (trendError) throw trendError;

    return {
      totalSessions: totalSessions || 0,
      totalGen: totalRevenue, // Now representing Revenue in KRW
      avgDuration: usageData.length, // Count of total operations
      trendCount: trendData?.length || 0,
      recentLogs,
      topProjects
    };
  } catch (err) {
    console.error("Gendesk Stats Fetch Error Details:", {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
      stack: err.stack
    });
    return null;
  }
}

/**
 * 기업 대시보드용 통합 통계 데이터 조회 (매출, 멤버십, 팀 규모)
 */
export async function getCompanySummaryStats(companyId) {
  if (!companyId) return null;

  try {
    // 1. 기업 기본 정보 (잔액 등)
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("gen_balance")
      .eq("id", companyId)
      .single();

    if (companyError) throw companyError;

    // 2. 누적 매출 합산 (Image + Live 통합) - DB에 기록된 500원 단가 등 반영
    const { data: usageData, error: usageError } = await supabase
      .from("usage_logs")
      .select("cost_krw, projects!inner(company_id)")
      .eq("projects.company_id", companyId);

    if (usageError) throw usageError;
    const totalRevenue = usageData.reduce((acc, curr) => acc + (Number(curr.cost_krw) || 0), 0);

    // 3. 실제 활성 팀원 수 카운트
    const { count: memberCount, error: memberError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (memberError) throw memberError;

    // 4. 최근 10개 운영 로그 (히스토리용)
    const { data: recentLogs, error: logError } = await supabase
      .from("usage_logs")
      .select(`
        *,
        projects (name)
      `)
      .eq("projects.company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (logError) throw logError;

    return {
      genBalance: company.gen_balance || 0,
      membershipLevel: "PRO ENTERPRISE", // Currently not in DB, using stable default
      totalRevenue: totalRevenue,
      memberCount: memberCount || 0,
      recentLogs: recentLogs || []
    };
  } catch (err) {
    console.error("[SUPABASE] getCompanySummaryStats error:", err);
    return null;
  }
}

/**
 * 서비스별 가격 정책(Rate) 조회
 */
export async function getServicePricing() {
  console.log("[SUPABASE] Calling getServicePricing()");
  const { data, error } = await supabase
    .from('service_pricing')
    .select('*')
    .order('service_name', { ascending: true });
  
  if (error) {
    console.error("[SUPABASE] getServicePricing error:", error);
    throw error;
  }
  return data || [];
}
