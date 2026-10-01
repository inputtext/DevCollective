import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, MailPlus, XCircle } from 'lucide-react';
import { useAuth as useClerkAuth } from '@clerk/react';

type FacultyInvite = { id: string; email: string; college: string; status: string; expires_at: string; created_at: string; accepted_at?: string | null };
type FacultyProfile = { clerk_user_id: string; employee_id: string; department: string; designation: string; approval_status: string; created_at: string };

export const FacultyAdminPanel: React.FC = () => {
  const { getToken } = useClerkAuth();
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<FacultyInvite[]>([]);
  const [profiles, setProfiles] = useState<FacultyProfile[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const authFetch = async (url: string, init: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Admin session is unavailable.');
    const headers = new Headers(init.headers); headers.set('Authorization', 'Bearer ' + token);
    if (init.body) headers.set('Content-Type', 'application/json');
    const res = await fetch(url, { ...init, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };

  const load = async () => {
    const [inviteData, facultyData] = await Promise.all([authFetch('/api/admin/faculty-invitations'), authFetch('/api/admin/faculty')]);
    setInvites(inviteData.invitations || []);
    setProfiles(facultyData.profiles || []);
  };

  useEffect(() => { void load().catch((err) => setMessage(err.message)); }, []);

  const createInvite = async () => {
    setMessage(''); setBusy(true);
    try {
      const data = await authFetch('/api/admin/faculty-invitations', { method: 'POST', body: JSON.stringify({ email }) });
      await navigator.clipboard?.writeText(data.inviteUrl);
      setMessage(data.emailSent ? 'Invitation sent. Link copied.' : 'Invitation created. Email is not configured, so the link was copied for manual sharing.');
      setEmail(''); await load();
    } catch (err: any) { setMessage(err.message); } finally { setBusy(false); }
  };

  const decide = async (clerkUserId: string, decision: 'approve' | 'reject') => {
    setMessage(''); setBusy(true);
    try { await authFetch('/api/admin/faculty/' + encodeURIComponent(clerkUserId) + '/decision', { method: 'POST', body: JSON.stringify({ decision }) }); setMessage('Faculty approval updated.'); await load(); }
    catch (err: any) { setMessage(err.message); } finally { setBusy(false); }
  };

  return <section className="border-2 border-outline-variant bg-surface p-6 shadow-[4px_4px_0_#171717]">
    <div className="flex items-start justify-between gap-5 mb-6"><div><p className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">FACULTY / ACCESS CONTROL</p><h3 className="dc-display text-3xl mt-2">INVITE. VERIFY. APPROVE.</h3><p className="text-sm text-on-surface-variant mt-2">Faculty accounts are never self-selected. Admin issues an invitation, the faculty member verifies the official college email, then you approve the profile.</p></div><MailPlus className="w-6 h-6 shrink-0" /></div>
    <div className="flex flex-col sm:flex-row gap-3"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={import.meta.env.DEV ? "faculty@ghrietn.raisoni.net or temporary test email" : "faculty@ghrietn.raisoni.net"} className="flex-1 bg-background border-2 border-outline-variant px-4 py-3 text-sm" /><button disabled={busy || !email.trim()} onClick={() => void createInvite()} className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary border-2 border-outline-variant px-5 py-3 font-bold uppercase dc-mono text-[10px] disabled:opacity-50">Create Invitation</button></div>
    {message && <p className="mt-4 text-xs dc-mono bg-dc-mint border-2 border-outline-variant p-3">{message}</p>}
    <div className="grid lg:grid-cols-2 gap-5 mt-7">
      <div><h4 className="dc-mono text-[10px] uppercase tracking-[0.14em] mb-3">Recent Invitations</h4><div className="space-y-2">{invites.length ? invites.map((invite) => <div key={invite.id} className="border-2 border-outline-variant p-3 text-xs"><div className="flex justify-between gap-3"><strong>{invite.email}</strong><span>{invite.status}</span></div><p className="text-on-surface-variant mt-1">Expires {new Date(invite.expires_at).toLocaleDateString()}</p></div>) : <p className="text-xs text-on-surface-variant">No invitations yet.</p>}</div></div>
      <div><h4 className="dc-mono text-[10px] uppercase tracking-[0.14em] mb-3">Pending Faculty</h4><div className="space-y-2">{profiles.length ? profiles.map((profile) => <div key={profile.clerk_user_id} className="border-2 border-outline-variant p-3 text-xs"><div><strong>{profile.employee_id}</strong> · {profile.designation}</div><p className="text-on-surface-variant mt-1">{profile.department}</p><div className="flex gap-2 mt-3"><button disabled={busy} onClick={() => void decide(profile.clerk_user_id, 'approve')} className="inline-flex items-center gap-1 bg-dc-mint border-2 border-outline-variant px-3 py-2 font-bold uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button><button disabled={busy} onClick={() => void decide(profile.clerk_user_id, 'reject')} className="inline-flex items-center gap-1 bg-dc-pink border-2 border-outline-variant px-3 py-2 font-bold uppercase"><XCircle className="w-3.5 h-3.5" /> Reject</button></div></div>) : <p className="text-xs text-on-surface-variant">No pending faculty profiles.</p>}</div></div>
    </div>
  </section>;
};
