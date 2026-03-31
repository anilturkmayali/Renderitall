"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, Check, Plus, Trash2, Github, GitBranch,
  FolderOpen, FileText, Search, RefreshCw, GripVertical, ChevronUp,
  ChevronDown, FolderGit2, Lock, Star, X, ExternalLink, PenTool,
  Eye, Palette, Settings, Globe, CornerDownRight, CornerUpLeft,
  Link2, Upload, ImageIcon, Monitor, Smartphone, Tablet, Home,
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
  const [pageSearch, setPageSearch] = useState("");
  const [homepageId, setHomepageId] = useState<string | null>(null);

  // Sidebar Menu
  const [navDirty, setNavDirty] = useState(false);
  const [navSaving, setNavSaving] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [addTarget, setAddTarget] = useState<number|null>(null);
  const [addType, setAddType] = useState<"github"|"custom"|"section"|"link">("github");
  const [addRepoId, setAddRepoId] = useState("");
  const [addPageId, setAddPageId] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");

  // Top Bar Menu
  interface TopMenuItem { label: string; url?: string; repoId?: string; children?: TopMenuItem[] }
  const [topMenu, setTopMenu] = useState<TopMenuItem[]>([]);
  const [topMenuDirty, setTopMenuDirty] = useState(false);
  const [topMenuSaving, setTopMenuSaving] = useState(false);
  const [showTopMenuAdd, setShowTopMenuAdd] = useState(false);
  const [topAddLabel, setTopAddLabel] = useState("");
  const [topAddUrl, setTopAddUrl] = useState("");
  const [topAddPageId, setTopAddPageId] = useState("");
  const [topAddType, setTopAddType] = useState<"repo"|"page"|"link"|"dropdown">("repo");
  const [topAddRepoId, setTopAddRepoId] = useState("");
  const [topEditDropdown, setTopEditDropdown] = useState<number|null>(null); // index of dropdown being edited

  // Appearance
  const [form, setForm] = useState({
    primaryColor: "#3b82f6", accentColor: "", defaultTheme: "SYSTEM", headerLayout: "default",
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
    const [sRes, rRes, pRes, nRes, tmRes] = await Promise.all([
      fetch(`/api/admin/spaces/${id}`),
      fetch("/api/admin/repos"), // still needed for menu add-item repo dropdown
      fetch("/api/admin/pages"),
      fetch(`/api/admin/nav/${id}`),
      fetch(`/api/admin/spaces/${id}/topmenu`),
    ]);
    if (tmRes.ok) setTopMenu(await tmRes.json());
    if (sRes.ok) {
      const s = await sRes.json();
      setSpace(s);
      setForm({ primaryColor: s.primaryColor||"#3b82f6", accentColor: s.accentColor||"", defaultTheme: s.defaultTheme||"SYSTEM", headerLayout: s.headerLayout||"default" });
      setSettings({ name: s.name||"", slug: s.slug||"", description: s.description||"", isPublic: s.isPublic!==false, seoTitle: s.seoTitle||"", seoDescription: s.seoDescription||"", customCss: s.customCss||"" });
      setLogo(s.org?.logo || null);
      setHomepageId(s.icon || null); // icon field stores homepage ID
    }
    if (rRes.ok) setRepos(await rRes.json());
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

  async function setHomepage(pageId: string | null) {
    setHomepageId(pageId);
    // Save to Space.icon field
    await fetch(`/api/admin/spaces/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon: pageId }),
    });
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

  // ─── Top Menu actions ───────────────────────────────────────────

  async function saveTopMenu() {
    setTopMenuSaving(true);
    await fetch(`/api/admin/spaces/${id}/topmenu`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: topMenu }),
    });
    setTopMenuDirty(false);
    setTopMenuSaving(false);
    setPreviewKey(k => k + 1);
  }

  function addTopMenuItem() {
    let item: TopMenuItem | null = null;

    if (topAddType === "repo" && topAddRepoId) {
      const repo = repos.find(r => r.id === topAddRepoId);
      if (repo) {
        const repoSlug = (repo as any).slug || repo.repo.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        item = { label: (repo as any).displayName || repo.repo, repoId: repo.id, url: `/docs/${space?.slug}/${repoSlug}` };
      }
    } else if (topAddType === "page" && topAddPageId) {
      const page = pages.find(p => p.id === topAddPageId);
      if (page) item = { label: page.title, url: `/docs/${space?.slug}/${page.slug}` };
    } else if (topAddType === "link" && topAddLabel && topAddUrl) {
      item = { label: topAddLabel, url: topAddUrl };
    } else if (topAddType === "dropdown" && topAddLabel) {
      item = { label: topAddLabel, children: [] };
    }

    if (!item) return;

    // If editing a dropdown's children, add there
    if (topEditDropdown !== null && topMenu[topEditDropdown]?.children) {
      const updated = [...topMenu];
      updated[topEditDropdown] = { ...updated[topEditDropdown], children: [...(updated[topEditDropdown].children || []), item] };
      setTopMenu(updated);
    } else {
      setTopMenu([...topMenu, item]);
    }
    setTopMenuDirty(true);
    setShowTopMenuAdd(false);
    setTopEditDropdown(null);
    setTopAddLabel(""); setTopAddUrl(""); setTopAddPageId(""); setTopAddRepoId("");
  }

  function removeTopMenuItem(index: number) {
    setTopMenu(topMenu.filter((_, i) => i !== index));
    setTopMenuDirty(true);
  }

  function moveTopMenuItem(index: number, dir: "up" | "down") {
    const items = [...topMenu];
    const t = dir === "up" ? index - 1 : index + 1;
    if (t < 0 || t >= items.length) return;
    [items[index], items[t]] = [items[t], items[index]];
    setTopMenu(items);
    setTopMenuDirty(true);
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
          {/* Available Pages — from all repos + custom pages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Available Content ({pages.length} pages)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All imported repository pages and custom pages. Use Menu tab to add them to your site.</p>
              </div>
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
                  {homepageId===p.id ? (
                    <Badge variant="success" className="text-[10px] gap-1 cursor-pointer" onClick={()=>setHomepage(null)}><Home className="h-3 w-3" />Homepage</Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100" onClick={()=>setHomepage(p.id)}><Home className="mr-1 h-3 w-3" />Set as Home</Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={()=>delPage(p.id,p.title)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div></CardContent></Card>
          </div>
        </div>
      )}

      {/* ━━━ MENU TAB ━━━ */}
      {tab==="menu" && (
        <div className="space-y-6">

          {/* ── TOP BAR MENU ── */}
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base">Top Bar Menu</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={()=>{setTopAddType("page");setShowTopMenuAdd(true)}}><Plus className="mr-1.5 h-3.5 w-3.5" />Add Item</Button>
                {topMenuDirty && <Button size="sm" onClick={saveTopMenu} disabled={topMenuSaving}>{topMenuSaving?<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />:<Save className="mr-1.5 h-3.5 w-3.5" />}Save Top Menu</Button>}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-3">These links appear horizontally in the header bar of your site.</p>
              {topMenu.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground text-sm">No top bar items. Click &quot;Add Item&quot; to add repos, pages, links, or dropdown menus.</div>
              ) : (
                <div className="space-y-1">
                  {topMenu.map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3 rounded border px-3 py-2">
                        {item.repoId ? <Github className="h-4 w-4 text-muted-foreground shrink-0" /> :
                         item.children ? <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" /> :
                         <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-sm font-medium block truncate cursor-pointer hover:text-primary"
                            title="Click to rename"
                            onClick={() => {
                              const newName = prompt("Rename menu item:", item.label);
                              if (newName && newName.trim()) {
                                const updated = [...topMenu];
                                updated[i] = { ...updated[i], label: newName.trim() };
                                setTopMenu(updated);
                                setTopMenuDirty(true);
                              }
                            }}
                          >{item.label}</span>
                          {item.url && <span className="text-xs text-muted-foreground truncate block">{item.url}</span>}
                          {item.repoId && <span className="text-xs text-muted-foreground">Repository section</span>}
                          {item.children && <span className="text-xs text-muted-foreground">Dropdown · {item.children.length} items</span>}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {item.repoId ? "Repo" : item.children ? "Dropdown" : "Link"}
                        </Badge>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>moveTopMenuItem(i,"up")} disabled={i===0} title="Move up"><ChevronUp className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>moveTopMenuItem(i,"down")} disabled={i===topMenu.length-1} title="Move down"><ChevronDown className="h-3.5 w-3.5" /></Button>
                          {/* Indent: move this item into the one above as a sub-item */}
                          {!item.children && i > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Make sub-item of above" onClick={()=>{
                              // Find nearest item above that can accept children
                              for(let j=i-1;j>=0;j--){
                                const parent=topMenu[j];
                                // Move into this parent
                                const child={...topMenu[i]};
                                const updated=topMenu.filter((_,k)=>k!==i);
                                // Adjust index since we removed an item
                                const parentIdx=j;
                                if(updated[parentIdx].children){
                                  updated[parentIdx]={...updated[parentIdx],children:[...(updated[parentIdx].children||[]),child]};
                                } else {
                                  // Convert the parent into a dropdown
                                  updated[parentIdx]={...updated[parentIdx],children:[child]};
                                }
                                setTopMenu(updated);
                                setTopMenuDirty(true);
                                break;
                              }
                            }}><CornerDownRight className="h-3.5 w-3.5" /></Button>
                          )}
                          {item.children && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>{setTopEditDropdown(i);setShowTopMenuAdd(true)}} title="Add sub-item"><Plus className="h-3.5 w-3.5" /></Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={()=>removeTopMenuItem(i)} title="Remove"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {/* Dropdown children */}
                      {item.children && item.children.length > 0 && (
                        <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-muted pl-3">
                          {item.children.map((child, ci) => (
                            <div key={ci} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
                              {child.repoId ? <Github className="h-3 w-3 text-muted-foreground" /> : <Link2 className="h-3 w-3 text-muted-foreground" />}
                              <span
                                className="flex-1 truncate text-xs cursor-pointer hover:text-primary"
                                title="Click to rename"
                                onClick={() => {
                                  const newName = prompt("Rename:", child.label);
                                  if (newName && newName.trim()) {
                                    const updated = [...topMenu];
                                    const children = [...(updated[i].children || [])];
                                    children[ci] = { ...children[ci], label: newName.trim() };
                                    updated[i] = { ...updated[i], children };
                                    setTopMenu(updated);
                                    setTopMenuDirty(true);
                                  }
                                }}
                              >{child.label}</span>
                              {/* Outdent: move child out to top level */}
                              <Button variant="ghost" size="icon" className="h-5 w-5" title="Move to top level" onClick={()=>{
                                const childItem={...child};
                                const u=[...topMenu];
                                u[i]={...u[i],children:(u[i].children||[]).filter((_,j)=>j!==ci)};
                                // If parent has no more children, remove the children array
                                if(u[i].children&&u[i].children.length===0) { const {children:_,...rest}=u[i] as any; u[i]=rest; }
                                u.splice(i+1,0,childItem);
                                setTopMenu(u); setTopMenuDirty(true);
                              }}><CornerUpLeft className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500" title="Remove" onClick={()=>{
                                const u=[...topMenu]; u[i]={...u[i],children:(u[i].children||[]).filter((_,j)=>j!==ci)}; setTopMenu(u); setTopMenuDirty(true);
                              }}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Mini preview of how the top bar looks */}
              {topMenu.length > 0 && (
                <div className="mt-3 rounded-lg border overflow-hidden">
                  <div className="h-10 flex items-center px-4 gap-3 bg-muted/30">
                    <div className="h-5 w-5 rounded bg-primary/20" />
                    <span className="text-xs font-semibold text-muted-foreground">{space?.name}</span>
                    <div className="flex gap-1 ml-2">
                      {topMenu.map((item, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-background border">{item.label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Top Menu Item Modal */}
          {showTopMenuAdd && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-2xl mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Add to Top Bar</h3>
                  <button onClick={()=>setShowTopMenuAdd(false)}><X className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-4 p-1 bg-muted/50 rounded-lg">
                  {([
                    {id:"repo"as const, l:"Repository", ic:Github},
                    {id:"page"as const, l:"Page", ic:FileText},
                    {id:"dropdown"as const, l:"Dropdown", ic:FolderOpen},
                    {id:"link"as const, l:"Link", ic:Link2},
                  ]).map(t=>(
                    <button key={t.id} onClick={()=>setTopAddType(t.id)} className={`flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-all ${topAddType===t.id?"bg-background shadow-sm text-primary":"text-muted-foreground"}`}><t.ic className="h-4 w-4" />{t.l}</button>
                  ))}
                </div>
                {topEditDropdown !== null && <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-3">Adding sub-item to <strong>{topMenu[topEditDropdown]?.label}</strong></p>}
                <div className="space-y-3">
                  {topAddType === "repo" && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Repository</label>
                      <p className="text-xs text-muted-foreground mb-2">Adds a tab that shows this repo&apos;s content with its own sidebar navigation.</p>
                      <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={topAddRepoId} onChange={e=>setTopAddRepoId(e.target.value)}>
                        <option value="">Select repository...</option>
                        {repos.map(r=><option key={r.id} value={r.id}>{r.owner}/{r.repo} ({r._count.pages} pages)</option>)}
                      </select>
                      {repos.length===0 && <p className="text-xs text-amber-600 mt-1">No repos connected. Connect one in the Content tab first.</p>}
                    </div>
                  )}
                  {topAddType === "page" && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Page</label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={topAddPageId} onChange={e=>setTopAddPageId(e.target.value)}>
                        <option value="">Select page...</option>
                        {pages.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </div>
                  )}
                  {topAddType === "dropdown" && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Dropdown Label</label>
                      <p className="text-xs text-muted-foreground mb-2">Creates a menu item with a dropdown. Add sub-items after creating it.</p>
                      <Input value={topAddLabel} onChange={e=>setTopAddLabel(e.target.value)} placeholder="e.g. IDS Assets" className="h-10" autoFocus />
                    </div>
                  )}
                  {topAddType === "link" && (
                    <>
                      <div><label className="text-sm font-medium mb-1.5 block">Label</label><Input value={topAddLabel} onChange={e=>setTopAddLabel(e.target.value)} placeholder="Link text" className="h-10" /></div>
                      <div><label className="text-sm font-medium mb-1.5 block">URL</label><Input value={topAddUrl} onChange={e=>setTopAddUrl(e.target.value)} placeholder="https://..." className="h-10" /></div>
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <Button variant="outline" size="sm" onClick={()=>setShowTopMenuAdd(false)}>Cancel</Button>
                  <Button size="sm" onClick={addTopMenuItem}><Plus className="mr-1.5 h-3.5 w-3.5" />Add</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── SIDEBAR MENU ── */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sidebar Menu</h2>
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
                    <span
                      className={`text-sm flex-1 truncate cursor-pointer hover:text-primary ${item.type==="SECTION"?"font-semibold":""}`}
                      title="Click to rename"
                      onClick={()=>{
                        const newName=prompt("Rename:",item.label);
                        if(newName&&newName.trim()){const u=[...navItems];u[i]={...u[i],label:newName.trim()};setNavItems(u);setNavDirty(true);}
                      }}
                    >{item.label}</span>
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
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm flex-1 truncate cursor-pointer hover:text-primary" title="Click to rename" onClick={()=>{
                            const newName=prompt("Rename:",ch.label);
                            if(newName&&newName.trim()){const u=[...navItems];const children=[...u[i].children];children[ci]={...children[ci],label:newName.trim()};u[i]={...u[i],children};setNavItems(u);setNavDirty(true);}
                          }}>{ch.label}</span>
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
              <p className="text-xs text-muted-foreground">Your logo appears in the top-left of the docs header. Replaces the default icon.</p>
              {logo ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                    <div className="bg-white rounded p-2 border"><img src={logo} alt="Logo" className="h-10 w-auto max-w-[160px] object-contain" /></div>
                    <div className="bg-zinc-900 rounded p-2 border border-zinc-700"><img src={logo} alt="Logo" className="h-10 w-auto max-w-[160px] object-contain" /></div>
                    <Button variant="outline" size="sm" onClick={removeLogo}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Remove</Button>
                  </div>
                  <label className="text-xs text-primary cursor-pointer hover:underline inline-flex items-center gap-1">
                    <Upload className="h-3 w-3" />Upload different logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload logo</span>
                  <span className="text-xs text-muted-foreground">Recommended: 200 x 50px, PNG or SVG, max 2MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Template */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base">Layout Template</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Determines the positioning of sidebar, content area, and table of contents.</p>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t=>(
                  <button key={t.id} onClick={()=>setForm({...form,headerLayout:t.id})} className={`rounded-xl border-2 p-3 text-left transition-all ${form.headerLayout===t.id?"border-primary ring-2 ring-primary/20 bg-primary/5":"border-border hover:border-primary/40"}`}>
                    <div className="h-16 rounded-lg bg-muted/50 mb-2 flex p-2 gap-1 overflow-hidden">
                      {t.id==="default"&&<><div className="w-1/4 bg-primary/15 rounded-sm" /><div className="flex-1 flex flex-col gap-0.5 p-0.5"><div className="h-2 bg-primary/15 rounded-sm w-3/4" /><div className="h-1 bg-muted-foreground/10 rounded-sm" /><div className="h-1 bg-muted-foreground/10 rounded-sm w-5/6" /><div className="h-1 bg-muted-foreground/10 rounded-sm w-4/6" /></div><div className="w-1/6 bg-muted-foreground/5 rounded-sm" /></>}
                      {t.id==="modern"&&<div className="flex-1 flex flex-col gap-0.5"><div className="h-5 bg-primary/15 rounded-sm w-full" /><div className="flex gap-1 flex-1"><div className="w-1/4 bg-muted-foreground/5 rounded-sm" /><div className="flex-1 flex flex-col gap-0.5 p-0.5"><div className="h-1 bg-muted-foreground/10 rounded-sm w-3/4" /><div className="h-1 bg-muted-foreground/10 rounded-sm" /></div></div></div>}
                      {t.id==="minimal"&&<div className="flex-1 flex flex-col items-center gap-0.5 pt-2"><div className="h-2 bg-primary/15 rounded-sm w-2/5" /><div className="h-1 bg-muted-foreground/10 rounded-sm w-3/5" /><div className="h-1 bg-muted-foreground/10 rounded-sm w-2/5" /><div className="h-1 bg-muted-foreground/10 rounded-sm w-3/5" /></div>}
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
            <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Colors</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Primary Color</label>
                <p className="text-xs text-muted-foreground mb-2">Used for links, active states, sidebar highlights, and default icon color.</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {COLORS.map(c=><button key={c.n} onClick={()=>setForm({...form,primaryColor:c.v})} className={`h-8 w-8 rounded-full border-2 transition-all ${form.primaryColor===c.v?"border-foreground scale-110 ring-2 ring-offset-2 ring-primary/30":"border-transparent hover:scale-105"}`} style={{backgroundColor:c.v}} title={c.n} />)}
                  <input type="color" value={form.primaryColor} onChange={e=>setForm({...form,primaryColor:e.target.value})} className="h-8 w-8 rounded border cursor-pointer ml-1" />
                  <span className="text-xs text-muted-foreground font-mono ml-1">{form.primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Header Background</label>
                <p className="text-xs text-muted-foreground mb-2">Set a color to create a branded header bar. Leave empty for default (white/dark based on theme).</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <button onClick={()=>setForm({...form,accentColor:""})} className={`h-8 px-3 rounded-full border-2 text-xs font-medium transition-all ${!form.accentColor?"border-foreground ring-2 ring-offset-2 ring-primary/30":"border-border hover:border-primary/30"}`}>Default</button>
                  {COLORS.map(c=><button key={c.n} onClick={()=>setForm({...form,accentColor:c.v})} className={`h-8 w-8 rounded-full border-2 transition-all ${form.accentColor===c.v?"border-foreground scale-110 ring-2 ring-offset-2 ring-primary/30":"border-transparent hover:scale-105"}`} style={{backgroundColor:c.v}} title={c.n} />)}
                  {form.accentColor && <input type="color" value={form.accentColor} onChange={e=>setForm({...form,accentColor:e.target.value})} className="h-8 w-8 rounded border cursor-pointer ml-1" />}
                  {form.accentColor && <span className="text-xs text-muted-foreground font-mono ml-1">{form.accentColor}</span>}
                </div>
                {/* Header preview */}
                {form.accentColor && (
                  <div className="mt-3 rounded-lg border overflow-hidden">
                    <div className="h-10 flex items-center px-4 gap-2" style={{backgroundColor:form.accentColor}}>
                      {logo ? <img src={logo} alt="" className="h-5 w-auto object-contain" /> : <div className="h-5 w-5 rounded bg-white/20" />}
                      <span className="text-white text-xs font-semibold">{space?.name || "Your Site"}</span>
                      <div className="ml-auto flex gap-2"><div className="h-4 w-16 rounded bg-white/15" /><div className="h-4 w-4 rounded bg-white/15" /></div>
                    </div>
                    <div className="h-6 bg-muted/30" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-base">Default Theme</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">The default color scheme visitors see. They can still toggle it.</p>
              <div className="flex gap-2">
                {[{id:"LIGHT",l:"Light",desc:"White background"},{id:"DARK",l:"Dark",desc:"Dark background"},{id:"SYSTEM",l:"Auto",desc:"Follow device setting"}].map(t=>(
                  <button key={t.id} onClick={()=>setForm({...form,defaultTheme:t.id})} className={`rounded-xl border-2 px-4 py-3 text-left transition-all flex-1 ${form.defaultTheme===t.id?"border-primary bg-primary/5":"border-border hover:border-primary/30"}`}>
                    <p className="text-sm font-semibold">{t.l}</p>
                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveAppearance} disabled={formSaving} className="w-full" size="lg">
            {formSaved?<><Check className="mr-2 h-4 w-4" />Saved!</>:formSaving?<Loader2 className="mr-2 h-4 w-4 animate-spin" />:<><Save className="mr-2 h-4 w-4" />Save All Appearance Changes</>}
          </Button>
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

/* eslint-disable */
function _Unused({spaceId,onClose,onDone}:{spaceId:string;onClose:()=>void;onDone:()=>void}) {
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
      <div className="w-full max-w-2xl rounded-xl border bg-background shadow-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold">Connect Repository</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {!selected ? <>
          {/* Org tabs */}
          {orgs.length>0 && (
            <div className="px-6 pb-3 shrink-0">
              <div className="flex gap-2 p-1 rounded-lg bg-muted/50 overflow-x-auto">
                <button onClick={()=>setSelectedOrg("")} className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${selectedOrg===""?"bg-background shadow-sm text-primary":"text-muted-foreground hover:text-foreground"}`}>All Repos</button>
                {orgs.map(o=><button key={o.login} onClick={()=>setSelectedOrg(o.login)} className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${selectedOrg===o.login?"bg-background shadow-sm text-primary":"text-muted-foreground hover:text-foreground"}`}>{o.login}</button>)}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-6 pb-3 shrink-0">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={selectedOrg?`Search ${selectedOrg} repos...`:"Search all repositories..."} value={ghSearch} onChange={e=>setGhSearch(e.target.value)} className="pl-10" autoFocus /></div>
          </div>
          <div className="flex-1 overflow-y-auto border-t min-h-0">
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
        </> : <div className="space-y-4 p-6">
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
