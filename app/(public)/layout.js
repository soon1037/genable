import Link from 'next/link';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-neutral-100">
      <header className="fixed top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-50 bg-white/70 backdrop-blur-xl border-b border-neutral-100">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-black flex items-center gap-2">
           GENABLE
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-[11px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-all px-4 py-2">
            로그인
          </Link>
          <Link
            href="/signup"
            className="bg-black text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-neutral-800 transition-all active:scale-95"
          >
            가이드 시작하기
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
