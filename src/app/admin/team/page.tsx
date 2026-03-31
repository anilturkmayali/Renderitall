"use client";

import { useState, useEffect } from "react";
import {
  Users, Plus, Loader2, Trash2, Shield, PenTool, User, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null };
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    setLoading(true);
    const res = await fetch("/api/admin/team");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
      setCurrentUserRole(data.currentUserRole || "");
    }
    setLoading(false);
  }

  const canManage = ["OWNER", "ADMIN"].includes(currentUserRole);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setError("");
    setInviting(true);
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to invite");
    } else {
      setShowInvite(false);
      setInviteEmail("");
      loadTeam();
    }
    setInviting(false);
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    await fetch(`/api/admin/team/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    loadTeam();
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return;
    const res = await fetch(`/api/admin/team/${memberId}`, { method: "DELETE" });
    if (res.ok) loadTeam();
    else alert((await res.json()).error || "Failed");
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage who has access to the admin panel.</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowInvite(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Member
          </Button>
        )}
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <p className="text-xs text-muted-foreground">Full access. Can manage team members, sites, repos, content, and all settings.</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <PenTool className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold">Editor</span>
          </div>
          <p className="text-xs text-muted-foreground">Can edit content, manage repos, and design sites. Cannot manage team or delete sites.</p>
        </div>
      </div>

      {/* Members list */}
      <Card>
        <CardHeader className="py-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {members.map((member) => {
            const isOwner = member.role === "OWNER";
            const isSelf = member.userId === members.find(m => m.role === "OWNER")?.userId && isOwner;

            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                {member.user.image ? (
                  <img src={member.user.image} alt="" className="h-10 w-10 rounded-full border" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{member.user.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email || "No email"}</p>
                </div>

                {canManage && !isOwner ? (
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs font-medium"
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {isOwner ? "Owner" : member.role === "ADMIN" ? "Admin" : "Editor"}
                  </Badge>
                )}

                {canManage && !isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(member.id, member.user.name || "this member")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl mx-4">
            <h2 className="text-lg font-bold mb-1">Add Team Member</h2>
            <p className="text-sm text-muted-foreground mb-5">
              The user must have already signed in with GitHub at least once.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10 h-10"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInviteRole("ADMIN")}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${inviteRole === "ADMIN" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-blue-600" /><span className="text-sm font-semibold">Admin</span></div>
                    <p className="text-xs text-muted-foreground">Full management access</p>
                  </button>
                  <button
                    onClick={() => setInviteRole("EDITOR")}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${inviteRole === "EDITOR" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <div className="flex items-center gap-2 mb-1"><PenTool className="h-4 w-4 text-green-600" /><span className="text-sm font-semibold">Editor</span></div>
                    <p className="text-xs text-muted-foreground">Edit content and design</p>
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowInvite(false); setError(""); }}>Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add to Team
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
