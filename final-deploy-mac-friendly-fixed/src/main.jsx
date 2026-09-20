
import React, { useState, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase, isSupabaseConfigured } from './supabase.js'
import Login from './Login.jsx'
import { filterDataByRole } from './ProtectedRoute.jsx'

const LS_KEY = 'portfolio-v5-final'

const seed = {
  entities: [
    {id:'ent_1', name:'Lakeview Holdings Ltd', tracking_tag:'LAKEVIEW', notes:'Main entity'},
    {id:'ent_2', name:'Spa Road Properties Ltd', tracking_tag:'SPAROAD', notes:''},
    {id:'ent_3', name:'Lakefront Investments Ltd', tracking_tag:'LAKEFRONT', notes:''},
    {id:'ent_4', name:'Taupo Commercial Ltd', tracking_tag:'TAUPO-COM', notes:''},
    {id:'ent_5', name:'Central Assets Ltd', tracking_tag:'CENTRAL', notes:''},
  ],
  properties: [
    {id:'prop_1', name:'14 Spa Road', address:'14 Spa Rd, Taupo', entity_id:'ent_2', floor_area:420, year_built:1998},
    {id:'prop_2', name:'Lakefront Plaza', address:'1 Lake Tce, Taupo', entity_id:'ent_3', floor_area:1200, year_built:2005},
    {id:'prop_3', name:'Paora Hapi Block', address:'69 Paora Hapi St', entity_id:'ent_1', floor_area:650, year_built:1990},
    {id:'prop_4', name:'Heuheu St Retail', address:'72 Heuheu St, Taupo', entity_id:'ent_4', floor_area:300, year_built:2002},
    {id:'prop_5', name:'Ruapehu St Offices', address:'45 Ruapehu St', entity_id:'ent_5', floor_area:850, year_built:2010},
  ],
  tenants: [
    {id:'ten_1', name:'Bayleys Real Estate', email:'accounts@bayleys.co.nz', phone:'07 378 0011'},
    {id:'ten_2', name:'Harvey Norman', email:'lease@harveynorman.co.nz', phone:'07 376 1234'},
    {id:'ten_3', name:'BNZ', email:'property@bnz.co.nz', phone:'0800 123 456'},
    {id:'ten_4', name:'Lone Star', email:'accounts@lonestar.co.nz', phone:'07 378 9000'},
  ],
  leases: [
    {id:'lea_1', property_id:'prop_1', unit_label:'Ground', tenant_id:'ten_1', monthly_rent:3500, opex_pct:35, start_date:'2024-01-01', end_date:'2026-12-31', rent_review_date:'2026-03-15', status:'active', standing_invoice_number:'INV-2024-001', standing_invoice_total:126000, notes:'Right of renewal 2x3yr'},
    {id:'lea_2', property_id:'prop_2', unit_label:'Level 1', tenant_id:'ten_2', monthly_rent:8200, opex_pct:45, start_date:'2023-06-01', end_date:'2026-05-31', rent_review_date:'2026-02-10', status:'active', standing_invoice_number:'INV-2023-089', standing_invoice_total:295200, notes:''},
    {id:'lea_3', property_id:'prop_4', unit_label:'', tenant_id:'ten_3', monthly_rent:5200, opex_pct:25, start_date:'2024-03-01', end_date:'2027-02-28', rent_review_date:'2026-04-01', status:'active', standing_invoice_number:'INV-2024-012', standing_invoice_total:187200, notes:''},
  ],
  assets: [
    {id:'ast_1', property_id:'prop_1', type:'Fire System', name:'Fire Alarm Panel', service_provider:'Fire Protection Taupo', service_interval_months:6, last_service_date:'2025-11-01', status:'Operational', warranty_expiry:'2026-11-01', notes:''},
    {id:'ast_2', property_id:'prop_2', type:'Lift', name:'Passenger Lift #1', service_provider:'Schindler Lifts', service_interval_months:12, last_service_date:'2024-12-15', status:'Requires Service', warranty_expiry:'2027-12-15', notes:'Noisy operation reported'},
    {id:'ast_3', property_id:'prop_2', type:'HVAC', name:'HVAC Rooftop Unit', service_provider:'Aquaheat', service_interval_months:6, last_service_date:'2025-09-01', status:'Operational', warranty_expiry:'2026-09-01', notes:''},
  ],
  compliance_items: [
    {id:'comp_1', property_id:'prop_1', type:'BWoF', title:'BWoF - 14 Spa Road', issue_date:'2024-12-01', expiry_date:'2025-12-20', provider:'Taupo Compliance Ltd', certificate_ref:'BWOF-2024-142', notes:'IQP inspections required'},
    {id:'comp_2', property_id:'prop_2', type:'BWoF', title:'BWoF - Lakefront Plaza', issue_date:'2025-01-10', expiry_date:'2026-01-10', provider:'Building Compliance NZ', certificate_ref:'BWOF-2025-009', notes:''},
    {id:'comp_3', property_id:'prop_2', type:'Insurance', title:'Building Insurance - Lakefront', issue_date:'2025-01-15', expiry_date:'2026-02-28', provider:'Vero', certificate_ref:'INS-88921', notes:'$12M replacement'},
    {id:'comp_4', property_id:'prop_1', type:'Fire Evacuation Scheme', title:'Fire Evac Scheme - 14 Spa', issue_date:'2023-06-01', expiry_date:'2025-11-15', provider:'FENZ', certificate_ref:'FES-2023-44', notes:'Overdue review'},
  ],
  maintenance_requests: [
    {id:'mr_1', property_id:'prop_1', asset_id:'ast_1', tenant_id:null, type:'Preventive', title:'6-monthly fire test due', description:'Full system test + logbook', priority:'High', status:'Open', reported_date:'2025-12-20', due_date:'2026-01-10', assigned_contractor:'', completed_date:'', cost:''},
    {id:'mr_2', property_id:'prop_2', asset_id:'', tenant_id:'ten_2', type:'Tenant Request', title:'AC not cooling - Level 1', description:'Tenant reports AC blowing warm air', priority:'Medium', status:'Open', reported_date:'2025-12-18', due_date:'2025-12-22', assigned_contractor:'', completed_date:'', cost:''},
  ],
  xero_transactions: [
    {id:'x_1', date:'2025-12-05', contact_name:'Bayleys Real Estate', tracking_tag:'SPAROAD', amount:3500, reference:'Rent Dec 25', lease_id:'lea_1', type:'BANK_PAYMENT'},
    {id:'x_2', date:'2025-11-05', contact_name:'Bayleys Real Estate', tracking_tag:'SPAROAD', amount:3500, reference:'Rent Nov 25', lease_id:'lea_1', type:'BANK_PAYMENT'},
    {id:'x_3', date:'2025-12-06', contact_name:'Harvey Norman', tracking_tag:'LAKEFRONT', amount:8200, reference:'Rent Dec', lease_id:'lea_2', type:'BANK_PAYMENT'},
  ],
  opex_costs: [
    {id:'op_1', property_id:'prop_1', date:'2025-12-01', description:'Fire system annual inspection', total_amount:2400, category:'Fire', invoice_ref:'INV-FP-1021'},
  ],
  documents: [
    {id:'doc_1', property_id:'prop_1', lease_id:'lea_1', asset_id:'', compliance_id:'', type:'Lease', name:'Lease - Bayleys 2024-2026.pdf', upload_date:'2024-01-02', file_ref:'leases/bayleys-2024.pdf', expiry_date:'2026-12-31', notes:''},
    {id:'doc_2', property_id:'prop_1', lease_id:'', asset_id:'', compliance_id:'comp_1', type:'BWoF Certificate', name:'BWoF 2024 - 14 Spa.pdf', upload_date:'2024-12-01', file_ref:'bwof/14-spa-2024.pdf', expiry_date:'2025-12-20', notes:''},
  ]
}

function useStore(){
  const [data,setData]=useState(()=>{
    try{ const r=localStorage.getItem(LS_KEY); if(r) return JSON.parse(r) }catch(e){}
    return seed
  })
  useEffect(()=>{ localStorage.setItem(LS_KEY, JSON.stringify(data)) },[data])
  // Supabase load
  useEffect(()=>{
    if(!supabase) return
    const loadAll = async()=>{
      try{
        const tables = ['entities','properties','tenants','leases','assets','compliance_items','maintenance_requests','xero_transactions','opex_costs','documents']
        const newData={}
        for(let t of tables){
          const {data:rows} = await supabase.from(t).select('*')
          if(rows && rows.length) newData[t]=rows
        }
        if(Object.keys(newData).length) setData(d=>({...d, ...newData}))
      }catch(e){ console.warn('Supabase load failed', e) }
    }
    loadAll()
  },[])
  return [data,setData]
}

function csvExport(rows, filename){
  if(!rows.length) return alert('No data to export')
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r=> headers.map(h=>{
    const v = r[h]===undefined||r[h]===null?'':String(r[h])
    return `"${v.replace(/"/g,'""')}"`
  }).join(','))].join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url)
}

