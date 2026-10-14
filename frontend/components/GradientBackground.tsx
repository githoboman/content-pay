'use client';

import React from 'react';

export default function GradientBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#070A11] text-gray-100 selection:bg-cyan-500 selection:text-black">
      {/* Background ambient lighting meshes */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top-left cyan orb */}
        <div className="absolute -top-[15%] -left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[140px]" />
        {/* Top-right indigo orb */}
        <div className="absolute top-[10%] -right-[15%] w-[550px] h-[550px] rounded-full bg-indigo-600/15 blur-[140px]" />
        {/* Bottom-left fuchsia orb */}
        <div className="absolute -bottom-[20%] left-[25%] w-[700px] h-[700px] rounded-full bg-fuchsia-600/10 blur-[160px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
