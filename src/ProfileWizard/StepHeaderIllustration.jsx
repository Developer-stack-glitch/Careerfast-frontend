import React from 'react';

const StepHeaderIllustration = () => {
  return (
    <div className="hidden lg:flex items-center justify-end relative select-none pointer-events-none">
      {/* Background soft dots pattern */}
      <div className="absolute -top-4 -left-12 w-28 h-20 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#f97316" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>

      {/* Floating ID Card Graphic */}
      <div className="relative z-10 mr-4">
        <div className="bg-white border border-purple-100 rounded-2xl p-3.5 shadow-lg shadow-purple-500/5 w-44 transform -rotate-1 hover:rotate-0 transition-transform">
          <div className="flex items-center gap-3">
            {/* Avatar silhouette */}
            <div className="w-10 h-10 rounded-full bg-[#581C87] flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg className="w-6 h-6 fill-current opacity-90" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            {/* Skeleton lines */}
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-purple-200 rounded-full w-4/5" />
              <div className="h-1.5 bg-gray-200 rounded-full w-3/5" />
            </div>
          </div>
          <div className="mt-3.5 pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="h-2 bg-gray-100 rounded-full w-1/2" />
            {/* Verified purple circle */}
            <div className="w-6 h-6 rounded-full bg-[#6B21A8] text-white flex items-center justify-center text-xs shadow-sm">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* Script message with curved arrow */}
      <div className="relative z-10 flex flex-col items-start -ml-2 -mt-2">
        <span 
          className="text-[#6B21A8] text-sm font-bold leading-tight transform rotate-[-4deg] italic"
        >
          Let's build<br />
          your professional<br />
          journey
        </span>
        <svg className="w-8 h-8 text-[#6B21A8] -ml-1 mt-1 transform -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17L17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </div>
    </div>
  );
};

export default StepHeaderIllustration;