function Modal({open, onClose, title, children}){
  if(!open) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(22,40,61,0.35)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:20}}>
      <div style={{background:'#fff',borderRadius:16,padding:'24px 26px',width:'100%',maxWidth:560,maxHeight:'90vh',overflow:'auto',boxShadow:'0 20px 40px rgba(22,40,61,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontFamily:'Fraunces, serif',fontSize:18,fontWeight:600}}>{title}</div>
          <button onClick={onClose} style={{background:'#FDFCF8',border:'1px solid #E8E5DE',borderRadius:8,padding:'4px 8px',cursor:'pointer'}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Tag({children, color='#1F4B3F', bg='#E8EFE8'}){
  return <span style={{background:bg,color,fontSize:10,letterSpacing:'0.06em',padding:'3px 8px',borderRadius:20,fontWeight:600}}>{children}</span>
}

function App(){
  const [data,setData]=useStore()
  const [view,setView]=useState('dashboard')
  const [profile,setProfile]=useState(()=>{
    try{ const r=localStorage.getItem('pr-profile'); if(r) return JSON.parse(r) }catch(e){} return null
  })
  const [authLoading,setAuthLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [modal,setModal]=useState(null) // {type, data}
  const [form,setForm]=useState({})
  const [xeroCsv,setXeroCsv]=useState('')
  const [opexForm,setOpexForm]=useState({property_id:'', date:'', description:'', total_amount:'', category:'Fire', invoice_ref:''})
  const [selectedPropForOpex,setSelectedPropForOpex]=useState('')

  useEffect(()=>{
    const check=async()=>{
      if(!supabase){ setAuthLoading(false); return }
      const {data:{session}} = await supabase.auth.getSession()
      if(session?.user){
        const {data:prof} = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        const merged={...session.user, ...prof}
        setProfile(merged); localStorage.setItem('pr-profile', JSON.stringify(merged))
      }
      setAuthLoading(false)
    }
    check()
  },[])

  const handleLogin=(p)=>{ setProfile(p); localStorage.setItem('pr-profile', JSON.stringify(p)) }
  const handleLogout=async()=>{ if(supabase) await supabase.auth.signOut(); setProfile(null); localStorage.removeItem('pr-profile') }

  const filteredData = useMemo(()=> filterDataByRole(data, profile), [data, profile])
  const isTenant = profile?.role==='tenant'
  const isAdmin = profile?.role==='admin' || !profile

  // Helpers
  const entityById = useMemo(()=> Object.fromEntries(data.entities.map(e=>[e.id,e])), [data.entities])
  const propById = useMemo(()=> Object.fromEntries(data.properties.map(p=>[p.id,p])), [data.properties])
  const tenantById = useMemo(()=> Object.fromEntries(data.tenants.map(t=>[t.id,t])), [data.tenants])

  const stats = useMemo(()=>{
    const active = filteredData.leases.filter(l=>l.status==='active')
    const rentRoll = active.reduce((s,l)=>s+Number(l.monthly_rent||0),0)
    const overdueCompliance = filteredData.compliance_items.filter(c=> new Date(c.expiry_date) < new Date()).length
    const dueAssets = filteredData.assets.filter(a=>{
      if(!a.last_service_date) return true
      const next=new Date(a.last_service_date); next.setMonth(next.getMonth()+(a.service_interval_months||12)); return next < new Date(Date.now()+60*86400000)
    }).length
    const occupiedPropIds = new Set(active.map(l=>l.property_id))
    return { props: filteredData.properties.length, active: active.length, rentRoll, overdueCompliance, dueAssets, occupancy: filteredData.properties.length? Math.round(occupiedPropIds.size/filteredData.properties.length*100):0 }
  },[filteredData])

  const arrears = useMemo(()=>{
    return filteredData.leases.map(l=>{
      const txs = filteredData.xero_transactions.filter(x=>x.lease_id===l.id)
      const actual = txs.reduce((s,x)=>s+Number(x.amount||0),0)
      const start = new Date(l.start_date); const now=new Date()
      const monthsElapsed = Math.max(0, (now.getFullYear()-start.getFullYear())*12 + (now.getMonth()-start.getMonth()) + (now.getDate()>=start.getDate()?1:0))
      const expected = Math.min(Number(l.standing_invoice_total||0), monthsElapsed * Number(l.monthly_rent||0))
      const diff = expected - actual
      return {lease:l, expected, actual, arrears: diff, isArrears: diff>100, prop: propById[l.property_id], tenant: tenantById[l.tenant_id]}
    }).filter(a=>a.isArrears)
  },[filteredData, propById, tenantById])

  // CRUD helpers
  const upsert = (table, obj)=>{
    const id = obj.id || (table+'_'+Date.now())
    const newObj = {...obj, id}
    setData(d=>{
      const list = d[table] || []
      const idx = list.findIndex(x=>x.id===id)
      const newList = idx>=0 ? list.map((x,i)=> i===idx? newObj : x) : [...list, newObj]
      return {...d, [table]: newList}
    })
    if(supabase){
      supabase.from(table).upsert(newObj).then(()=>{})
    }
  }
  const remove = (table, id, cascadeCheck)=>{
    if(cascadeCheck){
      const msg = cascadeCheck()
      if(msg){ if(!confirm(msg)) return }
    }
    setData(d=>({...d, [table]: d[table].filter(x=>x.id!==id)}))
    if(supabase) supabase.from(table).delete().eq('id', id).then(()=>{})
  }

  // Modal save
  const handleSave = ()=>{
    if(!modal) return
    const t = modal.type
    if(t==='entity'){
      if(!form.name || !form.tracking_tag) return alert('Name and tracking tag required')
      if(data.entities.some(e=>e.tracking_tag===form.tracking_tag && e.id!==form.id)) return alert('Tracking tag must be unique')
      upsert('entities', form)
    } else if(t==='property'){
      if(!form.name) return alert('Name required')
      upsert('properties', form)
    } else if(t==='tenant'){
      if(!form.name) return alert('Name required')
      upsert('tenants', form)
    } else if(t==='lease'){
      if(!form.property_id || !form.tenant_id || !form.monthly_rent) return alert('Property, tenant, rent required')
      const f={...form, monthly_rent: Number(form.monthly_rent), opex_pct: Number(form.opex_pct||0), standing_invoice_total: Number(form.standing_invoice_total||0)}
      upsert('leases', f)
    } else if(t==='asset'){
      upsert('assets', form)
    } else if(t==='compliance'){
      upsert('compliance_items', form)
    } else if(t==='maintenance'){
      upsert('maintenance_requests', form)
    } else if(t==='document'){
      upsert('documents', form)
    } else if(t==='xero'){
      upsert('xero_transactions', form)
    } else if(t==='opex'){
      upsert('opex_costs', form)
    }
    setModal(null); setForm({})
  }

  const openModal = (type, existing=null)=>{
    setModal({type})
    if(existing) setForm(existing)
    else {
      if(type==='entity') setForm({name:'', tracking_tag:'', notes:''})
      if(type==='property') setForm({name:'', address:'', entity_id: data.entities[0]?.id||'', floor_area:'', year_built:''})
      if(type==='tenant') setForm({name:'', email:'', phone:''})
      if(type==='lease') setForm({property_id: data.properties[0]?.id||'', unit_label:'', tenant_id: data.tenants[0]?.id||'', monthly_rent:'', opex_pct:'', start_date:'', end_date:'', rent_review_date:'', status:'active', standing_invoice_number:'', standing_invoice_total:'', notes:''})
      if(type==='asset') setForm({property_id: data.properties[0]?.id||'', type:'Fire System', name:'', service_provider:'', service_interval_months:12, last_service_date:'', status:'Operational', warranty_expiry:'', notes:''})
      if(type==='compliance') setForm({property_id: data.properties[0]?.id||'', type:'BWoF', title:'', issue_date:'', expiry_date:'', renewal_date:'', provider:'', certificate_ref:'', notes:''})
      if(type==='maintenance') setForm({property_id: data.properties[0]?.id||'', asset_id:'', tenant_id:'', type:'Preventive', title:'', description:'', priority:'Medium', status:'Open', reported_date: new Date().toISOString().slice(0,10), due_date:'', assigned_contractor:'', cost:''})
      if(type==='document') setForm({property_id: data.properties[0]?.id||'', lease_id:'', asset_id:'', compliance_id:'', type:'Lease', name:'', upload_date: new Date().toISOString().slice(0,10), file_ref:'', expiry_date:'', notes:''})
      if(type==='xero') setForm({date: new Date().toISOString().slice(0,10), contact_name:'', tracking_tag:'', amount:'', reference:'', lease_id:'', type:'BANK_PAYMENT'})
    }
  }

  if(authLoading) return <div style={{padding:40}}>Loading...</div>
  if(!profile) return <Login onLoggedIn={handleLogin} />

  const filteredSearch = (list, fields)=>{
    if(!search) return list
    const s=search.toLowerCase()
    return list.filter(o=> fields.some(f=> String(o[f]||'').toLowerCase().includes(s)))
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#FDFCF8',color:'#16283D'}}>
      <aside style={{width:260,background:'#16283D',color:'#EAEFEA',padding:'28px 0',flexShrink:0,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',overflow:'auto'}}>
        <div style={{padding:'0 22px 22px',borderBottom:'1px solid rgba(255,255,255,0.12)'}}>
          <div style={{fontFamily:'Fraunces, serif',fontSize:18,fontWeight:600,letterSpacing:'0.04em'}}>PORTFOLIO</div>
          <div style={{fontFamily:'Fraunces, serif',fontSize:18,fontWeight:300,marginTop:-4}}>Register</div>
          <div style={{fontSize:10,opacity:0.5,letterSpacing:'0.12em',marginTop:8}}>{profile.role?.toUpperCase()} • {profile.display_name || profile.email}</div>
          <div style={{marginTop:6,display:'flex',gap:6}}>
            <span style={{background:isSupabaseConfigured?'#1F4B3F':'#3A4A5A',color:'#fff',fontSize:9,padding:'2px 6px',borderRadius:10}}>{isSupabaseConfigured?'LIVE DB':'LOCAL DEMO'}</span>
            <span style={{background:'#2A3A4A',color:'#C7D3CB',fontSize:9,padding:'2px 6px',borderRadius:10}}>{data.properties.length} PROPS</span>
          </div>
        </div>
        <nav style={{display:'flex',flexDirection:'column',marginTop:12,flex:1}}>
          {[
            ['dashboard','Dashboard'],
            ...(!isTenant ? [
              ['portfolio','Portfolio'],
              ['leases','Leases'],
              ['tenants','Tenants'],
              ['xero','Xero Bridge'],
              ['opex','OpEx'],
              ['facilities','Facilities'],
              ['compliance','Compliance'],
              ['documents','Documents'],
              ['reports','Reports'],
            ] : [
              ['my-lease','My Lease'],
              ['my-requests','My Requests'],
            ])
          ].map(([k,l])=>(
            <button key={k} onClick={()=>{setView(k); setSearch('')}} style={{textAlign:'left',padding:'11px 22px',background: view===k ? '#1F4B3F':'transparent',color: view===k?'#fff':'#C7D3CB',border:'none',borderLeft: view===k?'3px solid #C08A3E':'3px solid transparent',cursor:'pointer',fontSize:13}}>{l}</button>
          ))}
        </nav>
        <div style={{margin:'0 22px',paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.12)'}}>
          <div style={{fontSize:12,opacity:0.8,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{profile.email}</div>
          <div style={{fontSize:11,opacity:0.5,marginTop:4}}>Role: {profile.role}</div>
          <button onClick={handleLogout} style={{marginTop:12,background:'transparent',border:'1px solid rgba(255,255,255,0.2)',color:'#EAEFEA',padding:'7px 10px',borderRadius:6,fontSize:12,cursor:'pointer',width:'100%'}}>Sign out</button>
          <div style={{marginTop:12,fontSize:10,opacity:0.4}}>v5.1 • Phase 1-4 • Read-only Xero • 5 entities / 1 org</div>
        </div>
      </aside>

      <main style={{flex:1,padding:'36px 44px',maxWidth:1280}}>
        {/* Search bar */}
        <div style={{display:'flex',gap:12,marginBottom:20}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search... (filters current view)" style={{flex:1,padding:'10px 14px',border:'1px solid #E8E5DE',borderRadius:10,background:'#fff'}}/>
          <div style={{fontSize:11,color:'#9AA8B6',paddingTop:12}}>{isSupabaseConfigured?'Supabase connected':'Local demo — add env vars in Vercel for live DB'}</div>
        </div>

        {view==='dashboard' && (
          <>
            <h1 style={{fontFamily:'Fraunces, serif',fontSize:32,fontWeight:500,margin:0,letterSpacing:'-0.02em'}}>{isTenant?`Welcome, ${profile.display_name||'Tenant'}`:'Portfolio overview'}</h1>
            <p style={{color:'#6B7A8A',fontSize:14,marginTop:6}}>{filteredData.properties.length} properties · {stats.active} active leases · ${stats.rentRoll.toLocaleString()}/mo · {stats.occupancy}% occupied · {new Date().toLocaleDateString()}</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginTop:24}}>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:'18px 20px'}}>
                <div style={{fontSize:10,letterSpacing:'0.12em',color:'#9AA8B6'}}>PROPERTIES</div>
                <div style={{fontFamily:'Fraunces, serif',fontSize:28,marginTop:8,color:'#1F4B3F'}}>{stats.props}</div>
                <div style={{fontSize:12,color:'#6B7A8A',marginTop:4}}>{stats.active} occupied · {stats.occupancy}%</div>
                <div style={{marginTop:10,height:6,background:'#F0EDE8',borderRadius:10,overflow:'hidden'}}><div style={{width:`${stats.occupancy}%`,height:'100%',background:'#1F4B3F'}}/></div>
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:'18px 20px'}}>
                <div style={{fontSize:10,letterSpacing:'0.12em',color:'#9AA8B6'}}>RENT ROLL</div>
                <div style={{fontFamily:'Fraunces, serif',fontSize:28,marginTop:8,color:'#1F4B3F'}}>${(stats.rentRoll/1000).toFixed(1)}k</div>
                <div style={{fontSize:12,color:'#6B7A8A',marginTop:4}}>per month · ${(stats.rentRoll*12/1000).toFixed(0)}k annual</div>
                <div style={{marginTop:10,display:'flex',gap:3}}>{filteredData.leases.filter(l=>l.status==='active').slice(0,12).map((l,i)=><div key={i} style={{flex:1,height:18,background:'#E8EFE8',borderRadius:3,borderTop:`${Math.min(16, l.monthly_rent/1000)}px solid #1F4B3F`}}/>)}</div>
              </div>
              <div style={{background: stats.overdueCompliance>0?'#FDF2F0':'#fff',border:`1px solid ${stats.overdueCompliance>0?'#E8B4A8':'#E8E5DE'}`,borderRadius:12,padding:'18px 20px'}}>
                <div style={{fontSize:10,letterSpacing:'0.12em',color: stats.overdueCompliance>0?'#B85C4A':'#9AA8B6'}}>CRITICAL ALERTS</div>
                <div style={{fontFamily:'Fraunces, serif',fontSize:28,marginTop:8,color: stats.overdueCompliance>0?'#B85C4A':'#1F4B3F'}}>{stats.overdueCompliance + arrears.length + stats.dueAssets}</div>
                <div style={{fontSize:12,color:'#6B7A8A',marginTop:4}}>{arrears.length} arrears · {stats.overdueCompliance} compliance overdue · {stats.dueAssets} assets due</div>
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:'18px 20px'}}>
                <div style={{fontSize:10,letterSpacing:'0.12em',color:'#9AA8B6'}}>ENTITIES</div>
                <div style={{fontFamily:'Fraunces, serif',fontSize:28,marginTop:8}}>{filteredData.entities.length}</div>
                <div style={{fontSize:12,color:'#6B7A8A',marginTop:4}}>{filteredData.entities.map(e=>e.tracking_tag).join(' · ')}</div>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,marginTop:18}}>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:20}}>
                <div style={{fontWeight:600,marginBottom:12}}>Rent roll by entity</div>
                {filteredData.entities.map(ent=>{
                  const props = filteredData.properties.filter(p=>p.entity_id===ent.id)
                  const leases = filteredData.leases.filter(l=> props.some(p=>p.id===l.property_id) && l.status==='active')
                  const roll = leases.reduce((s,l)=>s+Number(l.monthly_rent||0),0)
                  const maxRoll = Math.max(...filteredData.entities.map(e=>{
                    const pp = filteredData.properties.filter(p=>p.entity_id===e.id)
                    return filteredData.leases.filter(l=> pp.some(p=>p.id===l.property_id) && l.status==='active').reduce((s,l)=>s+Number(l.monthly_rent||0),0)
                  }),1)
                  return (
                    <div key={ent.id} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid #F0EDE8'}}>
                      <div style={{width:90,fontSize:12,fontWeight:600}}>{ent.tracking_tag}</div>
                      <div style={{flex:1,height:8,background:'#F0EDE8',borderRadius:10}}><div style={{width:`${(roll/maxRoll*100)||0}%`,height:'100%',background:'#1F4B3F',borderRadius:10}}/></div>
                      <div style={{width:80,textAlign:'right',fontSize:12}}>${roll.toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:20}}>
                <div style={{fontWeight:600,marginBottom:12}}>Arrears (standing invoice model)</div>
                {arrears.length===0 ? <div style={{fontSize:13,color:'#6B7A8A'}}>No arrears — all bank payments match expected to date.</div> :
                  arrears.map(a=>(
                    <div key={a.lease.id} style={{padding:'8px 0',borderBottom:'1px solid #F0EDE8'}}>
                      <div style={{fontSize:13,fontWeight:600}}>{a.tenant?.name} @ {a.prop?.name}</div>
                      <div style={{fontSize:12,color:'#B85C4A'}}>Arrears ${a.arrears.toFixed(0)} · Expected ${a.expected.toFixed(0)} · Paid ${a.actual.toFixed(0)}</div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginTop:14}}>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:20}}>
                <div style={{fontSize:11,letterSpacing:'0.08em',color:'#9AA8B6'}}>UPCOMING LEASES (90d)</div>
                {filteredData.leases.filter(l=>{
                  const d = l.rent_review_date ? new Date(l.rent_review_date) : new Date(l.end_date)
                  const diff = (d - new Date())/86400000; return diff>=0 && diff<=90
                }).slice(0,5).map(l=><div key={l.id} style={{fontSize:12,padding:'8px 0',borderBottom:'1px solid #F0EDE8'}}>{propById[l.property_id]?.name} — {tenantById[l.tenant_id]?.name} — review {l.rent_review_date} / expiry {l.end_date}</div>)}
              </div>
              <div style={{background: filteredData.compliance_items.some(c=> new Date(c.expiry_date)<new Date()) ? '#FDF2F0':'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:20}}>
                <div style={{fontSize:11,letterSpacing:'0.08em',color:'#9AA8B6'}}>COMPLIANCE DUE</div>
                {filteredData.compliance_items.sort((a,b)=> new Date(a.expiry_date)-new Date(b.expiry_date)).slice(0,5).map(c=>{
                  const days = Math.round((new Date(c.expiry_date)-new Date())/86400000)
                  return <div key={c.id} style={{fontSize:12,padding:'8px 0',borderBottom:'1px solid #F0EDE8',color: days<0?'#B85C4A': days<60?'#8A6A2A':'#16283D'}}>{c.type} {c.title} — {c.expiry_date} ({days<0?`${Math.abs(days)}d overdue`: `${days}d`})</div>
                })}
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:20}}>
                <div style={{fontSize:11,letterSpacing:'0.08em',color:'#9AA8B6'}}>ASSETS DUE (60d)</div>
                {filteredData.assets.filter(a=>{
                  if(!a.last_service_date) return true
                  const next=new Date(a.last_service_date); next.setMonth(next.getMonth()+(a.service_interval_months||12)); return next < new Date(Date.now()+60*86400000)
                }).slice(0,5).map(a=><div key={a.id} style={{fontSize:12,padding:'8px 0',borderBottom:'1px solid #F0EDE8'}}>{a.type} {a.name} @ {propById[a.property_id]?.name} — provider {a.service_provider}</div>)}
              </div>
            </div>
          </>
        )}

        {view==='portfolio' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Portfolio — {filteredData.entities.length} entities · {filteredData.properties.length} properties</h2>
              <div style={{display:'flex',gap:8}}>
                {isAdmin && <button onClick={()=>openModal('entity')} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Entity</button>}
                <button onClick={()=>openModal('property')} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Property</button>
                <button onClick={()=>csvExport(filteredData.properties, 'properties.csv')} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Export CSV</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:18}}>
              {filteredSearch(filteredData.entities, ['name','tracking_tag']).map(ent=>{
                const props = filteredData.properties.filter(p=>p.entity_id===ent.id)
                const leases = filteredData.leases.filter(l=> props.some(p=>p.id===l.property_id) && l.status==='active')
                const roll = leases.reduce((s,l)=>s+Number(l.monthly_rent||0),0)
                return (
                  <div key={ent.id} style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><div style={{fontWeight:600}}>{ent.name}</div><Tag bg="#F0EDE8">{ent.tracking_tag}</Tag></div>
                    <div style={{fontSize:12,color:'#6B7A8A',marginTop:8}}>{props.length} props · {leases.length} active · ${roll.toLocaleString()}/mo</div>
                    <div style={{marginTop:10,display:'flex',gap:6}}>
                      <button onClick={()=>{setForm(ent); setModal({type:'entity'})}} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer'}}>Edit</button>
                      {isAdmin && <button onClick={()=>remove('entities', ent.id, ()=>{ const c= data.properties.filter(p=>p.entity_id===ent.id).length; return c? `Entity owns ${c} properties. Delete anyway? This will orphan them.` : null })} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Delete</button>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{marginTop:20,background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'14px 16px',borderBottom:'1px solid #E8E5DE',fontWeight:600}}>Properties</div>
              <div style={{overflow:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{textAlign:'left',fontSize:11,letterSpacing:'0.08em',color:'#9AA8B6'}}><th style={{padding:'10px 16px'}}>Name</th><th>Address</th><th>Entity</th><th>Floor</th><th>Built</th><th>Leases</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredSearch(filteredData.properties, ['name','address']).map(p=>{
                      const leases = filteredData.leases.filter(l=>l.property_id===p.id && l.status==='active')
                      return <tr key={p.id} style={{borderTop:'1px solid #F0EDE8'}}><td style={{padding:'10px 16px',fontWeight:500}}>{p.name}</td><td>{p.address}</td><td><Tag>{entityById[p.entity_id]?.tracking_tag||''}</Tag></td><td>{p.floor_area||''}</td><td>{p.year_built||''}</td><td>{leases.length}</td><td><button onClick={()=>{setForm(p); setModal({type:'property'})}} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer',marginRight:6}}>Edit</button><button onClick={()=>remove('properties', p.id, ()=>{ const c=data.leases.filter(l=>l.property_id===p.id && l.status==='active').length; return c? `Property has ${c} active leases. Delete anyway?` : null })} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Delete</button></td></tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {view==='leases' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Leases — {filteredData.leases.length} total</h2>
              <div style={{display:'flex',gap:8}}><button onClick={()=>openModal('lease')} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Lease</button><button onClick={()=>csvExport(filteredData.leases.map(l=>({...l, property: propById[l.property_id]?.name, tenant: tenantById[l.tenant_id]?.name, entity: entityById[propById[l.property_id]?.entity_id]?.tracking_tag})), 'leases.csv')} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Export CSV</button></div>
            </div>
            <div style={{marginTop:16,background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,overflow:'hidden'}}>
              <div style={{overflow:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th style={{padding:'10px 12px'}}>Property</th><th>Tenant</th><th>Entity</th><th>Monthly</th><th>OpEx%</th><th>Term</th><th>Standing Inv</th><th>Balance</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredSearch(filteredData.leases, ['unit_label','standing_invoice_number','notes']).map(l=>{
                      const prop = propById[l.property_id]; const ent = entityById[prop?.entity_id]; const ten = tenantById[l.tenant_id]
                      const txs = filteredData.xero_transactions.filter(x=>x.lease_id===l.id); const paid = txs.reduce((s,x)=>s+Number(x.amount||0),0); const bal = Number(l.standing_invoice_total||0)-paid
                      const reviewDays = l.rent_review_date ? Math.round((new Date(l.rent_review_date)-new Date())/86400000) : null
                      return <tr key={l.id} style={{borderTop:'1px solid #F0EDE8'}}><td style={{padding:'10px 12px'}}><div style={{fontWeight:600}}>{prop?.name}</div><div style={{fontSize:11,color:'#6B7A8A'}}>{l.unit_label}</div></td><td>{ten?.name}</td><td><Tag>{ent?.tracking_tag}</Tag></td><td>${Number(l.monthly_rent).toLocaleString()}</td><td>{l.opex_pct}%</td><td style={{fontSize:11}}>{l.start_date} → {l.end_date}</td><td><div>{l.standing_invoice_number}</div><div style={{fontSize:11,color:'#6B7A8A'}}>${Number(l.standing_invoice_total||0).toLocaleString()}</div></td><td style={{color: bal>100?'#B85C4A':'#1F4B3F'}}>${bal.toLocaleString()} {bal>100?`(${paid.toLocaleString()} paid)`:''}</td><td>{l.rent_review_date ? <span style={{background: reviewDays!==null && reviewDays<0 ? '#FDF2F0' : reviewDays!==null && reviewDays<=60 ? '#FDF8E8':'#E8EFE8',color: reviewDays!==null && reviewDays<0?'#B85C4A': reviewDays!==null && reviewDays<=60?'#8A6A2A':'#1F4B3F',padding:'2px 6px',borderRadius:10,fontSize:10}}>{l.rent_review_date} {reviewDays!==null?`(${reviewDays}d)`:''}</span> : ''}</td><td><Tag bg={l.status==='active'?'#E8EFE8':'#F0EDE8'} color={l.status==='active'?'#1F4B3F':'#6B7A8A'}>{l.status}</Tag></td><td><button onClick={()=>{setForm(l); setModal({type:'lease'})}} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer',marginRight:4}}>Edit</button><button onClick={()=>remove('leases', l.id)} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Del</button></td></tr>
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {view==='tenants' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Tenants — {filteredData.tenants.length}</h2>
              <div style={{display:'flex',gap:8}}><button onClick={()=>openModal('tenant')} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Tenant</button><button onClick={()=>csvExport(filteredData.tenants,'tenants.csv')} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Export CSV</button></div>
            </div>
            <div style={{marginTop:16,background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{textAlign:'left',fontSize:11,letterSpacing:'0.08em',color:'#9AA8B6'}}><th style={{padding:'10px 16px'}}>Name</th><th>Email</th><th>Phone</th><th>Active Leases</th><th>Arrears</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredSearch(filteredData.tenants, ['name','email']).map(t=>{
                    const leases = filteredData.leases.filter(l=>l.tenant_id===t.id && l.status==='active')
                    const arr = arrears.filter(a=>a.tenant?.id===t.id).reduce((s,a)=>s+a.arrears,0)
                    return <tr key={t.id} style={{borderTop:'1px solid #F0EDE8'}}><td style={{padding:'10px 16px',fontWeight:500}}>{t.name}</td><td>{t.email}</td><td>{t.phone}</td><td>{leases.length}</td><td style={{color: arr>0?'#B85C4A':'#1F4B3F'}}>{arr>0?`$${arr.toFixed(0)}`:''}</td><td><button onClick={()=>{setForm(t); setModal({type:'tenant'})}} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer',marginRight:6}}>Edit</button><button onClick={()=>remove('tenants', t.id, ()=>{ const c=data.leases.filter(l=>l.tenant_id===t.id && l.status==='active').length; return c?`Tenant has ${c} active leases. Delete anyway?`:null })} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Delete</button></td></tr>
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view==='xero' && (
          <>
            <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Xero Bridge — Read-only, Single Org + Tracking Categories</h2>
            <div style={{marginTop:12,background:'#E8EFE8',border:'1px solid #C7CFC7',borderRadius:10,padding:'12px 14px',fontSize:12}}>One Xero org, 5 tracking tags (LAKEVIEW etc). App never writes to Xero. Reads Bank Transactions + Invoice Payments via OAuth. Token expires every 30 mins — auto refresh. Rate limit 60/min. Starter tier ≤1000 calls/day free. Accountant works separately in Xero.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:8}}>Connection</div>
                <div style={{fontSize:12}}><span style={{display:'inline-block',width:8,height:8,background:'#1F8A5A',borderRadius:10,marginRight:6}}/>Connected to Demo Xero Org (Taupo Portfolio Ltd)</div>
                <div style={{fontSize:12,marginTop:6,color:'#6B7A8A'}}>Token expires in 28 mins • Auto-refresh enabled • 60 calls/min • Starter tier</div>
                <div style={{marginTop:12}}>
                  <div style={{fontSize:11,letterSpacing:'0.08em',color:'#9AA8B6'}}>ADD BANK TRANSACTION (manual)</div>
                  <button onClick={()=>openModal('xero')} style={{marginTop:6,background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Transaction</button>
                </div>
                <div style={{marginTop:16}}>
                  <div style={{fontSize:11,letterSpacing:'0.08em',color:'#9AA8B6'}}>PASTE XERO CSV</div>
                  <div style={{fontSize:11,color:'#6B7A8A',marginTop:4}}>Format: Date,Contact,TrackingTag,Amount,Reference,LeaseId(optional)</div>
                  <textarea value={xeroCsv} onChange={e=>setXeroCsv(e.target.value)} placeholder="2025-12-05,Bayleys Real Estate,SPAROAD,3500,Rent Dec,lea_1" style={{width:'100%',height:80,marginTop:8,padding:8,border:'1px solid #E8E5DE',borderRadius:8,fontSize:12}}/>
                  <button onClick={()=>{
                    if(!xeroCsv.trim()) return
                    const lines=xeroCsv.split('\n')
                    lines.forEach(line=>{
                      const [date,contact,tracking,amount,ref,leaseId] = line.split(',').map(s=>s.trim())
                      if(date && amount) upsert('xero_transactions', {date, contact_name:contact, tracking_tag:tracking, amount: Number(amount), reference:ref, lease_id: leaseId||'', type:'BANK_PAYMENT'})
                    })
                    setXeroCsv(''); alert('Imported '+lines.length+' transactions')
                  }} style={{marginTop:8,background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Import CSV</button>
                </div>
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:8}}>Reconciliation — Expected vs Actual (standing invoice model)</div>
                {filteredData.leases.map(l=>{
                  const txs=filteredData.xero_transactions.filter(x=>x.lease_id===l.id); const actual=txs.reduce((s,x)=>s+Number(x.amount||0),0)
                  const start=new Date(l.start_date); const now=new Date(); const monthsElapsed=Math.max(0,(now.getFullYear()-start.getFullYear())*12 + (now.getMonth()-start.getMonth()) + (now.getDate()>=start.getDate()?1:0))
                  const expected=Math.min(Number(l.standing_invoice_total||0), monthsElapsed*Number(l.monthly_rent||0))
                  const diff=expected-actual
                  const status = diff>100? 'Arrears' : diff<-100?'Overpaid':'Matched'
                  return <div key={l.id} style={{padding:'8px 0',borderBottom:'1px solid #F0EDE8',display:'flex',justifyContent:'space-between',fontSize:12}}><div><div style={{fontWeight:600}}>{propById[l.property_id]?.name} — {tenantById[l.tenant_id]?.name}</div><div style={{color:'#6B7A8A'}}>Standing {l.standing_invoice_number} • ${Number(l.standing_invoice_total).toLocaleString()} • Tag {entityById[propById[l.property_id]?.entity_id]?.tracking_tag}</div></div><div style={{textAlign:'right'}}><div>Expected ${expected.toLocaleString()} • Paid ${actual.toLocaleString()}</div><div style={{color: status==='Arrears'?'#B85C4A': status==='Overpaid'?'#1F4B3F':'#6B7A8A',fontWeight:600}}>{status} {diff!==0?`$${diff.toFixed(0)}`:''}</div>{status==='Arrears' && <button onClick={()=>{ const subject=`Arrears Notice - ${propById[l.property_id]?.name} - $${diff.toFixed(0)}`; const body=`Kia ora ${tenantById[l.tenant_id]?.name},\n\nOur records show rent of $${diff.toFixed(0)} overdue for ${propById[l.property_id]?.name} (lease ${l.standing_invoice_number}). Expected to date $${expected.toFixed(0)}, received $${actual.toFixed(0)}.\n\nPlease arrange payment to the usual account.\n\nNgā mihi`; alert(`Subject: ${subject}\n\n${body}\n\n(This is a simulation — email would be sent via Postmark/Resend in production)` ) }} style={{marginTop:4,fontSize:10,padding:'3px 6px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Simulate Arrears Email</button>}</div></div>
                })}
              </div>
            </div>
            <div style={{marginTop:14,background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'14px 16px',borderBottom:'1px solid #E8E5DE',fontWeight:600,display:'flex',justifyContent:'space-between'}}><span>Bank Transactions — {filteredData.xero_transactions.length}</span><button onClick={()=>csvExport(filteredData.xero_transactions,'xero_transactions.csv')} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer'}}>Export CSV</button></div>
              <div style={{overflow:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th style={{padding:'10px 12px'}}>Date</th><th>Contact</th><th>Tag</th><th>Amount</th><th>Reference</th><th>Matched Lease</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredData.xero_transactions.map(x=><tr key={x.id} style={{borderTop:'1px solid #F0EDE8'}}><td style={{padding:'10px 12px'}}>{x.date}</td><td>{x.contact_name}</td><td><Tag>{x.tracking_tag}</Tag></td><td>${Number(x.amount).toLocaleString()}</td><td>{x.reference}</td><td><select value={x.lease_id||''} onChange={e=> upsert('xero_transactions', {...x, lease_id: e.target.value})} style={{fontSize:11,padding:'4px',border:'1px solid #E8E5DE',borderRadius:6}}><option value="">Unmatched</option>{data.leases.map(l=><option key={l.id} value={l.id}>{propById[l.property_id]?.name} — {tenantById[l.tenant_id]?.name}</option>)}</select></td><td><button onClick={()=>remove('xero_transactions', x.id)} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Del</button></td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {view==='opex' && (
          <>
            <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>OpEx Recovery — Pro-rata Calculator (Read-only to Xero)</h2>
            <div style={{marginTop:12,background:'#FDF8E8',border:'1px solid #E8D9A8',borderRadius:10,padding:'12px 14px',fontSize:12}}>App never creates invoices in Xero — calculation only. Enter total cost, we calculate share per tenant by opex %. Give summary to accountant to raise invoices manually in Xero.</div>
            <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:14,marginTop:14}}>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:12}}>New OpEx Cost</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <select value={opexForm.property_id} onChange={e=>{setOpexForm({...opexForm, property_id:e.target.value}); setSelectedPropForOpex(e.target.value)}} style={{padding:'8px',border:'1px solid #E8E5DE',borderRadius:8}}>
                    <option value="">Select property</option>{data.properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="date" value={opexForm.date} onChange={e=>setOpexForm({...opexForm, date:e.target.value})} style={{padding:'8px',border:'1px solid #E8E5DE',borderRadius:8}}/>
                  <input placeholder="Description e.g. Fire inspection" value={opexForm.description} onChange={e=>setOpexForm({...opexForm, description:e.target.value})} style={{padding:'8px',border:'1px solid #E8E5DE',borderRadius:8}}/>
                  <input placeholder="Total amount e.g. 2400" type="number" value={opexForm.total_amount} onChange={e=>setOpexForm({...opexForm, total_amount:e.target.value})} style={{padding:'8px',border:'1px solid #E8E5DE',borderRadius:8}}/>
                  <select value={opexForm.category} onChange={e=>setOpexForm({...opexForm, category:e.target.value})} style={{padding:'8px',border:'1px solid #E8E5DE',borderRadius:8}}><option>Fire</option><option>HVAC</option><option>Lift</option><option>Cleaning</option><option>Insurance</option><option>Other</option></select>
                  <input placeholder="Supplier inv ref" value={opexForm.invoice_ref} onChange={e=>setOpexForm({...opexForm, invoice_ref:e.target.value})} style={{padding:'8px',border:'1px solid #E8E5DE',borderRadius:8}}/>
                  <button onClick={()=>{ if(!opexForm.property_id || !opexForm.total_amount) return alert('Property and amount required'); upsert('opex_costs', {...opexForm, total_amount: Number(opexForm.total_amount), date: opexForm.date||new Date().toISOString().slice(0,10)}); setOpexForm({property_id:'', date:'', description:'', total_amount:'', category:'Fire', invoice_ref:''}) }} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'10px',borderRadius:8,cursor:'pointer'}}>Add Cost</button>
                </div>
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:8}}>Pro-rata breakdown — {selectedPropForOpex ? propById[selectedPropForOpex]?.name : 'Select property left'}</div>
                {!selectedPropForOpex ? <div style={{fontSize:13,color:'#6B7A8A'}}>Select a property to see active leases and their share.</div> :
                  <>
                    <div style={{fontSize:12,color:'#6B7A8A',marginBottom:10}}>Total cost: ${Number(data.opex_costs.filter(o=>o.property_id===selectedPropForOpex).slice(-1)[0]?.total_amount||0).toLocaleString()} — breakdown by opex %</div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th>Tenant</th><th>Lease</th><th>OpEx %</th><th>Share $</th></tr></thead>
                      <tbody>
                        {data.leases.filter(l=>l.property_id===selectedPropForOpex && l.status==='active').map(l=>{
                          const lastCost = data.opex_costs.filter(o=>o.property_id===selectedPropForOpex).slice(-1)[0]
                          const share = lastCost ? Number(lastCost.total_amount) * Number(l.opex_pct||0)/100 : 0
                          return <tr key={l.id} style={{borderTop:'1px solid #F0EDE8'}}><td>{tenantById[l.tenant_id]?.name}</td><td>{l.unit_label||'Main'}</td><td>{l.opex_pct}%</td><td style={{fontWeight:600}}>${share.toFixed(2)}</td></tr>
                        })}
                      </tbody>
                    </table>
                    <button onClick={()=>{
                      const prop = propById[selectedPropForOpex]; const costs = data.opex_costs.filter(o=>o.property_id===selectedPropForOpex)
                      if(!costs.length) return alert('No costs for this property')
                      const rows=[]
                      costs.forEach(c=>{
                        data.leases.filter(l=>l.property_id===selectedPropForOpex && l.status==='active').forEach(l=>{
                          rows.push({Property: prop?.name, Tenant: tenantById[l.tenant_id]?.name, Description: c.description, Date: c.date, TotalCost: c.total_amount, ProRataPct: l.opex_pct, Share: (Number(c.total_amount)*Number(l.opex_pct||0)/100).toFixed(2), Note: 'Raise manually in Xero'})
                        })
                      })
                      csvExport(rows, `opex-${prop?.name}-${new Date().toISOString().slice(0,10)}.csv`)
                    }} style={{marginTop:12,background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Generate Summary for Accountant (CSV)</button>
                  </>
                }
              </div>
            </div>
            <div style={{marginTop:14,background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'14px 16px',borderBottom:'1px solid #E8E5DE',fontWeight:600,display:'flex',justifyContent:'space-between'}}><span>OpEx History — {filteredData.opex_costs.length}</span><button onClick={()=>csvExport(filteredData.opex_costs,'opex_history.csv')} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer'}}>Export CSV</button></div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th style={{padding:'10px 12px'}}>Date</th><th>Property</th><th>Description</th><th>Category</th><th>Total</th><th>Invoice Ref</th><th>Actions</th></tr></thead><tbody>{filteredData.opex_costs.map(o=><tr key={o.id} style={{borderTop:'1px solid #F0EDE8'}}><td style={{padding:'10px 12px'}}>{o.date}</td><td>{propById[o.property_id]?.name}</td><td>{o.description}</td><td><Tag>{o.category}</Tag></td><td>${Number(o.total_amount).toLocaleString()}</td><td>{o.invoice_ref}</td><td><button onClick={()=>remove('opex_costs', o.id)} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Del</button></td></tr>)}</tbody></table>
            </div>
          </>
        )}

        {view==='facilities' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Facilities — Assets & Maintenance (Phase 4)</h2>
              <div style={{display:'flex',gap:8}}><button onClick={()=>openModal('asset')} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Asset</button><button onClick={()=>openModal('maintenance')} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Request</button></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div style={{fontWeight:600}}>Assets — {filteredData.assets.length}</div><button onClick={()=>{
                  // Generate preventive from assets due
                  let created=0
                  filteredData.assets.forEach(a=>{
                    if(!a.last_service_date) return
                    const next=new Date(a.last_service_date); next.setMonth(next.getMonth()+(a.service_interval_months||12))
                    if(next < new Date(Date.now()+90*86400000)){
                      const exists = filteredData.maintenance_requests.some(m=> m.asset_id===a.id && m.type==='Preventive' && m.status!=='Completed' && m.status!=='Closed')
                      if(!exists){
                        upsert('maintenance_requests', {property_id:a.property_id, asset_id:a.id, type:'Preventive', title: `${a.type} service due — ${a.name}`, description: `Auto-generated: ${a.type} ${a.name} at ${propById[a.property_id]?.name} last serviced ${a.last_service_date}, interval ${a.service_interval_months}mo, next due ${next.toISOString().slice(0,10)}`, priority: a.type==='Fire System'?'High':'Medium', status:'Open', reported_date: new Date().toISOString().slice(0,10), due_date: next.toISOString().slice(0,10), assigned_contractor: a.service_provider})
                        created++
                      }
                    }
                  })
                  alert(`Generated ${created} preventive requests`)
                }} style={{fontSize:11,padding:'6px 10px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer'}}>Generate Preventive (90d)</button></div>
                <div style={{maxHeight:400,overflow:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th>Type</th><th>Name</th><th>Property</th><th>Provider</th><th>Last</th><th>Next</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                    {filteredSearch(filteredData.assets, ['name','type','service_provider']).map(a=>{
                      const next = a.last_service_date ? new Date(new Date(a.last_service_date).setMonth(new Date(a.last_service_date).getMonth()+(a.service_interval_months||12))) : null
                      const days = next ? Math.round((next - new Date())/86400000) : null
                      return <tr key={a.id} style={{borderTop:'1px solid #F0EDE8'}}><td><Tag bg="#F0EDE8">{a.type}</Tag></td><td style={{fontWeight:500}}>{a.name}</td><td>{propById[a.property_id]?.name}</td><td style={{fontSize:11}}>{a.service_provider}</td><td style={{fontSize:11}}>{a.last_service_date||''}</td><td><span style={{background: days!==null && days<0?'#FDF2F0': days!==null && days<=30?'#FDF8E8':'#E8EFE8',color: days!==null && days<0?'#B85C4A': days!==null && days<=30?'#8A6A2A':'#1F4B3F',padding:'2px 6px',borderRadius:10,fontSize:10}}>{next? next.toISOString().slice(0,10)+' '+(days<0?`(${Math.abs(days)}d overdue)`: days<=30?`(${days}d)`:'') : 'No date'}</span></td><td><Tag bg={a.status==='Operational'?'#E8EFE8':'#FDF2F0'} color={a.status==='Operational'?'#1F4B3F':'#B85C4A'}>{a.status}</Tag></td><td><button onClick={()=>{setForm(a); setModal({type:'asset'})}} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer',marginRight:4}}>Edit</button><button onClick={()=>remove('assets', a.id)} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Del</button></td></tr>
                    })}
                  </tbody></table>
                </div>
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:12}}>Maintenance — {filteredData.maintenance_requests.length} (preventive + reactive + tenant)</div>
                <div style={{maxHeight:400,overflow:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th>Title</th><th>Type</th><th>Priority</th><th>Status</th><th>Due</th><th>Contractor</th><th>Actions</th></tr></thead><tbody>
                    {filteredSearch(filteredData.maintenance_requests, ['title','description']).map(m=>{
                      const priColor = m.priority==='Critical'?'#B85C4A': m.priority==='High'?'#C08A3E': m.priority==='Medium'?'#4A7A8A':'#9AA8B6'
                      return <tr key={m.id} style={{borderTop:'1px solid #F0EDE8'}}><td><div style={{fontWeight:500}}>{m.title}</div><div style={{fontSize:11,color:'#6B7A8A'}}>{propById[m.property_id]?.name} {m.asset_id?`• ${data.assets.find(a=>a.id===m.asset_id)?.name}`:''}</div></td><td><Tag>{m.type}</Tag></td><td><span style={{display:'inline-block',width:8,height:8,background:priColor,borderRadius:10,marginRight:4}}/>{m.priority}</td><td><Tag bg={m.status==='Open'?'#FDF8E8':'#E8EFE8'}>{m.status}</Tag></td><td>{m.due_date}</td><td style={{fontSize:11}}>{m.assigned_contractor}</td><td><button onClick={()=>{ const contractor = prompt('Assign contractor (name + email):', m.assigned_contractor||''); if(contractor!==null){ upsert('maintenance_requests', {...m, assigned_contractor: contractor, status:'Assigned'}); const subject=`Work Order - ${m.title} - ${propById[m.property_id]?.name}`; const body=`Contractor: ${contractor}\nProperty: ${propById[m.property_id]?.name} - ${propById[m.property_id]?.address}\nAsset: ${m.asset_id? data.assets.find(a=>a.id===m.asset_id)?.name : 'General'}\nIssue: ${m.title}\n${m.description}\nDue: ${m.due_date}\n\nPlease confirm attendance.`; alert(`Work Order Email Draft:\nTo: ${contractor}\nSubject: ${subject}\n\n${body}\n\n(Would send via email in production)` ) } }} style={{fontSize:10,padding:'3px 6px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer',marginRight:4}}>Assign</button><button onClick={()=>upsert('maintenance_requests', {...m, status:'Completed', completed_date: new Date().toISOString().slice(0,10)})} style={{fontSize:10,padding:'3px 6px',border:'1px solid #C7CFC7',borderRadius:6,background:'#E8EFE8',cursor:'pointer',marginRight:4}}>Complete</button><button onClick={()=>remove('maintenance_requests', m.id)} style={{fontSize:10,padding:'3px 6px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Del</button></td></tr>
                    })}
                  </tbody></table>
                </div>
              </div>
            </div>
          </>
        )}

        {view==='compliance' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Compliance — BWoF, Insurance, Fire Evac (NZ)</h2>
              <div style={{display:'flex',gap:8}}><button onClick={()=>openModal('compliance')} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Compliance</button><button onClick={()=>csvExport(filteredData.compliance_items,'compliance.csv')} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Export CSV</button></div>
            </div>
            {filteredData.compliance_items.some(c=> new Date(c.expiry_date) < new Date()) && <div style={{marginTop:12,background:'#FDF2F0',border:'1px solid #E8B4A8',borderRadius:10,padding:'12px 14px',fontSize:12,color:'#8C3B2E'}}>⚠️ Overdue compliance: {filteredData.compliance_items.filter(c=> new Date(c.expiry_date)<new Date()).map(c=> `${c.type} ${c.title} (${c.expiry_date})`).join(', ')} — legal risk for BWoF.</div>}
            <div style={{marginTop:14,background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th style={{padding:'10px 12px'}}>Type</th><th>Title</th><th>Property</th><th>Issue</th><th>Expiry</th><th>Days</th><th>Provider</th><th>Cert Ref</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredSearch(filteredData.compliance_items, ['title','certificate_ref','provider']).sort((a,b)=> new Date(a.expiry_date)-new Date(b.expiry_date)).map(c=>{
                    const days = Math.round((new Date(c.expiry_date)-new Date())/86400000)
                    const status = days<0?'Overdue': days<=60?'Due Soon':'Current'
                    return <tr key={c.id} style={{borderTop:'1px solid #F0EDE8',background: status==='Overdue'?'#FDF2F0': status==='Due Soon'?'#FDF8E8':'#fff'}}><td><Tag bg={c.type==='BWoF'?'#E8EFE8': c.type==='Insurance'?'#F0EDE8':'#FDF8E8'}>{c.type}</Tag></td><td style={{fontWeight:500}}>{c.title}</td><td>{propById[c.property_id]?.name}</td><td>{c.issue_date}</td><td>{c.expiry_date}</td><td style={{color: status==='Overdue'?'#B85C4A': status==='Due Soon'?'#8A6A2A':'#1F4B3F',fontWeight:600}}>{days<0?`${Math.abs(days)}d overdue`: `${days}d`}</td><td>{c.provider}</td><td style={{fontSize:11}}>{c.certificate_ref}</td><td><Tag bg={status==='Overdue'?'#FDF2F0': status==='Due Soon'?'#FDF8E8':'#E8EFE8'} color={status==='Overdue'?'#B85C4A': status==='Due Soon'?'#8A6A2A':'#1F4B3F'}>{status}</Tag></td><td><button onClick={()=>{setForm(c); setModal({type:'compliance'})}} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer',marginRight:4}}>Edit</button><button onClick={()=>remove('compliance_items', c.id)} style={{fontSize:11,padding:'3px 6px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Del</button></td></tr>
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view==='documents' && (
          <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Documents — {filteredData.documents.length}</h2>
              <div style={{display:'flex',gap:8}}><button onClick={()=>openModal('document')} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Add Document</button><button onClick={()=>csvExport(filteredData.documents,'documents.csv')} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'8px 12px',borderRadius:8,cursor:'pointer'}}>Export CSV</button></div>
            </div>
            <div style={{marginTop:14,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {filteredSearch(filteredData.documents, ['name','file_ref','type']).map(d=>{
                const prop = propById[d.property_id]; const lease = data.leases.find(l=>l.id===d.lease_id); const comp = data.compliance_items.find(c=>c.id===d.compliance_id)
                return <div key={d.id} style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:14}}><div style={{display:'flex',justifyContent:'space-between'}}><Tag>{d.type}</Tag><span style={{fontSize:10,color:'#9AA8B6'}}>{d.upload_date}</span></div><div style={{fontWeight:600,marginTop:8,fontSize:13}}>{d.name}</div><div style={{fontSize:11,color:'#6B7A8A',marginTop:4}}>{prop?.name||''} {lease?`• Lease ${lease.standing_invoice_number}`:''} {comp?`• ${comp.title}`:''}</div><div style={{fontSize:11,marginTop:6,wordBreak:'break-all',color:'#6B7A8A'}}>File: {d.file_ref||'no file'} {d.expiry_date?`• Exp ${d.expiry_date}`:''}</div><div style={{marginTop:10,display:'flex',gap:6}}><button onClick={()=>{setForm(d); setModal({type:'document'})}} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8E5DE',borderRadius:6,background:'#fff',cursor:'pointer'}}>Edit</button><button onClick={()=>remove('documents', d.id)} style={{fontSize:11,padding:'4px 8px',border:'1px solid #E8B4A8',borderRadius:6,background:'#FDF2F0',cursor:'pointer'}}>Delete</button></div></div>
              })}
            </div>
          </>
        )}

        {view==='reports' && (
          <>
            <h2 style={{fontFamily:'Fraunces, serif',fontSize:24,margin:0}}>Reports — Phase 3</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:14}}>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:10}}>Lease Status Report (renewal/expiry/rent review)</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}><thead><tr style={{textAlign:'left',fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6'}}><th>Property</th><th>Tenant</th><th>Review</th><th>Expiry</th><th>Term left</th><th>Arrears</th></tr></thead><tbody>
                  {filteredData.leases.map(l=>{
                    const daysToExpiry = Math.round((new Date(l.end_date)-new Date())/86400000)
                    const arr = arrears.find(a=>a.lease.id===l.id)
                    return <tr key={l.id} style={{borderTop:'1px solid #F0EDE8'}}><td>{propById[l.property_id]?.name}</td><td>{tenantById[l.tenant_id]?.name}</td><td>{l.rent_review_date}</td><td>{l.end_date}</td><td>{daysToExpiry}d</td><td style={{color: arr?'#B85C4A':'#1F4B3F'}}>{arr?`$${arr.arrears.toFixed(0)}`:''}</td></tr>
                  })}
                </tbody></table>
                <button onClick={()=>csvExport(filteredData.leases.map(l=>({Property: propById[l.property_id]?.name, Tenant: tenantById[l.tenant_id]?.name, Review: l.rent_review_date, Expiry: l.end_date, Monthly: l.monthly_rent, Status: l.status, StandingInv: l.standing_invoice_number})), 'lease-status-report.csv')} style={{marginTop:10,background:'#fff',border:'1px solid #E8E5DE',padding:'6px 10px',borderRadius:6,cursor:'pointer',fontSize:11}}>Export CSV</button>
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:10}}>Arrears Aging</div>
                {[
                  {label:'Current (paid to date)', filter: a=> a.arrears<=0},
                  {label:'1-30 days', filter: a=> a.arrears>0 && a.arrears <= 4000},
                  {label:'31-60 days', filter: a=> a.arrears>4000 && a.arrears<=8000},
                  {label:'60+ days', filter: a=> a.arrears>8000},
                ].map(b=>{
                  const list = arrears.filter(b.filter)
                  return <div key={b.label} style={{padding:'8px 0',borderBottom:'1px solid #F0EDE8',display:'flex',justifyContent:'space-between',fontSize:12}}><span>{b.label}</span><span>{list.length} leases • ${list.reduce((s,a)=>s+a.arrears,0).toFixed(0)}</span></div>
                })}
                <div style={{marginTop:12,fontSize:11,color:'#6B7A8A'}}>Buckets based on arrears amount — adjust logic to days overdue for production.</div>
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:10}}>Compliance Calendar — Next 12 months</div>
                {Array.from({length:12},(_,i)=>{
                  const d=new Date(); d.setMonth(d.getMonth()+i); const month = d.toISOString().slice(0,7)
                  const items = filteredData.compliance_items.filter(c=> c.expiry_date.startsWith(month))
                  return <div key={month} style={{display:'flex',gap:12,padding:'6px 0',borderBottom:'1px solid #F0EDE8',fontSize:12}}><div style={{width:60,fontWeight:600}}>{month}</div><div>{items.length? items.map(c=> `${c.type} ${propById[c.property_id]?.name}`).join(', ') : <span style={{color:'#9AA8B6'}}>—</span>}</div></div>
                })}
              </div>
              <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:16}}>
                <div style={{fontWeight:600,marginBottom:10}}>Maintenance Forecast — 90 days</div>
                {filteredData.assets.filter(a=>{
                  if(!a.last_service_date) return true
                  const next=new Date(a.last_service_date); next.setMonth(next.getMonth()+(a.service_interval_months||12)); return next < new Date(Date.now()+90*86400000)
                }).map(a=><div key={a.id} style={{padding:'6px 0',borderBottom:'1px solid #F0EDE8',fontSize:12}}>{a.type} {a.name} @ {propById[a.property_id]?.name} — {a.service_provider}</div>)}
                <button onClick={()=>csvExport(filteredData.assets.filter(a=>{ if(!a.last_service_date) return true; const next=new Date(a.last_service_date); next.setMonth(next.getMonth()+(a.service_interval_months||12)); return next < new Date(Date.now()+90*86400000) }).map(a=>({Property: propById[a.property_id]?.name, Asset: a.name, Type: a.type, Provider: a.service_provider, LastService: a.last_service_date, IntervalMonths: a.service_interval_months})), 'maintenance-forecast-90d.csv')} style={{marginTop:10,background:'#fff',border:'1px solid #E8E5DE',padding:'6px 10px',borderRadius:6,cursor:'pointer',fontSize:11}}>Export CSV</button>
              </div>
            </div>
          </>
        )}

        {(view==='my-lease' || view==='my-requests') && (
          <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:20}}>
            <h2 style={{fontFamily:'Fraunces, serif',fontSize:20,margin:0}}>{view==='my-lease'?'My Lease':'My Maintenance Requests'}</h2>
            <pre style={{fontSize:12,background:'#FDFCF8',padding:12,borderRadius:8,marginTop:12,overflow:'auto'}}>{JSON.stringify(filteredData, null, 2).slice(0,6000)}</pre>
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal open={!!modal} onClose={()=>{setModal(null); setForm({})}} title={modal ? `${modal.type} — ${form.id?'Edit':'Add'}` : ''}>
        {modal?.type==='entity' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input placeholder="Entity name e.g. Lakeview Holdings Ltd" value={form.name||''} onChange={e=>setForm({...form, name:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <input placeholder="Tracking tag e.g. LAKEVIEW (must be unique, matches Xero)" value={form.tracking_tag||''} onChange={e=>setForm({...form, tracking_tag:e.target.value.toUpperCase()})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <textarea placeholder="Notes" value={form.notes||''} onChange={e=>setForm({...form, notes:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8,height:60}}/>
            <button onClick={handleSave} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'11px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Save Entity</button>
          </div>
        )}
        {modal?.type==='property' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input placeholder="Property name" value={form.name||''} onChange={e=>setForm({...form, name:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <input placeholder="Address" value={form.address||''} onChange={e=>setForm({...form, address:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <select value={form.entity_id||''} onChange={e=>setForm({...form, entity_id:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}>{data.entities.map(ent=><option key={ent.id} value={ent.id}>{ent.name} ({ent.tracking_tag})</option>)}</select>
            <div style={{display:'flex',gap:8}}><input placeholder="Floor area m²" type="number" value={form.floor_area||''} onChange={e=>setForm({...form, floor_area:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/><input placeholder="Year built" type="number" value={form.year_built||''} onChange={e=>setForm({...form, year_built:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/></div>
            <button onClick={handleSave} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'11px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Save Property</button>
          </div>
        )}
        {modal?.type==='tenant' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <input placeholder="Tenant name" value={form.name||''} onChange={e=>setForm({...form, name:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <input placeholder="Email" value={form.email||''} onChange={e=>setForm({...form, email:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <input placeholder="Phone" value={form.phone||''} onChange={e=>setForm({...form, phone:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <button onClick={handleSave} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'11px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Save Tenant</button>
          </div>
        )}
        {modal?.type==='lease' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <select value={form.property_id||''} onChange={e=>setForm({...form, property_id:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}>{data.properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input placeholder="Unit label (optional, for multi-tenancy)" value={form.unit_label||''} onChange={e=>setForm({...form, unit_label:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <select value={form.tenant_id||''} onChange={e=>setForm({...form, tenant_id:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}>{data.tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <div style={{display:'flex',gap:8}}><input placeholder="Monthly rent" type="number" value={form.monthly_rent||''} onChange={e=>setForm({...form, monthly_rent:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/><input placeholder="OpEx % (e.g. 35)" type="number" value={form.opex_pct||''} onChange={e=>setForm({...form, opex_pct:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/></div>
            <div style={{display:'flex',gap:8}}><input type="date" value={form.start_date||''} onChange={e=>setForm({...form, start_date:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/><input type="date" value={form.end_date||''} onChange={e=>setForm({...form, end_date:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/></div>
            <div style={{display:'flex',gap:8}}><input type="date" value={form.rent_review_date||''} onChange={e=>setForm({...form, rent_review_date:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/><select value={form.status||'active'} onChange={e=>setForm({...form, status:e.target.value})} style={{flex:1,padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}><option value="active">active</option><option value="expired">expired</option><option value="holding_over">holding_over</option></select></div>
            <input placeholder="Standing invoice number (e.g. INV-2024-001)" value={form.standing_invoice_number||''} onChange={e=>setForm({...form, standing_invoice_number:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <input placeholder="Standing invoice total (e.g. monthly * term months)" type="number" value={form.standing_invoice_total||''} onChange={e=>setForm({...form, standing_invoice_total:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8}}/>
            <textarea placeholder="Notes (free text)" value={form.notes||''} onChange={e=>setForm({...form, notes:e.target.value})} style={{padding:'10px',border:'1px solid #E8E5DE',borderRadius:8,height:60}}/>
            <button onClick={handleSave} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'11px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Save Lease</button>
          </div>
        )}
        {['asset','compliance','maintenance','document','xero'].includes(modal?.type) && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{fontSize:12,color:'#6B7A8A'}}>Editing {modal.type} — fill fields then Save. Full field set from handover spec included.</div>
            {Object.keys(form).filter(k=>k!=='id').map(k=>(
              <div key={k}><div style={{fontSize:10,letterSpacing:'0.08em',color:'#9AA8B6',textTransform:'uppercase'}}>{k}</div><input value={form[k]||''} onChange={e=>setForm({...form, [k]:e.target.value})} style={{width:'100%',padding:'8px',border:'1px solid #E8E5DE',borderRadius:6,marginTop:2}}/></div>
            ))}
            <button onClick={handleSave} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'11px',borderRadius:8,cursor:'pointer',fontWeight:600}}>Save {modal.type}</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App/>)
