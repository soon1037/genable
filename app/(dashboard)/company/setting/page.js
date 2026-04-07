"use client";

import { Building2, Save, Loader2, Globe, ShieldCheck, Mail, Phone, FileText, Image, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { getProfile, updateCompany } from "@/lib/db";

export default function CompanySettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    business_number: "",
    representative_name: "",
    description: "",
    website: "",
    phone: ""
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getProfile();
        setProfile(data);
        if (data?.companies) {
          setFormData({
            name: data.companies.name || "",
            business_number: data.companies.business_number || "",
            representative_name: data.companies.representative_name || "",
            description: data.companies.description || "",
            website: data.companies.website || "",
            phone: data.companies.phone || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!profile?.company_id) return;
    
    setSaving(true);
    try {
      await updateCompany(profile.company_id, formData);
      alert("기업 정보가 성공적으로 업데이트되었습니다.");
    } catch (err) {
      alert("정보 저장에 실패했습니다: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-neutral-200" />
    </div>
  );

  return (
    <div className="bg-white font-sans text-neutral-900 pb-20">
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-md sticky top-0 z-40 pr-8 pl-0 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-neutral-900">기업 설정</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-5 py-2.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            변경사항 저장
          </button>
        </div>
      </header>

      <main className="pr-8 pl-0 py-10 space-y-12">
        <form onSubmit={handleSave} className="space-y-6 w-full">
        {/* Business Info Section */}
        {/* Business Info Section */}
        <div className="card-premium">
          <label className="label-premium mb-6 pb-4 border-b border-neutral-100">
            비즈니스 정보 (Business Information)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="label-premium">기업 공식 명칭</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="input-standard" 
              />
            </div>
            <div className="space-y-4">
              <label className="label-premium">사업자 등록번호</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input 
                  type="text" 
                  name="business_number" 
                  value={formData.business_number} 
                  onChange={handleChange} 
                  className="input-standard !pl-12" 
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="label-premium">대표자 성함</label>
              <input 
                type="text" 
                name="representative_name" 
                value={formData.representative_name} 
                onChange={handleChange} 
                className="input-standard" 
              />
            </div>
            <div className="space-y-4">
              <label className="label-premium">고객 센터 전화</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="input-standard !pl-12" 
                />
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <label className="label-premium">대표 웹사이트</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              <input 
                type="text" 
                name="website" 
                value={formData.website} 
                onChange={handleChange} 
                className="input-standard !pl-12" 
              />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <label className="label-premium">기업 상세 설명 (선택)</label>
            <textarea 
              name="description" 
              rows={4} 
              value={formData.description} 
              onChange={handleChange} 
              className="input-standard min-h-[140px] resize-none" 
            />
          </div>
        </div>
        </form>
      </main>
    </div>
  );
}
