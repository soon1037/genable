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
      // 1. Check for PRE-CREATED profile via EMAIL (Invitation case)
      const { data: invitedProfile, error: invitedError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email_address", session.user.email)
        .is("id", null) 
        .maybeSingle();
      
      if (!invitedError && invitedProfile) {
        const { data: linkedProfile, error: linkError } = await supabase
          .from("profiles")
          .update({ id: session.user.id })
          .eq("email_address", session.user.email)
          .select("*, companies(*)")
          .single();
        
        if (!linkError) return linkedProfile;
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
  const { data, error } = await supabase
    .from('profiles')
    .insert([userData])
    .select()
    .single()
  
  if (error) throw error
  return data
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
  console.log("[SUPABASE] Calling createSession(projectId:", projectId, ", guestId:", guestId, ")");
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ project_id: projectId, guest_id: guestId, status: 'active' }])
    .select()
    .single()
  if (error) {
    console.error("[SUPABASE] createSession error:", error);
    throw error
  }
  console.log("[SUPABASE] createSession result:", data);
  return data
}

export async function createOneTimeSession(projectId) {
  const payload = { project_id: projectId, status: 'pending', guest_id: `Secure-\${Math.random().toString(36).substring(7)}` };
  console.log("[SUPABASE] createOneTimeSession payload:", payload);
  const { data, error } = await supabase
    .from('sessions')
    .insert([payload])
    .select()
    .single()
  
  if (error) {
    console.error("[SUPABASE] createOneTimeSession error:", error);
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

export async function getProjectSessionDetails(projectId) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      mission_results(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
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
