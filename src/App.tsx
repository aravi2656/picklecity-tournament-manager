import { useState } from 'react'
import { Activity, CalendarDays, ClipboardList, Users, Trophy, Radio, Settings, Menu, Plus, ArrowUpRight } from 'lucide-react'
import { firebaseConfigured } from './firebase'

type Section = 'Overview' | 'Tournaments' | 'Players' | 'Teams' | 'Matches' | 'Live scoreboard' | 'Settings'

const nav: { label: Section; icon: typeof Activity }[] = [
  { label: 'Overview', icon: Activity },
  { label: 'Tournaments', icon: CalendarDays },
  { label: 'Players', icon: Users },
  { label: 'Teams', icon: Trophy },
  { label: 'Matches', icon: ClipboardList },
  { label: 'Live scoreboard', icon: Radio },
  { label: 'Settings', icon: Settings }
]

export default function App() {
  const [section, setSection] = useState<Section>('Overview')
  const [menuOpen, setMenuOpen] = useState(false)

  return <div className="app-shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><div className="brand-mark">PC</div><div><strong>PICKLECITY</strong><span>TOURNAMENT MANAGER</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(({ label, icon: Icon }) => <button key={label} className={section === label ? 'nav-item active' : 'nav-item'} onClick={() => { setSection(label); setMenuOpen(false) }}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><span className={firebaseConfigured ? 'status-dot connected' : 'status-dot'} />{firebaseConfigured ? 'Firebase configured' : 'Firebase setup pending'}<small>Version 0.1.0 · Foundation</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20}/></button><div className="crumb">PickleCity <span>/</span> {section}</div><div className="top-right"><span className="admin-pill">Admin workspace</span><div className="avatar">AK</div></div></header>
      <div className="page">
        <div className="page-heading"><div><p className="eyebrow">PICKLECITY CLUB</p><h1>{section}</h1><p className="subheading">Manage your tournaments, players and match-day operations.</p></div><button className="primary-button" onClick={() => setSection('Tournaments')}><Plus size={17}/> New tournament</button></div>
        {section === 'Overview' ? <>
          <div className="welcome"><div><p className="eyebrow light">TOURNAMENT CONTROL CENTER</p><h2>Every match. Every point. One place.</h2><p>Set up competitions, manage players and publish live scoreboards for your club.</p></div><Trophy className="welcome-icon" size={78}/></div>
          <div className="stats-grid">{[['Active tournaments','0','Calendar'],['Registered players','0','Players'],['Matches scheduled','0','Matches'],['Live matches','0','Live scoreboard']].map(([label,value,target])=><button className="stat-card" key={label} onClick={() => setSection(target as Section)}><span>{label}</span><strong>{value}</strong><small>Not started yet <ArrowUpRight size={13}/></small></button>)}</div>
          <div className="content-grid"><section className="panel"><div className="panel-head"><div><h3>Get started</h3><p>Complete these steps to run your first tournament.</p></div></div><div className="steps">{[['01','Create a tournament','Choose league, knockout, round robin or a combined format.'],['02','Add players and teams','Build your player directory and register participants.'],['03','Generate fixtures','Create match schedules and assign score admins.'],['04','Publish live scoreboard','Share a public link for spectators.']].map(([n,title,desc])=><div className="step" key={n}><b>{n}</b><div><strong>{title}</strong><p>{desc}</p></div></div>)}</div></section><section className="panel setup-panel"><div className="panel-head"><div><h3>Project setup</h3><p>Connection and deployment status</p></div></div><div className="setup-row"><span>Firebase connection</span><b className={firebaseConfigured ? 'tag good' : 'tag pending'}>{firebaseConfigured ? 'Configured' : 'Pending'}</b></div><div className="setup-row"><span>Admin authentication</span><b className="tag pending">Pending</b></div><div className="setup-row"><span>Hosting deployment</span><b className="tag pending">Not deployed</b></div><div className="setup-row"><span>Public scoreboard</span><b className="tag pending">Not published</b></div></section></div>
        </> : <section className="panel empty-panel"><div className="empty-icon"><ClipboardList size={26}/></div><h3>{section} setup</h3><p>This module is part of the build plan. The foundation is in place; data workflows and permissions will be added next.</p><button className="text-button" onClick={() => setSection('Overview')}>Back to overview</button></section>}
        <footer>© {new Date().getFullYear()} PickleCity · Tournament Manager</footer>
      </div>
    </main>
  </div>
}