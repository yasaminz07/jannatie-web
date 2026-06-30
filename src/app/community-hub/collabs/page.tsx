"use client";

import { Handshake } from "lucide-react";

export default function CommunityCollabsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Collabs</h1>
      <p className="text-slate-500 text-sm mb-8">Connect with other communities to collaborate.</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
        <Handshake size={28} className="text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Collaboration requests are coming soon.</p>
      </div>
    </div>
  );
}
