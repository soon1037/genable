import { UserCircle, Building, CreditCard, Key } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">워크스페이스 기본 설정</h1>
        <p className="text-sm text-zinc-500 mt-1">개인 계정 정보, 팀 설정, 그리고 연동 권한을 관리할 수 있습니다.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
        
        {/* Profile Info */}
        <div className="p-8 flex items-start gap-8">
          <div className="w-1/3 flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-zinc-400" />
              내 정보 관리
            </h2>
            <p className="text-xs text-zinc-500">프로필 사진과 기본 연락처를 수정하세요.</p>
          </div>
          <div className="w-2/3 space-y-4">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200 text-xl font-bold text-zinc-400">
                김
              </div>
              <div className="flex flex-col gap-2">
                <input type="text" defaultValue="김상담 메니저" className="w-full text-sm font-medium p-2 border border-zinc-200 rounded-lg focus:ring-2 outline-none" />
                <input type="email" defaultValue="soon@genable.ai" disabled className="w-full text-sm text-zinc-500 bg-zinc-50 p-2 border border-zinc-200 rounded-lg" />
              </div>
            </div>
            <button className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              프로필 저장
            </button>
          </div>
        </div>

        {/* Organization */}
        <div className="p-8 flex items-start gap-8">
          <div className="w-1/3 flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-400" />
              전사 조직 관리
            </h2>
            <p className="text-xs text-zinc-500">소속된 워크스페이스 단위 속성을 변경합니다.</p>
          </div>
          <div className="w-2/3 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">계정 워크스페이스 이름</label>
              <input type="text" defaultValue="GENABLE MAIN TEAM" className="w-full text-sm p-3 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="p-8 flex items-start gap-8">
          <div className="w-1/3 flex flex-col gap-1">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-zinc-400" />
              개발 연동 설정 및 SDK
            </h2>
            <p className="text-xs text-zinc-500">자체 앱에 심기 위한 초기화 스크립트입니다.</p>
          </div>
          <div className="w-2/3">
            <div className="bg-zinc-900 rounded-lg p-4 font-mono text-[11px] text-zinc-200 leading-relaxed overflow-x-auto shadow-inner">
              {`<!-- Antigravity Mirroring SDK -->
<script src="https://cdn.antigravity.js/v1/sdk.js"></script>
<script>
  window.Antigravity.init({
    workspaceId: "ws_live_9421A",
  });
</script>`}
            </div>
            <button className="text-sm font-medium text-blue-600 hover:underline mt-2 inline-flex items-center gap-1">
              스크립트 복사하기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
