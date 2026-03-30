"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, Check, Plus, Trash2, Github, GitBranch,
  FolderOpen, FileText, Search, RefreshCw, GripVertical, ChevronUp,
  ChevronDown, FolderGit2, Lock, Star, X, ExternalLink, PenTool,
  Eye, Palette, Settings, Globe, CornerDownRight, CornerUpLeft,
  Link2, Upload, ImageIcon, Monitor, Smartphone, Tablet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Space {
  id: string; name: string; slug: string; description: string | null;
  isPublic: boolean; primaryColor: string | null; accentColor: string | null;
  defaultTheme: string; headerLayout: string | null; customDomain: string | null;
  seoTitle: string | null; seoDescription: string | null; customCss: string | null;
  org: { name: string; logo: string | null; logoDark: string | null } | null;
}
interface Repo {
  id: string; owner: string; repo: string; branch: string; docsPath: string;
  spaceId: string; lastSyncAt: string | null; lastSyncStatus: string;
  lastSyncError: string | null; _count: { pages: number };
}
interface PageItem {
  id: string; title: string; slug: string; source: string;
  githubRepoId: string | null; status: string;
}
interface NavItem {
  id?: string; label: string; type: "PAGE"|"SECTION"|"LINK";
  pageId: string|null; url: string|null; children: NavItem[];
}
interface GHRepo {
  id: number; fullName: string; owner: string; name: string;
  description: string|null; defaultBranch: string; isPrivate: boolean;
  language: string|null; stargazersCount: number;
}

