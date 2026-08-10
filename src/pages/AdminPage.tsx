import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  FileText,
  AlertTriangle,
  Activity,
  Check,
  X,
  Terminal,
  MoreVertical,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [verificationQueue, setVerificationQueue] = useState([
    {
      id: 'ver-1',
      name: 'Alex K.',
      roleRequest: 'Senior Student Mentor',
      college: 'Stanford CS',
      appliedAt: '2 hours ago',
    },
    {
      id: 'ver-2',
      name: 'Prof. Mehta',
      roleRequest: 'Faculty Mentor',
      college: 'IIT Bombay',
      appliedAt: '5 hours ago',
    },
  ]);

  const [reports, setReports] = useState([
    {
      id: 'rep-492',
      title: 'Flagged Comment: Inappropriate Feedback',
      content: '"This code snippet is inadequate..."',
      author: 'User_892',
    },
  ]);

  const handleApprove = (id: string) => {
    setVerificationQueue(verificationQueue.filter((v) => v.id !== id));
  };

  const handleReject = (id: string) => {
    setVerificationQueue(verificationQueue.filter((v) => v.id !== id));
  };

  const handleDismissReport = (id: string) => {
    setReports(reports.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-surface-container-low px-3 py-1 border border-outline-variant font-label-mono text-xs text-tertiary">
          <span className="w-2 h-2 bg-tertiary rounded-full animate-ping" />
          <span>PLATFORM_STATUS: OPTIMAL</span>
        </div>
        <h2 className="font-display-2xl text-3xl sm:text-4xl font-extrabold text-white">
          🛠 Admin Control Terminal
        </h2>
        <p className="font-body-lg text-on-surface-variant text-base">
          Manage platform verification queues, moderation, community health, and user roles.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-xl">
          <p className="font-label-mono text-[10px] text-outline uppercase mb-2">Students</p>
          <h3 className="font-headline-md text-2xl font-bold text-primary">642</h3>
          <p className="text-[10px] text-tertiary font-bold mt-2">+12% this week</p>
        </div>

        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-xl">
          <p className="font-label-mono text-[10px] text-outline uppercase mb-2">Mentors</p>
          <h3 className="font-headline-md text-2xl font-bold text-secondary">34</h3>
          <p className="text-[10px] text-tertiary font-bold mt-2">+2 verified</p>
        </div>

        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-xl">
          <p className="font-label-mono text-[10px] text-outline uppercase mb-2">Posts</p>
          <h3 className="font-headline-md text-2xl font-bold text-white">1,248</h3>
          <p className="text-[10px] text-tertiary font-bold mt-2">Active Feed</p>
        </div>

        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-xl">
          <p className="font-label-mono text-[10px] text-outline uppercase mb-2">Pending</p>
          <h3 className="font-headline-md text-2xl font-bold text-secondary">
            {verificationQueue.length}
          </h3>
          <p className="text-[10px] text-secondary font-bold mt-2">Verifications</p>
        </div>

        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-xl">
          <p className="font-label-mono text-[10px] text-outline uppercase mb-2">Reports</p>
          <h3 className="font-headline-md text-2xl font-bold text-error">{reports.length}</h3>
          <p className="text-[10px] text-error font-bold mt-2">Moderation</p>
        </div>

        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-xl">
          <p className="font-label-mono text-[10px] text-outline uppercase mb-2">Live Users</p>
          <h3 className="font-headline-md text-2xl font-bold text-tertiary">186</h3>
          <p className="text-[10px] text-tertiary font-bold mt-2">Online Now</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Table */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="font-headline-md text-xl font-bold text-white border-l-4 border-primary pl-3">
            User Management
          </h4>

          <div className="bg-surface-container border-2 border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left font-label-mono text-xs">
              <thead className="bg-surface-container-high border-b border-outline-variant text-outline uppercase">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">College</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y border-outline-variant/30 text-white">
                <tr className="hover:bg-surface-container-highest/50">
                  <td className="p-4 font-bold">Rahul Sharma</td>
                  <td className="p-4 text-primary">Senior Mentor</td>
                  <td className="p-4 text-outline">Stanford CS</td>
                  <td className="p-4">
                    <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-outline hover:text-white p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-highest/50">
                  <td className="p-4 font-bold">Alex Rivera</td>
                  <td className="p-4 text-secondary">Student</td>
                  <td className="p-4 text-outline">Stanford CS</td>
                  <td className="p-4">
                    <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-outline hover:text-white p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-highest/50">
                  <td className="p-4 font-bold">Dr. Aruna V.</td>
                  <td className="p-4 text-tertiary">Faculty</td>
                  <td className="p-4 text-outline">MIT EECS</td>
                  <td className="p-4">
                    <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-outline hover:text-white p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification Queue & Moderation */}
        <div className="space-y-6">
          {/* Queue */}
          <div className="space-y-3">
            <h4 className="font-headline-md text-xl font-bold text-white border-l-4 border-secondary pl-3">
              Verification Queue ({verificationQueue.length})
            </h4>

            {verificationQueue.length === 0 ? (
              <p className="text-xs text-outline font-label-mono p-4 bg-surface-container rounded-xl border border-outline-variant">
                No pending verifications.
              </p>
            ) : (
              verificationQueue.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container border-2 border-outline-variant rounded-xl p-4 space-y-3"
                >
                  <div>
                    <p className="font-bold text-white text-sm">{item.name}</p>
                    <p className="text-xs text-secondary font-label-mono">{item.roleRequest}</p>
                    <p className="text-[10px] text-outline font-label-mono">{item.college}</p>
                  </div>

                  <div className="flex gap-2 font-label-mono text-xs">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex-1 py-1.5 bg-tertiary text-on-tertiary font-bold rounded flex items-center justify-center gap-1 hover:brightness-110"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="flex-1 py-1.5 bg-surface-container-lowest border border-outline-variant text-outline rounded flex items-center justify-center gap-1 hover:text-error hover:border-error"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Moderation */}
          <div className="space-y-3">
            <h4 className="font-headline-md text-xl font-bold text-white border-l-4 border-error pl-3">
              Moderation Reports ({reports.length})
            </h4>

            {reports.length === 0 ? (
              <p className="text-xs text-outline font-label-mono p-4 bg-surface-container rounded-xl border border-outline-variant">
                No active moderation reports.
              </p>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-surface-container border-2 border-outline-variant rounded-xl p-4 space-y-2"
                >
                  <div className="flex justify-between items-center text-error font-label-mono text-[10px] uppercase font-bold">
                    <span>{rep.id}</span>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-bold text-white text-xs">{rep.title}</p>
                  <p className="text-[11px] text-outline italic">{rep.content}</p>

                  <div className="flex gap-2 pt-1 font-label-mono text-[10px] uppercase">
                    <button
                      onClick={() => handleDismissReport(rep.id)}
                      className="px-3 py-1 bg-surface-container-highest border border-outline-variant rounded text-outline hover:text-white"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleDismissReport(rep.id)}
                      className="px-3 py-1 bg-error text-on-error rounded font-bold"
                    >
                      Remove Post
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Terminal Live Stream */}
      <section className="space-y-3">
        <h4 className="font-label-mono text-xs uppercase text-outline tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span>Live Terminal Stream</span>
        </h4>

        <div className="bg-surface-container-lowest border-2 border-outline-variant p-5 rounded-xl font-label-mono text-xs text-primary/70 h-36 overflow-hidden space-y-1">
          <p>[09:24:12] SUCCESS: Database synchronization complete (0.042ms)</p>
          <p>[09:24:15] INFO: New user registration request from Google OAuth</p>
          <p>[09:24:18] INFO: Task #2 completed by user_alex (+50 REP awarded)</p>
          <p>[09:25:01] INFO: Weekly analytics report generated and verified</p>
          <p>[09:25:05] SUCCESS: Load balancer health check: 100% Availability</p>
          <p className="text-secondary">[09:25:12] TRACE: Express server listening on port 3000</p>
        </div>
      </section>
    </div>
  );
};
