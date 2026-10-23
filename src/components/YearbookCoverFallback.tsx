import React from 'react';
import { Award, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

interface YearbookCoverFallbackProps {
  title: string;
  year: number;
  academicYear: string;
  schoolName?: string;
  className?: string;
}

// Deterministic color palette selector based on year
const PALETTES = [
  {
    bg: 'from-amber-950/90 via-slate-900 to-indigo-950',
    border: 'border-amber-500/40',
    accent: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    bg: 'from-blue-950/90 via-slate-900 to-cyan-950',
    border: 'border-cyan-500/40',
    accent: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    bg: 'from-emerald-950/90 via-slate-900 to-teal-950',
    border: 'border-emerald-500/40',
    accent: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    bg: 'from-purple-950/90 via-slate-900 to-rose-950',
    border: 'border-purple-500/40',
    accent: 'text-purple-300',
    badge: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  },
  {
    bg: 'from-red-950/90 via-slate-900 to-amber-950',
    border: 'border-red-500/40',
    accent: 'text-amber-300',
    badge: 'bg-red-500/20 text-amber-200 border-red-500/30',
  },
];

export const YearbookCoverFallback: React.FC<YearbookCoverFallbackProps> = ({
  title,
  year,
  academicYear,
  schoolName = 'BINA BANGSA SCHOOL',
  className = '',
}) => {
  const palette = PALETTES[Math.abs(year) % PALETTES.length];

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-5 select-none bg-gradient-to-br ${palette.bg} ${className}`}
    >
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Decorative inner frame */}
      <div
        className={`absolute inset-2 border ${palette.border} rounded-sm pointer-events-none`}
      />
      <div className="absolute inset-3 border border-white/5 rounded-sm pointer-events-none" />

      {/* Top Header: School Seal & Branding */}
      <div className="relative z-10 text-center pt-2">
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 mb-2">
          <GraduationCap className={`w-3.5 h-3.5 ${palette.accent}`} />
          <span className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold">
            {schoolName}
          </span>
        </div>
        <div className="text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase">
          Official Archival Edition
        </div>
      </div>

      {/* Center: Crest & Large Year */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center py-4">
        <div className="w-14 h-14 rounded-full bg-black/40 border border-amber-400/30 flex items-center justify-center mb-3 shadow-inner">
          <Award className={`w-7 h-7 ${palette.accent}`} />
        </div>

        <div className="font-serif-title text-3xl font-extrabold tracking-wider text-white drop-shadow-md">
          {year}
        </div>

        <div className="font-serif-body text-xs italic tracking-wider text-amber-200/90 mt-1">
          {academicYear}
        </div>

        <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent my-3" />

        <div className="font-serif-title text-sm font-semibold tracking-wide text-slate-100 line-clamp-2 px-2 max-w-[90%]">
          {title}
        </div>
      </div>

      {/* Bottom Footer: Spine & Metadata */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-slate-400" />
          <span>Annual Volume</span>
        </span>
        <span className="flex items-center gap-1 font-mono text-[9px] text-amber-300/80">
          <Sparkles className="w-2.5 h-2.5" />
          <span>ARCHIVE</span>
        </span>
      </div>
    </div>
  );
};