const COLORS = [
  { n: "Blue", v: "#3b82f6" }, { n: "Green", v: "#10b981" },
  { n: "Purple", v: "#8b5cf6" }, { n: "Orange", v: "#f97316" },
  { n: "Teal", v: "#0d9488" }, { n: "Rose", v: "#f43f5e" },
];
const TEMPLATES = [
  { id: "default", name: "Classic", desc: "Sidebar + content + TOC" },
  { id: "modern", name: "Modern", desc: "Full-width hero sections" },
  { id: "minimal", name: "Minimal", desc: "Centered, content-focused" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SiteDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [space, setSpace] = useState<Space | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"content"|"menu"|"appearance"|"settings">("content");

  // Content
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const [pageSearch, setPageSearch] = useState("");

  // Menu
  const [navDirty, setNavDirty] = useState(false);
  const [navSaving, setNavSaving] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [addTarget, setAddTarget] = useState<number|null>(null);
  const [addType, setAddType] = useState<"github"|"custom"|"section"|"link">("github");
  const [addRepoId, setAddRepoId] = useState("");
  const [addPageId, setAddPageId] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");

  // Appearance
  const [form, setForm] = useState({
    primaryColor: "#3b82f6", defaultTheme: "SYSTEM", headerLayout: "default",
  });
  const [logo, setLogo] = useState<string|null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formSaved, setFormSaved] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    name: "", slug: "", description: "", isPublic: true,
    seoTitle: "", seoDescription: "", customCss: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [domainAdding, setDomainAdding] = useState(false);
  const [domainInstr, setDomainInstr] = useState<any>(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop"|"tablet"|"mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  // ─── Load ──────────────────────────────────────────────────────

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    setLoading(true);
    const [sRes, rRes, pRes, nRes] = await Promise.all([
      fetch(`/api/admin/spaces/${id}`),
      fetch("/api/admin/repos"),
      fetch(`/api/admin/pages?spaceId=${id}`),
      fetch(`/api/admin/nav/${id}`),
    ]);
    if (sRes.ok) {
      const s = await sRes.json();
      setSpace(s);
      setForm({ primaryColor: s.primaryColor||"#3b82f6", defaultTheme: s.defaultTheme||"SYSTEM", headerLayout: s.headerLayout||"default" });
      setSettings({ name: s.name||"", slug: s.slug||"", description: s.description||"", isPublic: s.isPublic!==false, seoTitle: s.seoTitle||"", seoDescription: s.seoDescription||"", customCss: s.customCss||"" });
      setLogo(s.org?.logo || null);
    }
    if (rRes.ok) setRepos((await rRes.json()).filter((r:any) => r.spaceId === id));
    if (pRes.ok) setPages(await pRes.json());
    if (nRes.ok) setNavItems((await nRes.json()).map(mapNav));
    setLoading(false);
  }

  function mapNav(i:any): NavItem {
    return { id:i.id, label:i.label, type:i.type, pageId:i.pageId, url:i.url, children:(i.children||[]).map(mapNav) };
  }

  // ─── Computed ──────────────────────────────────────────────────

  const ghByRepo = useMemo(() => {
    const m = new Map<string,PageItem[]>();
    pages.filter(p=>p.source==="GITHUB"&&p.githubRepoId).forEach(p => {
      const a = m.get(p.githubRepoId!)||[]; a.push(p); m.set(p.githubRepoId!, a);
    });
    return m;
  }, [pages]);

  const customPages = useMemo(() => pages.filter(p=>p.source==="NATIVE"), [pages]);

  const inNav = useMemo(() => {
    const s = new Set<string>();
    function c(items:NavItem[]) { items.forEach(i => { if(i.pageId) s.add(i.pageId); c(i.children); }); }
    c(navItems); return s;
  }, [navItems]);

  const filteredPages = useMemo(() => {
    if (!pageSearch) return pages;
    const q = pageSearch.toLowerCase();
    return pages.filter(p => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [pages, pageSearch]);

  // ─── Content actions ───────────────────────────────────────────

  async function syncRepo(rid:string) {
    setSyncing(s => new Set([...s,rid]));
    await fetch(`/api/admin/repos/${rid}/sync`, { method:"POST" });
    setSyncing(s => { const n=new Set(s); n.delete(rid); return n; });
    loadAll();
  }
  async function delRepo(rid:string) {
    if (!confirm("Remove this repo and all its synced pages?")) return;
    await fetch(`/api/admin/repos/${rid}`, { method:"DELETE" });
    loadAll();
  }
  async function delPage(pid:string, title:string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/pages/${pid}`, { method:"DELETE" });
    setPages(pages.filter(p=>p.id!==pid));
  }

  // ─── Menu actions ──────────────────────────────────────────────

  function openAdd(parentIdx:number|null) {
    setAddTarget(parentIdx); setAddType("github"); setAddRepoId(repos[0]?.id||"");
    setAddPageId(""); setAddLabel(""); setAddUrl(""); setAddModal(true);
  }

  function doAdd() {
    let item: NavItem|null = null;
    if (addType==="section") { if(!addLabel.trim()) return; item={label:addLabel,type:"SECTION",pageId:null,url:null,children:[]}; }
    else if (addType==="link") { if(!addLabel.trim()||!addUrl.trim()) return; item={label:addLabel,type:"LINK",pageId:null,url:addUrl,children:[]}; }
    else { if(!addPageId) return; const p=pages.find(p=>p.id===addPageId); if(!p) return; item={label:p.title,type:"PAGE",pageId:p.id,url:null,children:[]}; }
    if(!item) return;
    if (addTarget!==null && navItems[addTarget]?.type==="SECTION") {
      const u=[...navItems]; u[addTarget]={...u[addTarget],children:[...u[addTarget].children,item]}; setNavItems(u);
    } else { setNavItems([...navItems,item]); }
    setNavDirty(true); setAddModal(false);
  }

  function addAllRepo(rid:string) {
    const repo = repos.find(r=>r.id===rid);
    const rPages = (ghByRepo.get(rid)||[]).filter(p=>!inNav.has(p.id));
    if(!rPages.length) return;
    const section:NavItem = {
      label: repo?`${repo.owner}/${repo.repo}`:"Imported", type:"SECTION", pageId:null, url:null,
      children: rPages.map(p=>({label:p.title,type:"PAGE"as const,pageId:p.id,url:null,children:[]}))
    };
    setNavItems([...navItems,section]); setNavDirty(true);
  }

  function rmNav(i:number) { setNavItems(navItems.filter((_,j)=>j!==i)); setNavDirty(true); }
  function rmChild(pi:number,ci:number) { const u=[...navItems]; u[pi]={...u[pi],children:u[pi].children.filter((_,j)=>j!==ci)}; setNavItems(u); setNavDirty(true); }

  function moveNav(i:number,dir:"up"|"down") {
    const items=[...navItems]; const t=dir==="up"?i-1:i+1; if(t<0||t>=items.length) return;
    [items[i],items[t]]=[items[t],items[i]]; setNavItems(items); setNavDirty(true);
  }
  function moveChild(pi:number,ci:number,dir:"up"|"down") {
    const u=[...navItems]; const ch=[...u[pi].children]; const t=dir==="up"?ci-1:ci+1;
    if(t<0||t>=ch.length) return; [ch[ci],ch[t]]=[ch[t],ch[ci]]; u[pi]={...u[pi],children:ch}; setNavItems(u); setNavDirty(true);
  }
  function indent(i:number) {
    for (let j=i-1;j>=0;j--) { if(navItems[j].type==="SECTION") {
      const item={...navItems[i]}; const u=navItems.filter((_,k)=>k!==i);
      u[j]={...u[j],children:[...u[j].children,item]}; setNavItems(u); setNavDirty(true); return;
    }}
  }
  function outdent(pi:number,ci:number) {
    const child=navItems[pi].children[ci]; const u=[...navItems];
    u[pi]={...u[pi],children:u[pi].children.filter((_,j)=>j!==ci)};
    u.splice(pi+1,0,child); setNavItems(u); setNavDirty(true);
  }

  async function saveNav() {
    setNavSaving(true);
    function strip(i:NavItem):any { return {label:i.label,type:i.type,pageId:i.pageId,url:i.url,children:i.children.map(strip)}; }
    const res = await fetch(`/api/admin/nav/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({items:navItems.map(strip)}) });
    if(res.ok) { setNavItems((await res.json()).map(mapNav)); setNavDirty(false); setPreviewKey(k=>k+1); }
    setNavSaving(false);
  }

  // ─── Appearance actions ────────────────────────────────────────

  async function saveAppearance() {
    setFormSaving(true);
    await fetch(`/api/admin/spaces/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setFormSaved(true); setTimeout(()=>setFormSaved(false),2000); setFormSaving(false); setPreviewKey(k=>k+1);
  }

  function handleLogoUpload(e:React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if(!file) return;
    if(file.size > 2*1024*1024) { alert("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogo(dataUrl);
      await fetch(`/api/admin/spaces/${id}/logo`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({logo:dataUrl}) });
    };
    reader.readAsDataURL(file);
  }

  async function removeLogo() {
    await fetch(`/api/admin/spaces/${id}/logo`, { method:"DELETE" });
    setLogo(null);
  }

  // ─── Settings actions ──────────────────────────────────────────

  async function saveSettings() {
    setSettingsSaving(true);
    await fetch(`/api/admin/spaces/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(settings) });
    setSettingsSaved(true); setTimeout(()=>setSettingsSaved(false),2000); setSettingsSaving(false);
  }

  async function addDomain() {
    if(!domainInput.trim()) return; setDomainAdding(true);
    const res = await fetch("/api/admin/domains", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({spaceId:id,domain:domainInput}) });
    const data = await res.json();
    if(res.ok) { setSpace(s=>s?{...s,customDomain:domainInput.toLowerCase()}:s); setDomainInstr(data.instructions); setDomainInput(""); }
    setDomainAdding(false);
  }

  async function rmDomain() {
    if(!space?.customDomain||!confirm("Remove domain?")) return;
    await fetch("/api/admin/domains", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({spaceId:id,domain:space.customDomain}) });
    setSpace(s=>s?{...s,customDomain:null}:s); setDomainInstr(null);
  }

  async function deleteSite() {
    if(!confirm(`Delete "${space?.name}" and ALL content? Cannot be undone.`)) return;
    await fetch(`/api/admin/spaces/${id}`, { method:"DELETE" });
    router.push("/admin/spaces");
  }

  // ─── Render ────────────────────────────────────────────────────

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!space) return <div className="p-6 text-muted-foreground">Site not found</div>;

  const previewUrl = `/docs/${space.slug}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={()=>router.push("/admin/spaces")}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-3">
            {logo && <img src={logo} alt="" className="h-8 w-8 rounded object-contain" />}
            <div>
              <h1 className="text-xl font-bold">{space.name}</h1>
              <p className="text-xs text-muted-foreground">/docs/{space.slug} {space.customDomain && `· ${space.customDomain}`}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={showPreview?"default":"outline"} size="sm" onClick={()=>setShowPreview(!showPreview)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />{showPreview?"Hide Preview":"Preview"}
          </Button>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />View Live</Button>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {([
          { id:"content"as const, label:"Content", icon:FileText },
          { id:"menu"as const, label:"Menu", icon:GripVertical },
          { id:"appearance"as const, label:"Appearance", icon:Palette },
          { id:"settings"as const, label:"Settings", icon:Settings },
        ]).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===t.id?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ━━━ CONTENT TAB ━━━ */}
      {tab==="content" && (
        <div className="space-y-6">
          {/* Repos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Connected Repositories</h2>
              <Button size="sm" onClick={()=>setShowRepoModal(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Connect Repo</Button>
            </div>
            {repos.length===0 ? (
              <Card><CardContent className="py-8 text-center"><Github className="mx-auto h-8 w-8 mb-2 opacity-50" /><p className="text-sm text-muted-foreground">No repos connected.</p><Button size="sm" className="mt-3" onClick={()=>setShowRepoModal(true)}><Github className="mr-1.5 h-3.5 w-3.5" />Connect repo</Button></CardContent></Card>
            ) : (
              <div className="grid gap-2">{repos.map(r=>{const s=syncing.has(r.id); return (
                <Card key={r.id}><CardContent className="flex items-center gap-4 p-4">
                  <Github className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-medium text-sm">{r.owner}/{r.repo}</span><Badge variant={r.lastSyncStatus==="SUCCESS"?"success":r.lastSyncStatus==="ERROR"?"destructive":"secondary"} className="text-[10px]">{r._count.pages} pages</Badge></div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.branch} · {r.docsPath}{r.lastSyncAt&&` · ${new Date(r.lastSyncAt).toLocaleDateString()}`}</div>
                    {r.lastSyncError&&<p className="text-xs text-red-500 mt-1">{r.lastSyncError}</p>}
                  </div>
                  <Button variant="outline" size="sm" onClick={()=>syncRepo(r.id)} disabled={s}><RefreshCw className={`mr-1 h-3 w-3 ${s?"animate-spin":""}`} />{s?"Syncing":"Sync"}</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={()=>delRepo(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardContent></Card>
              );})}</div>
            )}
          </div>

          {/* Pages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Pages ({pages.length})</h2>
              <div className="flex gap-2">
                <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search..." value={pageSearch} onChange={e=>setPageSearch(e.target.value)} className="pl-8 h-8 w-48 text-sm" /></div>
                <Link href={`/admin/editor?spaceId=${id}`}><Button size="sm" variant="outline"><PenTool className="mr-1.5 h-3.5 w-3.5" />New Page</Button></Link>
              </div>
            </div>
            <Card><CardContent className="p-0"><div className="divide-y max-h-[350px] overflow-y-auto">
              {filteredPages.length===0 ? <div className="py-8 text-center text-muted-foreground text-sm">{pages.length===0?"No pages yet.":"No matches."}</div> : filteredPages.map(p=>(
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 group text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0"><span className="font-medium truncate block">{p.title}</span><span className="text-xs text-muted-foreground">/{p.slug}</span></div>
                  <Badge variant={p.source==="GITHUB"?"outline":"secondary"} className="text-[10px]">{p.source==="GITHUB"?"GitHub":"Custom"}</Badge>
                  {inNav.has(p.id)?<Badge variant="success" className="text-[10px]">In Menu</Badge>:null}
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={()=>delPage(p.id,p.title)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div></CardContent></Card>
          </div>
        </div>
      )}

      {/* ━━━ MENU TAB ━━━ */}
      {tab==="menu" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button size="sm" onClick={()=>openAdd(null)}><Plus className="mr-1.5 h-3.5 w-3.5" />Add Item</Button>
              {repos.length>0 && (
                <select className="h-8 rounded-md border border-input bg-transparent px-2 text-xs" defaultValue="" onChange={e=>{if(e.target.value){addAllRepo(e.target.value);e.target.value=""}}}>
                  <option value="">+ Add entire repo...</option>
                  {repos.map(r=><option key={r.id} value={r.id}>{r.owner}/{r.repo} ({r._count.pages})</option>)}
                </select>
              )}
            </div>
            {navDirty && <Button size="sm" onClick={saveNav} disabled={navSaving}>{navSaving?<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />:<Save className="mr-1.5 h-3.5 w-3.5" />}Save Menu</Button>}
          </div>

          <Card><CardContent className="p-0">
            {navItems.length===0 ? (
              <div className="py-10 text-center text-muted-foreground"><GripVertical className="mx-auto h-8 w-8 mb-2 opacity-50" /><p className="text-sm font-medium">No menu items</p><p className="text-xs mt-1">Click &quot;Add Item&quot; or &quot;Add entire repo&quot; to build your navigation.</p></div>
            ) : (
              <div className="divide-y">{navItems.map((item,i)=>(
                <div key={item.id||`n-${i}`}>
                  <div className={`flex items-center gap-3 px-4 py-3 ${item.type==="SECTION"?"bg-muted/30":""}`}>
                    {item.type==="SECTION"?<FolderOpen className="h-4 w-4 text-primary shrink-0" />:item.type==="LINK"?<Link2 className="h-4 w-4 text-muted-foreground shrink-0" />:<FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={`text-sm flex-1 truncate ${item.type==="SECTION"?"font-semibold":""}`}>{item.label}</span>
                    <Badge variant="outline" className="text-[10px]">{item.type==="SECTION"?"Section":item.type==="LINK"?"Link":"Page"}</Badge>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>moveNav(i,"up")} disabled={i===0}><ChevronUp className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>moveNav(i,"down")} disabled={i===navItems.length-1}><ChevronDown className="h-3.5 w-3.5" /></Button>
                      {item.type!=="SECTION"&&<Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>indent(i)} title="Move into section"><CornerDownRight className="h-3.5 w-3.5" /></Button>}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={()=>rmNav(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {item.type==="SECTION" && (
                    <div className="border-l-2 border-primary/20 ml-6">
                      {item.children.map((ch,ci)=>(
                        <div key={ch.id||`c-${ci}`} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0 hover:bg-muted/30">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="text-sm flex-1 truncate">{ch.label}</span>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>moveChild(i,ci,"up")} disabled={ci===0}><ChevronUp className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>moveChild(i,ci,"down")} disabled={ci===item.children.length-1}><ChevronDown className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>outdent(i,ci)} title="Move out"><CornerUpLeft className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={()=>rmChild(i,ci)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                      <button onClick={()=>openAdd(i)} className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-muted/30"><Plus className="h-3 w-3" />Add to &quot;{item.label}&quot;</button>
                    </div>
                  )}
                </div>
              ))}</div>
            )}
          </CardContent></Card>
        </div>
      )}

      {/* ━━━ APPEARANCE TAB ━━━ */}
      {tab==="appearance" && (
        <div className="space-y-6 max-w-2xl">
          {/* Logo */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" />Logo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {logo ? (
                <div className="flex items-center gap-4">
                  <img src={logo} alt="Logo" className="h-16 w-auto max-w-[200px] rounded border object-contain bg-white p-1" />
                  <Button variant="outline" size="sm" onClick={removeLogo}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload logo</span>
                  <span className="text-xs text-muted-foreground">Recommended: 200x50px, PNG or SVG, max 2MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Template */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base">Template</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t=>(
                  <button key={t.id} onClick={()=>setForm({...form,headerLayout:t.id})} className={`rounded-xl border-2 p-3 text-left transition-all ${form.headerLayout===t.id?"border-primary ring-2 ring-primary/20 bg-primary/5":"border-border hover:border-primary/40"}`}>
                    <div className="h-12 rounded bg-muted/50 mb-2 flex p-1.5 gap-1">
                      {t.id==="default"&&<><div className="w-1/4 bg-primary/10 rounded" /><div className="flex-1 flex flex-col gap-0.5"><div className="h-1.5 bg-primary/10 rounded w-3/4" /><div className="h-1 bg-muted rounded" /></div><div className="w-1/6 bg-muted rounded" /></>}
                      {t.id==="modern"&&<div className="flex-1 flex flex-col gap-0.5"><div className="h-4 bg-primary/10 rounded" /><div className="h-1 bg-muted rounded w-3/4 mx-auto" /></div>}
                      {t.id==="minimal"&&<div className="flex-1 flex flex-col items-center gap-0.5 pt-1"><div className="h-1.5 bg-primary/10 rounded w-1/2" /><div className="h-1 bg-muted rounded w-2/3" /></div>}
                    </div>
                    <p className="text-xs font-semibold">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Colors & Theme</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wider">Primary Color</label>
                <div className="flex gap-2 flex-wrap items-center">
                  {COLORS.map(c=><button key={c.n} onClick={()=>setForm({...form,primaryColor:c.v})} className={`h-8 w-8 rounded-full border-2 transition-all ${form.primaryColor===c.v?"border-foreground scale-110 ring-2 ring-offset-2 ring-primary/30":"border-transparent hover:scale-105"}`} style={{backgroundColor:c.v}} title={c.n} />)}
                  <input type="color" value={form.primaryColor} onChange={e=>setForm({...form,primaryColor:e.target.value})} className="h-8 w-8 rounded border cursor-pointer ml-1" />
                  <span className="text-xs text-muted-foreground font-mono ml-1">{form.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block text-muted-foreground uppercase tracking-wider">Theme</label>
                <div className="flex gap-2">
                  {[{id:"LIGHT",l:"Light"},{id:"DARK",l:"Dark"},{id:"SYSTEM",l:"Auto"}].map(t=>(
                    <button key={t.id} onClick={()=>setForm({...form,defaultTheme:t.id})} className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${form.defaultTheme===t.id?"border-primary bg-primary/5 text-primary":"border-border hover:border-primary/30"}`}>{t.l}</button>
                  ))}
                </div>
              </div>
              <Button onClick={saveAppearance} disabled={formSaving}>
                {formSaved?<><Check className="mr-2 h-4 w-4" />Saved!</>:formSaving?<Loader2 className="mr-2 h-4 w-4 animate-spin" />:<><Save className="mr-2 h-4 w-4" />Save Appearance</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ━━━ SETTINGS TAB ━━━ */}
      {tab==="settings" && (
        <div className="space-y-6 max-w-2xl">
          <Card><CardHeader><CardTitle>General</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-medium mb-1.5 block">Name</label><Input value={settings.name} onChange={e=>setSettings({...settings,name:e.target.value})} /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Slug</label><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">/docs/</span><Input value={settings.slug} onChange={e=>setSettings({...settings,slug:e.target.value})} /></div></div>
            </div>
            <div><label className="text-sm font-medium mb-1.5 block">Description</label><Input value={settings.description} onChange={e=>setSettings({...settings,description:e.target.value})} /></div>
            <Button onClick={saveSettings} disabled={settingsSaving}>{settingsSaved?<><Check className="mr-2 h-4 w-4" />Saved!</>:<><Save className="mr-2 h-4 w-4" />Save</>}</Button>
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Custom Domain</CardTitle></CardHeader><CardContent className="space-y-3">
            {space.customDomain ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div><p className="font-medium text-sm">{space.customDomain}</p><p className="text-xs text-muted-foreground">Active</p></div>
                <Button variant="ghost" size="sm" onClick={rmDomain} className="text-muted-foreground hover:text-destructive"><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
              </div>
            ) : (
              <div className="flex gap-2"><Input placeholder="docs.yourdomain.com" value={domainInput} onChange={e=>setDomainInput(e.target.value)} /><Button onClick={addDomain} disabled={domainAdding||!domainInput.trim()}>{domainAdding?<Loader2 className="mr-2 h-4 w-4 animate-spin" />:<Globe className="mr-2 h-4 w-4" />}Add</Button></div>
            )}
            {domainInstr && <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3 text-sm"><p className="font-medium mb-1">{domainInstr.message}</p><div className="font-mono text-xs bg-background rounded border p-2"><div>Type: <strong>{domainInstr.type}</strong></div><div>Name: <strong>{domainInstr.name}</strong></div><div>Value: <strong>{domainInstr.value}</strong></div></div></div>}
          </CardContent></Card>

          <Card><CardHeader><CardTitle>SEO</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><label className="text-sm font-medium mb-1.5 block">SEO Title</label><Input value={settings.seoTitle} onChange={e=>setSettings({...settings,seoTitle:e.target.value})} placeholder={settings.name} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">SEO Description</label><Input value={settings.seoDescription} onChange={e=>setSettings({...settings,seoDescription:e.target.value})} /></div>
            <Button onClick={saveSettings} disabled={settingsSaving}>{settingsSaved?"Saved!":"Save"}</Button>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Custom CSS</CardTitle></CardHeader><CardContent>
            <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono" placeholder="/* Custom styles */" value={settings.customCss} onChange={e=>setSettings({...settings,customCss:e.target.value})} />
            <Button onClick={saveSettings} disabled={settingsSaving} className="mt-3">{settingsSaved?"Saved!":"Save"}</Button>
          </CardContent></Card>

          <Card className="border-red-200 dark:border-red-900"><CardHeader><CardTitle className="text-red-600">Danger Zone</CardTitle></CardHeader><CardContent>
            <div className="flex items-center justify-between"><div><p className="font-medium text-sm">Delete this site</p><p className="text-xs text-muted-foreground">All pages, repos, navigation permanently deleted.</p></div>
            <Button variant="destructive" size="sm" onClick={deleteSite}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete Site</Button></div>
          </CardContent></Card>
        </div>
      )}

      {/* ━━━ PREVIEW ━━━ */}
      {showPreview && (
        <Card><CardHeader className="py-3 flex flex-row items-center justify-between border-b">
          <CardTitle className="text-base">Preview</CardTitle>
          <div className="flex gap-1">
            {([{id:"desktop"as const,icon:Monitor},{id:"tablet"as const,icon:Tablet},{id:"mobile"as const,icon:Smartphone}]).map(d=>(
              <Button key={d.id} variant={previewDevice===d.id?"default":"ghost"} size="sm" onClick={()=>setPreviewDevice(d.id)}><d.icon className="mr-1 h-3.5 w-3.5" />{d.id}</Button>
            ))}
            <Button variant="ghost" size="sm" onClick={()=>setPreviewKey(k=>k+1)}><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
          </div>
        </CardHeader><CardContent className="p-4">
          <div className="flex justify-center"><div className={`border rounded-xl overflow-hidden shadow-lg bg-white transition-all ${previewDevice==="desktop"?"w-full h-[500px]":previewDevice==="tablet"?"w-[768px] h-[500px]":"w-[375px] h-[500px]"}`}>
            <iframe key={previewKey} src={previewUrl} className="w-full h-full border-0" title="Preview" />
          </div></div>
        </CardContent></Card>
      )}

      {/* ━━━ REPO MODAL ━━━ */}
      {showRepoModal && <RepoModal spaceId={id} onClose={()=>setShowRepoModal(false)} onDone={()=>{setShowRepoModal(false);loadAll()}} />}

      {/* ━━━ ADD MENU MODAL ━━━ */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-5 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{addTarget!==null?`Add to "${navItems[addTarget]?.label}"`:"Add Menu Item"}</h3>
              <button onClick={()=>setAddModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-5 p-1 bg-muted/50 rounded-lg">
              {([{id:"github"as const,l:"Repo",ic:Github},{id:"custom"as const,l:"Custom",ic:PenTool},{id:"section"as const,l:"Section",ic:FolderOpen},{id:"link"as const,l:"Link",ic:Link2}]).map(t=>(
                <button key={t.id} onClick={()=>setAddType(t.id)} className={`flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-all ${addType===t.id?"bg-background shadow-sm text-primary":"text-muted-foreground"}`}><t.ic className="h-4 w-4" />{t.l}</button>
              ))}
            </div>
            <div className="space-y-4">
              {addType==="github"&&<><div><label className="text-sm font-medium mb-1.5 block">Repository</label><select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={addRepoId} onChange={e=>{setAddRepoId(e.target.value);setAddPageId("")}}><option value="">Select repo...</option>{repos.map(r=><option key={r.id} value={r.id}>{r.owner}/{r.repo} ({r._count.pages})</option>)}</select></div>{addRepoId&&<div><label className="text-sm font-medium mb-1.5 block">Page</label><select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={addPageId} onChange={e=>setAddPageId(e.target.value)}><option value="">Select page...</option>{(ghByRepo.get(addRepoId)||[]).map(p=><option key={p.id} value={p.id} disabled={inNav.has(p.id)}>{p.title}{inNav.has(p.id)?" (in menu)":""}</option>)}</select></div>}</>}
              {addType==="custom"&&<div><label className="text-sm font-medium mb-1.5 block">Page</label><select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={addPageId} onChange={e=>setAddPageId(e.target.value)}><option value="">Select page...</option>{customPages.map(p=><option key={p.id} value={p.id} disabled={inNav.has(p.id)}>{p.title}{inNav.has(p.id)?" (in menu)":""}</option>)}</select>{!customPages.length&&<p className="text-xs text-amber-600 mt-1">No custom pages. Create one in Pages.</p>}</div>}
              {addType==="section"&&<div><label className="text-sm font-medium mb-1.5 block">Section Name</label><Input value={addLabel} onChange={e=>setAddLabel(e.target.value)} placeholder="e.g. Getting Started" className="h-10" autoFocus /><p className="text-xs text-muted-foreground mt-1">Sections group items under a heading.</p></div>}
              {addType==="link"&&<><div><label className="text-sm font-medium mb-1.5 block">Label</label><Input value={addLabel} onChange={e=>setAddLabel(e.target.value)} placeholder="Link text" className="h-10" /></div><div><label className="text-sm font-medium mb-1.5 block">URL</label><Input value={addUrl} onChange={e=>setAddUrl(e.target.value)} placeholder="https://..." className="h-10" /></div></>}
            </div>
            <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={()=>setAddModal(false)}>Cancel</Button><Button onClick={doAdd}><Plus className="mr-1.5 h-4 w-4" />Add</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Repo Modal ──────────────────────────────────────────────────────────────

function RepoModal({spaceId,onClose,onDone}:{spaceId:string;onClose:()=>void;onDone:()=>void}) {
  const [ghRepos,setGhRepos]=useState<GHRepo[]>([]); const [ghSearch,setGhSearch]=useState(""); const [ghLoading,setGhLoading]=useState(true);
  const [selected,setSelected]=useState<GHRepo|null>(null); const [branch,setBranch]=useState(""); const [docsPath,setDocsPath]=useState("/");
  const [creating,setCreating]=useState(false); const [error,setError]=useState(""); const [orgs,setOrgs]=useState<{login:string}[]>([]);
  const [selectedOrg,setSelectedOrg]=useState(""); const timer=useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(()=>{fetchGH("","");fetch("/api/admin/github/account").then(r=>r.json()).then(d=>{if(d.organizations)setOrgs(d.organizations)}).catch(()=>{});},[]);
  useEffect(()=>{clearTimeout(timer.current);timer.current=setTimeout(()=>fetchGH(ghSearch,selectedOrg),300);return()=>clearTimeout(timer.current);},[ghSearch,selectedOrg]);

  async function fetchGH(q:string,org:string) {setGhLoading(true);const p=new URLSearchParams();if(q)p.set("q",q);if(org)p.set("org",org);const res=await fetch(`/api/admin/github/repos?${p}`);if(res.ok)setGhRepos(await res.json());setGhLoading(false);}
  async function connect() {if(!selected)return;setCreating(true);setError("");const res=await fetch("/api/admin/repos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({owner:selected.owner,repo:selected.name,branch:branch||selected.defaultBranch,docsPath,spaceId})});if(!res.ok){setError((await res.json()).error||"Failed");setCreating(false);return;}onDone();}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-2xl mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Connect Repository</h2><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        {!selected ? <>
          {orgs.length>0&&<div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            <button onClick={()=>setSelectedOrg("")} className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${selectedOrg===""?"border-primary bg-primary/10 text-primary":"hover:bg-muted"}`}>All</button>
            {orgs.map(o=><button key={o.login} onClick={()=>setSelectedOrg(o.login)} className={`rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${selectedOrg===o.login?"border-primary bg-primary/10 text-primary":"hover:bg-muted"}`}>{o.login}</button>)}
          </div>}
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={ghSearch} onChange={e=>setGhSearch(e.target.value)} className="pl-10" autoFocus /></div>
          <div className="flex-1 overflow-y-auto border rounded-lg min-h-0">
            {ghLoading?<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>:ghRepos.length===0?<div className="py-8 text-center text-sm text-muted-foreground"><p>No repos found.</p>{!orgs.length&&<p className="text-xs mt-2">Go to <strong>Settings</strong> to grant organization access.</p>}</div>:
            <div className="divide-y">{ghRepos.map(r=>(
              <button key={r.id} onClick={()=>{setSelected(r);setBranch(r.defaultBranch)}} className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-muted/50">
                <Github className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{r.fullName}</span>{r.isPrivate&&<Lock className="h-3 w-3 text-muted-foreground" />}</div>
                  {r.description&&<p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">{r.language&&<span>{r.language}</span>}{r.stargazersCount>0&&<span className="flex items-center gap-0.5"><Star className="h-3 w-3" />{r.stargazersCount}</span>}<span>{r.defaultBranch}</span></div>
                </div>
              </button>
            ))}</div>}
          </div>
        </> : <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"><Github className="h-5 w-5" /><span className="flex-1 font-medium text-sm">{selected.fullName}</span><Button variant="ghost" size="sm" onClick={()=>setSelected(null)}>Change</Button></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Branch</label><Input value={branch} onChange={e=>setBranch(e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Docs Path</label><Input value={docsPath} onChange={e=>setDocsPath(e.target.value)} placeholder="/" /></div>
          </div>
          {error&&<p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={connect} disabled={creating}>{creating?<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</>:<><FolderGit2 className="mr-2 h-4 w-4" />Connect & Sync</>}</Button></div>
        </div>}
      </div>
    </div>
  );
}
