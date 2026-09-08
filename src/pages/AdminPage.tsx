import React, { useState } from 'react';
import { ShieldCheck, Users, UserCheck, FileText, AlertTriangle, Activity, Terminal } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [verificationQueue] = useState<never[]>([]);
  const [reports] = useState<never[]>([]);

  return <div className="space-y-8 pb-16">
    <header className="space-y-2 border-b-2 border-outline-variant pb-7">
      <div className="inline-flex items-center gap-2 bg-dc-mint px-3 py-1 border-2 border-outline-variant font-label-mono text-[10px] uppercase"><Activity className="w-3.5 h-3.5" /> Platform status / live</div>
      <h2 className="dc-display text-5xl sm:text-6xl">ADMIN TERMINAL.</h2>
      <p className="text-sm text-on-surface-variant max-w-2xl">Administrative data is shown only when it comes from the live platform. No demo users, mentor applications, reports, or analytics are displayed.</p>
    </header>

    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[['Students', '0', Users], ['Mentors', '0', UserCheck], ['Posts', '0', FileText], ['Pending', String(verificationQueue.length), ShieldCheck], ['Reports', String(reports.length), AlertTriangle], ['Live Users', '0', Activity]].map(([label, value, Icon]) => <div key={String(label)} className="border-2 border-outline-variant bg-surface p-5 shadow-[4px_4px_0_#171717]"><p className="font-label-mono text-[10px] text-on-surface-variant uppercase mb-2">{label}</p><div className="flex items-center justify-between"><strong className="dc-display text-2xl">{value}</strong><Icon className="w-4 h-4 text-primary" /></div><p className="text-[9px] text-on-surface-variant font-label-mono mt-2 uppercase">Live data required</p></div>)}
    </section>

    <section className="border-2 border-outline-variant bg-surface shadow-[5px_5px_0_#171717]">
      <div className="p-5 border-b-2 border-outline-variant"><h3 className="dc-display text-3xl">USER MANAGEMENT.</h3><p className="font-label-mono text-[10px] uppercase text-on-surface-variant mt-1">Live profiles only</p></div>
      <div className="p-12 text-center"><Users className="w-8 h-8 mx-auto mb-4 text-primary" /><h4 className="dc-display text-3xl">NO USERS TO DISPLAY.</h4><p className="text-sm text-on-surface-variant mt-3">The admin terminal does not contain seeded or fabricated user records.</p></div>
    </section>

    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border-2 border-outline-variant bg-surface p-6 shadow-[4px_4px_0_#171717]"><div className="flex items-center justify-between border-b-2 border-outline-variant pb-4 mb-5"><h3 className="dc-display text-2xl">VERIFICATION QUEUE.</h3><span className="font-label-mono text-[10px]">0 PENDING</span></div><div className="border-2 border-dashed border-outline-variant p-8 text-center"><ShieldCheck className="w-6 h-6 mx-auto mb-3 text-on-surface-variant" /><p className="font-label-mono text-xs uppercase font-bold">NO PENDING VERIFICATIONS</p><p className="text-xs text-on-surface-variant mt-2">Real mentor/faculty requests will appear here when the verification workflow is connected.</p></div></div>
      <div className="border-2 border-outline-variant bg-surface p-6 shadow-[4px_4px_0_#171717]"><div className="flex items-center justify-between border-b-2 border-outline-variant pb-4 mb-5"><h3 className="dc-display text-2xl">MODERATION.</h3><span className="font-label-mono text-[10px]">0 REPORTS</span></div><div className="border-2 border-dashed border-outline-variant p-8 text-center"><AlertTriangle className="w-6 h-6 mx-auto mb-3 text-on-surface-variant" /><p className="font-label-mono text-xs uppercase font-bold">NO ACTIVE REPORTS</p><p className="text-xs text-on-surface-variant mt-2">Moderation records will appear here only when created by real platform activity.</p></div></div>
    </section>

    <section className="space-y-3"><h4 className="font-label-mono text-xs uppercase text-on-surface-variant flex items-center gap-2"><Terminal className="w-4 h-4 text-primary" /> Live terminal</h4><div className="border-2 border-outline-variant bg-surface p-6 font-label-mono text-xs text-on-surface-variant"><p>[LIVE] Waiting for platform events...</p><p>[LIVE] No seeded activity loaded.</p><p>[LIVE] No fabricated users or actions loaded.</p></div></section>
  </div>;
};
