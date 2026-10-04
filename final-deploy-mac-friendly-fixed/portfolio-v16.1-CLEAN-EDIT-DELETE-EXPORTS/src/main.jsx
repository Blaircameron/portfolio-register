
import React, { useState, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabase.js'

function useAuth(){
  const [user,setUser]=useState(null)
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    if(!supabase){ setLoading(false); return }
    supabase.auth.getSession().then(({data})=>{ setUser(data.session?.user||null) })
    const {data:sub}=supabase.auth.onAuthStateChange((_,session)=>{ setUser(session?.user||null) })
    return ()=>{ sub.subscription.unsubscribe() }
  },[])
  useEffect(()=>{
    if(!user||!supabase){ setProfile(null); setLoading(false); return }
    const run=async()=>{
      setLoading(true)
      const {data:prof}=await supabase.from('profiles').select('*').eq('id',user.id).single()
      if(prof){ setProfile(prof); setLoading(false); return }
      const {data:inv}=await supabase.from('invites').select('*').eq('email',user.email.toLowerCase()).order('created_at',{ascending:false}).limit(1).maybeSingle()
      if(inv){
        const np={id:user.id,email:user.email.toLowerCase(),display_name:inv.display_name||user.email.split('@')[0],role:inv.role}
        const {data:created}=await supabase.from('profiles').insert(np).select().single()
        if(created){ setProfile(created); await supabase.from('invites').update({used:true}).eq('id',inv.id) }
      } else {
        const fb={id:user.id,email:user.email.toLowerCase(),display_name:user.email.split('@')[0],role:'pending'}
        const {data:created}=await supabase.from('profiles').insert(fb).select().single()
        setProfile(created||fb)
      }
      setLoading(false)
    }
    run()
  },[user])
  return {user,profile,loading}
}

function Login(){
  const [email,setEmail]=useState(''),[pw,setPw]=useState(''),[isUp,setIsUp]=useState(false),[msg,setMsg]=useState('')
  const submit=async(e)=>{
    e.preventDefault()
    try{
      if(isUp){
        const {data:inv}=await supabase.from('invites').select('*').eq('email',email.toLowerCase()).limit(1).maybeSingle()
        if(!inv) return setMsg('No invite')
        const {error}=await supabase.auth.signUp({email:email.toLowerCase(),password:pw})
        if(error) throw error
        setMsg('Created - Sign In'); setIsUp(false)
      } else {
        const {error}=await supabase.auth.signInWithPassword({email:email.toLowerCase(),password:pw})
        if(error) throw error
      }
    }catch(err){ setMsg(err.message) }
  }
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#FDFCF8'}}>
    <form onSubmit={submit} style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:12,padding:28,width:360}}>
      <div style={{fontFamily:'serif',fontSize:20,fontWeight:600}}>PORTFOLIO Register</div>
      <div style={{fontSize:10,opacity:0.5,marginTop:4}}>v16.1 • CLEAN • EDIT DELETE + EXPORTS</div>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',marginTop:16,padding:'10px',borderRadius:8,border:'1px solid #E8E5DE'}}/>
      <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} style={{width:'100%',marginTop:10,padding:'10px',borderRadius:8,border:'1px solid #E8E5DE'}}/>
      {msg&&<div style={{marginTop:10,fontSize:12,color:'#B85C4A'}}>{msg}</div>}
      <button type="submit" style={{width:'100%',marginTop:14,background:'#16283D',color:'#fff',border:'none',padding:'10px',borderRadius:8}}>Sign In</button>
      <button type="button" onClick={()=>setIsUp(!isUp)} style={{width:'100%',marginTop:8,background:'transparent',border:'none',fontSize:12,color:'#6B7A8A'}}>{isUp?'Have account?':'Need account?'}</button>
    </form>
  </div>
}

function downloadCSV(filename, rows){
  const csv = rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}
function exportEntity(entity, data){
  const entName = entity.name.replace(/[^a-z0-9]/gi,'_')
  const props = data.properties.filter(p=>p.entity_id===entity.id)
  const ids = props.map(p=>p.id)
  const leases = data.leases.filter(l=>ids.includes(l.property_id))
  const tenants = [...new Set(leases.map(l=>l.tenant_id))].map(id=>data.tenants.find(t=>t.id===id)).filter(Boolean)
  const assets = data.assets.filter(a=>ids.includes(a.property_id))
  const comp = data.compliance_items.filter(c=>ids.includes(c.property_id))
  const leaseRows = [['Entity','Property','Address','Tenant','Email','Rent','Status'], ...leases.map(l=>{const p=props.find(x=>x.id===l.property_id); const t=data.tenants.find(x=>x.id===l.tenant_id); return [entity.name, p?.name||'', p?.address||'', t?.name||'', t?.email||'', l.monthly_rent||0, l.status||'']})]
  downloadCSV(`${entName}_Leases_${new Date().toISOString().slice(0,10)}.csv`, leaseRows)
  const tenantRows = [['Entity','Tenant','Email','Props','Rent'], ...tenants.map(t=>{const tl=leases.filter(l=>l.tenant_id===t.id); const names=tl.map(l=>props.find(p=>p.id===l.property_id)?.name||'').join('; '); const tot=tl.reduce((s,l)=>s+Number(l.monthly_rent||0),0); return [entity.name, t.name, t.email||'', names, tot]})]
  setTimeout(()=>downloadCSV(`${entName}_Tenants_${new Date().toISOString().slice(0,10)}.csv`, tenantRows), 500)
  const assetRows = [['Entity','Property','Type','Name'], ...assets.map(a=>{const p=props.find(x=>x.id===a.property_id); return [entity.name, p?.name||'', a.type||'', a.name||'']})]
  setTimeout(()=>downloadCSV(`${entName}_Assets_${new Date().toISOString().slice(0,10)}.csv`, assetRows), 1000)
  const compRows = [['Entity','Property','Type','Title','Expiry'], ...comp.map(c=>{const p=props.find(x=>x.id===c.property_id); return [entity.name, p?.name||'', c.type||'', c.title||'', c.expiry_date||'']})]
  setTimeout(()=>downloadCSV(`${entName}_Compliance_${new Date().toISOString().slice(0,10)}.csv`, compRows), 1500)
}
function exportPDF(entityId, data, stats){
  const ent = entityId ? data.entities.find(e=>e.id===entityId) : null
  const filtered = ent ? {props:data.properties.filter(p=>p.entity_id===ent.id), leases:data.leases.filter(l=>data.properties.filter(p=>p.entity_id===ent.id).map(p=>p.id).includes(l.property_id)), tenants:data.tenants.filter(t=>data.leases.some(l=>l.tenant_id===t.id&&data.properties.filter(p=>p.entity_id===ent.id).map(p=>p.id).includes(l.property_id))), assets:data.assets.filter(a=>data.properties.filter(p=>p.entity_id===ent.id).map(p=>p.id).includes(a.property_id)), comp:data.compliance_items.filter(c=>data.properties.filter(p=>p.entity_id===ent.id).map(p=>p.id).includes(c.property_id))} : {props:data.properties, leases:data.leases, tenants:data.tenants, assets:data.assets, comp:data.compliance_items}
  const title = ent ? `Portfolio Report - ${ent.name}` : 'Full Portfolio Report'
  const html = `<html><head><title>${title}</title><style>body{font-family:Arial;padding:24px}h1{font-size:20px}h2{font-size:14px;margin-top:16px;border-bottom:2px solid #000}table{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px}th{text-align:left;border-bottom:1px solid #ccc;padding:4px}td{padding:4px;border-bottom:1px solid #eee}.header{background:#16283D;color:#fff;padding:12px;border-radius:8px}</style></head><body><div class="header"><h1>${title}</h1><div>${new Date().toLocaleDateString()} - ${filtered.props.length} props - $${stats.rent.toLocaleString()}/mo</div></div><h2>Leases by Entity</h2><table><tr><th>Property</th><th>Tenant</th><th>Rent</th></tr>${filtered.leases.map(l=>{const p=filtered.props.find(x=>x.id===l.property_id); const t=data.tenants.find(x=>x.id===l.tenant_id); return `<tr><td>${p?.name||''}</td><td>${t?.name||''}</td><td>$${l.monthly_rent||0}</td></tr>`}).join('')}</table><h2>Tenants by Entity</h2><table><tr><th>Tenant</th><th>Email</th></tr>${filtered.tenants.map(t=>`<tr><td>${t.name}</td><td>${t.email||''}</td></tr>`).join('')}</table><h2>Assets</h2><table><tr><th>Property</th><th>Type</th><th>Name</th></tr>${filtered.assets.map(a=>{const p=filtered.props.find(x=>x.id===a.property_id); return `<tr><td>${p?.name||''}</td><td>${a.type||''}</td><td>${a.name||''}</td></tr>`}).join('')}</table><h2>Compliance</h2><table><tr><th>Property</th><th>Type</th><th>Title</th><th>Expiry</th></tr>${filtered.comp.map(c=>{const p=filtered.props.find(x=>x.id===c.property_id); return `<tr><td>${p?.name||''}</td><td>${c.type||''}</td><td>${c.title||''}</td><td>${c.expiry_date||''}</td></tr>`}).join('')}</table></body></html>`
  const w=window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(), 400)
}

const th={textAlign:'left',padding:'8px 10px',borderBottom:'1px solid #E8E5DE',fontSize:10,color:'#9AA8B6'}
const td={padding:'8px 10px',borderBottom:'1px solid #F0EDE8',fontSize:12}

function App(){
  const {user,profile,loading}=useAuth()
  const [view,setView]=useState('dashboard')
  const [data,setData]=useState({properties:[],leases:[],entities:[],tenants:[],compliance_items:[],assets:[],maintenance_requests:[]})
  const [selEnt,setSelEnt]=useState('')
  const [newProp,setNewProp]=useState({name:'',address:'',entity_id:''})
  const [newEnt,setNewEnt]=useState({name:'',tracking_tag:''})
  const [editEnt,setEditEnt]=useState(null)
  const [editProp,setEditProp]=useState(null)
  const [msg,setMsg]=useState('')
  const load=async()=>{
    const r=await Promise.all([
      supabase.from('properties').select('*').order('created_at',{ascending:false}),
      supabase.from('leases').select('*'),
      supabase.from('entities').select('*').order('name'),
      supabase.from('tenants').select('*'),
      supabase.from('compliance_items').select('*'),
      supabase.from('assets').select('*'),
      supabase.from('maintenance_requests').select('*')
    ])
    setData({properties:r[0].data||[],leases:r[1].data||[],entities:r[2].data||[],tenants:r[3].data||[],compliance_items:r[4].data||[],assets:r[5].data||[],maintenance_requests:r[6].data||[]})
  }
  useEffect(()=>{ if(user) load() },[user])

  const filtered=useMemo(()=>{
    if(!selEnt) return data
    const props=data.properties.filter(p=>p.entity_id===selEnt)
    const ids=props.map(p=>p.id)
    return {...data,properties:props,leases:data.leases.filter(l=>ids.includes(l.property_id)),assets:data.assets.filter(a=>ids.includes(a.property_id)),compliance_items:data.compliance_items.filter(c=>ids.includes(c.property_id)),tenants:data.tenants.filter(t=>data.leases.some(l=>l.tenant_id===t.id&&ids.includes(l.property_id)))}
  },[data,selEnt])

  const stats=useMemo(()=>{
    const active=filtered.leases.filter(l=>l.status==='active')
    const rent=active.reduce((s,l)=>s+Number(l.monthly_rent||0),0)
    return {props:filtered.properties.length,active:active.length,rent,tenants:filtered.tenants.length,leases:filtered.leases.length}
  },[filtered])

  const byEntity=useMemo(()=>data.entities.map(ent=>{
    const props=data.properties.filter(p=>p.entity_id===ent.id)
    const ids=props.map(p=>p.id)
    const leases=data.leases.filter(l=>ids.includes(l.property_id))
    const tenants=new Set(leases.map(l=>l.tenant_id))
    const rent=leases.filter(l=>l.status==='active').reduce((s,l)=>s+Number(l.monthly_rent||0),0)
    return {entity:ent,props:props.length,leases:leases.length,tenants:tenants.size,rent,propList:props,leaseList:leases,tenantList:Array.from(tenants).map(id=>data.tenants.find(t=>t.id===id)).filter(Boolean),assetList:data.assets.filter(a=>ids.includes(a.property_id)),compList:data.compliance_items.filter(c=>ids.includes(c.property_id))}
  }),[data])

  const menu=[['dashboard','Dashboard'],['portfolio','Portfolio'],['entity_view','By Entity'],['leases','Leases'],['tenants','Tenants'],['facilities','Facilities'],['compliance','Compliance'],['documents','Documents'],['reports','Reports'],['users','Users']]

  const addEnt=async()=>{
    if(!newEnt.name){ setMsg('Entity name required'); return }
    const tag=newEnt.tracking_tag||newEnt.name.slice(0,6).toUpperCase()
    const {error}=await supabase.from('entities').insert({name:newEnt.name,tracking_tag:tag})
    if(error) setMsg(error.message); else { setMsg('Added entity'); setNewEnt({name:'',tracking_tag:''}); load() }
  }
  const addProp=async()=>{
    if(!newProp.name||!newProp.entity_id){ setMsg('Name + entity required'); return }
    const {error}=await supabase.from('properties').insert({name:newProp.name,address:newProp.address,entity_id:newProp.entity_id})
    if(error) setMsg(error.message); else { setMsg('Added property'); setNewProp({name:'',address:'',entity_id:''}); load() }
  }
  const saveEnt=async()=>{
    if(!editEnt.name){ setMsg('Name required'); return }
    const {error}=await supabase.from('entities').update({name:editEnt.name,tracking_tag:editEnt.tracking_tag}).eq('id',editEnt.id)
    if(error) setMsg(error.message); else { setMsg('Entity updated'); setEditEnt(null); load() }
  }
  const delEnt=async(id)=>{
    const cnt=data.properties.filter(p=>p.entity_id===id).length
    if(cnt>0){ setMsg(`Cannot delete - has ${cnt} properties`); return }
    if(!confirm('Delete entity?')) return
    const {error}=await supabase.from('entities').delete().eq('id',id)
    if(error) setMsg(error.message); else { setMsg('Entity deleted'); if(selEnt===id) setSelEnt(''); load() }
  }
  const saveProp=async()=>{
    if(!editProp.name){ setMsg('Name required'); return }
    const {error}=await supabase.from('properties').update({name:editProp.name,address:editProp.address,entity_id:editProp.entity_id}).eq('id',editProp.id)
    if(error) setMsg(error.message); else { setMsg('Property updated'); setEditProp(null); load() }
  }
  const delProp=async(id)=>{
    const cnt=data.leases.filter(l=>l.property_id===id).length
    if(cnt>0){ setMsg(`Cannot delete - has ${cnt} leases`); return }
    if(!confirm('Delete property?')) return
    const {error}=await supabase.from('properties').delete().eq('id',id)
    if(error) setMsg(error.message); else { setMsg('Property deleted'); load() }
  }

  if(!supabase) return <div style={{padding:20}}>Set env vars</div>
  if(loading) return <div style={{padding:40}}>Loading...</div>
  if(!user) return <Login/>
  if(profile?.role==='pending') return <div style={{padding:40}}>Pending - {user.email} <button onClick={()=>supabase.auth.signOut()}>Sign out</button></div>

  return <div style={{display:'flex',minHeight:'100vh',background:'#FDFCF8',color:'#16283D',fontFamily:'Inter, sans-serif'}}>
    <aside style={{width:260,background:'#16283D',color:'#EAEFEA',padding:'20px 0',flexShrink:0,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'0 18px 14px',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
        <div style={{fontFamily:'serif',fontSize:18,fontWeight:600}}>PORTFOLIO Register</div>
        <div style={{fontSize:9,opacity:0.5,marginTop:6}}>v16.1 • CLEAN BUILD • EDIT DELETE + EXPORTS</div>
        <div style={{fontSize:10,color:'#C08A3E',marginTop:6}}>{profile?.role} • {profile?.display_name}</div>
      </div>
      <div style={{padding:'12px',background:'#1A314D'}}>
        <div style={{fontSize:10,opacity:0.6,marginBottom:6}}>FILTER BY ENTITY</div>
        <select value={selEnt} onChange={e=>setSelEnt(e.target.value)} style={{width:'100%',padding:'8px',borderRadius:8,background:'#16283D',color:'#fff',border:'1px solid rgba(255,255,255,0.2)'}}>
          <option value="">All Entities</option>
          {data.entities.map(en=><option key={en.id} value={en.id}>{en.name} ({data.properties.filter(p=>p.entity_id===en.id).length})</option>)}
        </select>
      </div>
      <nav style={{display:'flex',flexDirection:'column',marginTop:8,flex:1}}>
        {menu.map(([k,l])=><button key={k} onClick={()=>setView(k)} style={{textAlign:'left',padding:'10px 18px',background:view===k?'#1F4B3F':'transparent',color:view===k?'#fff':'#C7D3CB',border:'none',borderLeft:view===k?'3px solid #C08A3E':'3px solid transparent',cursor:'pointer',fontSize:13}}>{l}</button>)}
      </nav>
      <div style={{margin:'0 18px',paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.12)',fontSize:11}}>
        <div>{user.email}</div>
        <button onClick={()=>supabase.auth.signOut()} style={{width:'100%',marginTop:8,background:'transparent',color:'#EAEFEA',border:'1px solid rgba(255,255,255,0.2)',padding:'6px',borderRadius:6}}>Sign out</button>
      </div>
    </aside>
    <main style={{flex:1,padding:'24px 28px',overflow:'auto'}}>
      {msg&&<div style={{background:'#fff',border:'1px solid #E8E5DE',borderLeft:'3px solid #C08A3E',padding:'8px 12px',marginBottom:12,fontSize:12}}>{msg}</div>}
      {selEnt&&<div style={{background:'#1F4B3F',color:'#fff',padding:'10px 14px',borderRadius:8,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><b>{data.entities.find(e=>e.id===selEnt)?.name}</b> • {stats.props} props • ${stats.rent}/mo</div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>{const ent=data.entities.find(e=>e.id===selEnt); exportEntity(ent, data)}} style={{background:'#fff',color:'#1F4B3F',border:'none',padding:'6px 10px',borderRadius:6,fontSize:11,fontWeight:600}}>CSV Bank</button>
          <button onClick={()=>exportPDF(selEnt, data, stats)} style={{background:'#C08A3E',color:'#fff',border:'none',padding:'6px 10px',borderRadius:6,fontSize:11}}>PDF Bank</button>
          <button onClick={()=>setSelEnt('')} style={{background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',padding:'6px 10px',borderRadius:6,fontSize:11}}>Clear</button>
        </div>
      </div>}

      {view==='dashboard'&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h1 style={{fontSize:24,margin:0}}>Portfolio overview {selEnt&&`• ${data.entities.find(e=>e.id===selEnt)?.name}`}</h1>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>exportPDF(selEnt, data, stats)} style={{background:'#16283D',color:'#fff',border:'none',padding:'8px 12px',borderRadius:6,fontSize:12}}>PDF Bank</button>
            <button onClick={()=>{if(!selEnt){alert('Select entity first'); return} const ent=data.entities.find(e=>e.id===selEnt); exportEntity(ent, data)}} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px 12px',borderRadius:6,fontSize:12}}>CSV Bank (4 files)</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:16}}>
          <button onClick={()=>setView('portfolio')} style={{textAlign:'left',background:'#fff',border:'1px solid #E8E5DE',borderRadius:10,padding:'14px',cursor:'pointer'}}>
            <div style={{fontSize:10,color:'#9AA8B6'}}>PROPERTIES → Click to Edit/Delete</div>
            <div style={{fontSize:22,marginTop:6}}>{stats.props}</div>
          </button>
          <button onClick={()=>setView('leases')} style={{textAlign:'left',background:'#fff',border:'1px solid #E8E5DE',borderRadius:10,padding:'14px',cursor:'pointer'}}>
            <div style={{fontSize:10,color:'#9AA8B6'}}>RENT ROLL → Click</div>
            <div style={{fontSize:22,marginTop:6}}>${(stats.rent/1000).toFixed(1)}k/mo</div>
          </button>
          <button onClick={()=>setView('entity_view')} style={{textAlign:'left',background:'#1F4B3F',color:'#fff',borderRadius:10,padding:'14px',cursor:'pointer',border:'none'}}>
            <div style={{fontSize:10,opacity:0.7}}>ENTITIES → Bank Exports</div>
            <div style={{fontSize:22,marginTop:6}}>{data.entities.length} portfolios</div>
          </button>
        </div>
        <div style={{marginTop:16,background:'#fff',border:'1px solid #E8E5DE',borderRadius:10,padding:14}}>
          <b>Lease Reports by Entity — Click entity name to filter, use CSV/PDF buttons for bank</b>
          <table style={{width:'100%',marginTop:10,borderCollapse:'collapse'}}><thead><tr><th style={th}>ENTITY</th><th style={th}>PROPS</th><th style={th}>LEASES</th><th style={th}>TENANTS</th><th style={th}>RENT</th><th style={th}>EXPORT</th></tr></thead><tbody>{byEntity.map(r=><tr key={r.entity.id}><td style={td}><button onClick={()=>{setSelEnt(r.entity.id); setView('entity_view')}} style={{background:'none',border:'none',textDecoration:'underline',cursor:'pointer',fontWeight:600}}>{r.entity.name}</button></td><td style={td}>{r.props}</td><td style={td}>{r.leases}</td><td style={td}>{r.tenants}</td><td style={td}>${r.rent.toLocaleString()}</td><td style={td}><button onClick={()=>exportEntity(r.entity, data)} style={{fontSize:10,padding:'4px 6px',borderRadius:4,border:'1px solid #E8E5DE',background:'#fff',cursor:'pointer',marginRight:4}}>CSV</button><button onClick={()=>exportPDF(r.entity.id, data, {rent:r.rent})} style={{fontSize:10,padding:'4px 6px',borderRadius:4,border:'none',background:'#16283D',color:'#fff',cursor:'pointer'}}>PDF</button></td></tr>)}</tbody></table>
        </div>
      </div>}

      {view==='portfolio'&&<div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:10,padding:18}}>
        <h2 style={{margin:0}}>Portfolio • Edit/Delete Entities & Properties</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
          <div style={{border:'1px solid #E8E5DE',borderRadius:8,padding:12,background:'#FDFCF8'}}>
            <b style={{fontSize:12}}>Add Entity</b>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
              <input placeholder="Entity name" value={newEnt.name} onChange={e=>setNewEnt({...newEnt,name:e.target.value})} style={{padding:'8px',borderRadius:6,border:'1px solid #E8E5DE'}}/>
              <input placeholder="Tag" value={newEnt.tracking_tag} onChange={e=>setNewEnt({...newEnt,tracking_tag:e.target.value})} style={{padding:'8px',borderRadius:6,border:'1px solid #E8E5DE'}}/>
              <button onClick={addEnt} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'8px',borderRadius:6}}>Add Entity</button>
            </div>
            <div style={{marginTop:14}}>
              <div style={{fontSize:10,color:'#9AA8B6',fontWeight:600}}>EXISTING ENTITIES — Edit or Delete</div>
              {data.entities.map(en=>{
                const isEdit = editEnt?.id===en.id
                const cnt = data.properties.filter(p=>p.entity_id===en.id).length
                return <div key={en.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 0',borderBottom:'1px solid #F0EDE8'}}>
                  {isEdit ? (<>
                    <input value={editEnt.name} onChange={e=>setEditEnt({...editEnt,name:e.target.value})} style={{flex:1,padding:'4px',borderRadius:4,border:'1px solid #C08A3E',fontSize:11}}/>
                    <input value={editEnt.tracking_tag} onChange={e=>setEditEnt({...editEnt,tracking_tag:e.target.value})} style={{width:60,padding:'4px',borderRadius:4,border:'1px solid #E8E5DE',fontSize:11}}/>
                    <button onClick={saveEnt} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'4px 8px',borderRadius:4,fontSize:10}}>Save</button>
                    <button onClick={()=>setEditEnt(null)} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'4px 8px',borderRadius:4,fontSize:10}}>Cancel</button>
                  </>) : (<>
                    <span style={{flex:1,fontSize:11}}><b>{en.name}</b> ({en.tracking_tag}) - {cnt} props</span>
                    <button onClick={()=>setEditEnt({id:en.id,name:en.name,tracking_tag:en.tracking_tag})} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'3px 6px',borderRadius:4,fontSize:10}}>Edit</button>
                    <button onClick={()=>delEnt(en.id)} style={{background:'#fff',border:'1px solid #F0C0B0',color:'#B85C4A',padding:'3px 6px',borderRadius:4,fontSize:10}}>Delete</button>
                  </>)}
                </div>
              })}
            </div>
          </div>
          <div style={{border:'1px solid #E8E5DE',borderRadius:8,padding:12,background:'#FDFCF8'}}>
            <b style={{fontSize:12}}>Add Property</b>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
              <input placeholder="Name" value={newProp.name} onChange={e=>setNewProp({...newProp,name:e.target.value})} style={{padding:'8px',borderRadius:6,border:'1px solid #E8E5DE'}}/>
              <input placeholder="Address" value={newProp.address} onChange={e=>setNewProp({...newProp,address:e.target.value})} style={{padding:'8px',borderRadius:6,border:'1px solid #E8E5DE'}}/>
              <select value={newProp.entity_id} onChange={e=>setNewProp({...newProp,entity_id:e.target.value})} style={{padding:'8px',borderRadius:6,border:'1px solid #E8E5DE'}}><option value="">Select Entity</option>{data.entities.map(en=><option key={en.id} value={en.id}>{en.name}</option>)}</select>
              <button onClick={addProp} style={{background:'#16283D',color:'#fff',border:'none',padding:'8px',borderRadius:6}}>Add Property</button>
            </div>
          </div>
        </div>
        <div style={{marginTop:16}}>
          <div style={{fontSize:10,color:'#9AA8B6',fontWeight:600}}>PROPERTIES — Edit name/address/entity or Delete ({filtered.properties.length})</div>
          <table style={{width:'100%',marginTop:8,borderCollapse:'collapse'}}><thead><tr><th style={th}>Property</th><th style={th}>Address</th><th style={th}>Entity</th><th style={th}>Actions</th></tr></thead><tbody>{filtered.properties.map(p=>{
            const ent=data.entities.find(e=>e.id===p.entity_id)
            const isEdit=editProp?.id===p.id
            return <tr key={p.id}>{isEdit ? (<><td style={td}><input value={editProp.name} onChange={e=>setEditProp({...editProp,name:e.target.value})} style={{width:'100%',padding:'4px',borderRadius:4,border:'1px solid #C08A3E',fontSize:11}}/></td><td style={td}><input value={editProp.address} onChange={e=>setEditProp({...editProp,address:e.target.value})} style={{width:'100%',padding:'4px',borderRadius:4,border:'1px solid #E8E5DE',fontSize:11}}/></td><td style={td}><select value={editProp.entity_id} onChange={e=>setEditProp({...editProp,entity_id:e.target.value})} style={{width:'100%',padding:'4px',borderRadius:4,border:'1px solid #E8E5DE',fontSize:11}}>{data.entities.map(en=><option key={en.id} value={en.id}>{en.name}</option>)}</select></td><td style={td}><button onClick={saveProp} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'4px 6px',borderRadius:4,fontSize:10,marginRight:4}}>Save</button><button onClick={()=>setEditProp(null)} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'4px 6px',borderRadius:4,fontSize:10}}>Cancel</button></td></>) : (<><td style={td}>{p.name}</td><td style={td}>{p.address}</td><td style={td}>{ent?.name}</td><td style={td}><button onClick={()=>setEditProp({id:p.id,name:p.name,address:p.address,entity_id:p.entity_id})} style={{background:'#fff',border:'1px solid #E8E5DE',padding:'4px 6px',borderRadius:4,fontSize:10,marginRight:4}}>Edit</button><button onClick={()=>delProp(p.id)} style={{background:'#fff',border:'1px solid #F0C0B0',color:'#B85C4A',padding:'4px 6px',borderRadius:4,fontSize:10}}>Delete</button></td></>)}
            </tr>
          })}</tbody></table>
        </div>
      </div>}

      {view==='entity_view'&&<div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:10,padding:18}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{margin:0}}>By Entity — Breakdown {selEnt&&`• ${data.entities.find(e=>e.id===selEnt)?.name}`}</h2>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>{if(!selEnt){alert('Select entity first'); return} const ent=data.entities.find(e=>e.id===selEnt); exportEntity(ent, data)}} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'6px 10px',borderRadius:6,fontSize:11}}>CSV Bank (4 files)</button>
            <button onClick={()=>exportPDF(selEnt, data, stats)} style={{background:'#C08A3E',color:'#fff',border:'none',padding:'6px 10px',borderRadius:6,fontSize:11}}>PDF Bank</button>
            <button onClick={()=>setView('dashboard')} style={{fontSize:11,padding:'6px 10px',borderRadius:6,border:'1px solid #E8E5DE'}}>Dashboard</button>
          </div>
        </div>
        {byEntity.filter(r=>!selEnt||r.entity.id===selEnt).map(r=><div key={r.entity.id} style={{marginTop:16,border:'1px solid #E8E5DE',borderRadius:8,padding:14,background:selEnt===r.entity.id?'#FFFEF9':'#FDFCF8'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><b>{r.entity.name}</b> • {r.props} props • ${r.rent}/mo • {r.tenants} tenants</div>
            <div style={{display:'flex',gap:4}}>
              <button onClick={()=>exportEntity(r.entity, data)} style={{background:'#1F4B3F',color:'#fff',border:'none',padding:'4px 8px',borderRadius:4,fontSize:10}}>CSV Bank</button>
              <button onClick={()=>exportPDF(r.entity.id, data, {rent:r.rent})} style={{background:'#C08A3E',color:'#fff',border:'none',padding:'4px 8px',borderRadius:4,fontSize:10}}>PDF Bank</button>
              <button onClick={()=>setSelEnt(selEnt===r.entity.id?'':r.entity.id)} style={{fontSize:10,padding:'4px 8px',borderRadius:4,border:'1px solid #E8E5DE',background:selEnt===r.entity.id?'#16283D':'#fff',color:selEnt===r.entity.id?'#fff':'#16283D'}}>{selEnt===r.entity.id?'Filtering':'Filter'}</button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
            <div><div style={{fontSize:10,color:'#9AA8B6',fontWeight:600}}>LEASES BY ENTITY ({r.leaseList.length})</div>{r.leaseList.map(l=>{const p=data.properties.find(x=>x.id===l.property_id); const t=data.tenants.find(x=>x.id===l.tenant_id); return <div key={l.id} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #F0EDE8'}}>{p?.name} — {t?.name} — ${l.monthly_rent}</div>})}{r.leaseList.length===0&&<div style={{fontSize:11,color:'#9AA8B6'}}>No leases</div>}</div>
            <div><div style={{fontSize:10,color:'#9AA8B6',fontWeight:600}}>TENANTS BY ENTITY ({r.tenantList.length})</div>{r.tenantList.map(t=><div key={t.id} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #F0EDE8'}}>{t.name} — {t.email}</div>)}{r.tenantList.length===0&&<div style={{fontSize:11,color:'#9AA8B6'}}>No tenants</div>}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
            <div><div style={{fontSize:10,color:'#9AA8B6',fontWeight:600}}>ASSETS BY ENTITY ({r.assetList.length})</div>{r.assetList.map(a=>{const p=data.properties.find(x=>x.id===a.property_id); return <div key={a.id} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #F0EDE8'}}>{p?.name} — {a.name}</div>})}</div>
            <div><div style={{fontSize:10,color:'#9AA8B6',fontWeight:600}}>COMPLIANCE BY ENTITY ({r.compList.length})</div>{r.compList.map(c=>{const p=data.properties.find(x=>x.id===c.property_id); return <div key={c.id} style={{fontSize:11,padding:'3px 0',borderBottom:'1px solid #F0EDE8'}}>{p?.name} — {c.title} exp {c.expiry_date}</div>})}</div>
          </div>
        </div>)}
      </div>}

      {view!=='dashboard'&&view!=='portfolio'&&view!=='entity_view'&&<div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:10,padding:18}}>
        <div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{margin:0,textTransform:'capitalize'}}>{view} • {filtered.properties.length} props</h2><div style={{display:'flex',gap:6}}><button onClick={()=>{if(!selEnt){alert('Select entity'); return} const ent=data.entities.find(e=>e.id===selEnt); exportEntity(ent, data)}} style={{fontSize:11,padding:'6px 10px',borderRadius:6,border:'none',background:'#1F4B3F',color:'#fff'}}>CSV Bank</button><button onClick={()=>exportPDF(selEnt, data, stats)} style={{fontSize:11,padding:'6px 10px',borderRadius:6,border:'none',background:'#C08A3E',color:'#fff'}}>PDF Bank</button><button onClick={()=>setView('entity_view')} style={{fontSize:11,padding:'6px 10px',borderRadius:6,border:'1px solid #E8E5DE'}}>By Entity</button></div></div>
        <p style={{fontSize:12,color:'#6B7A8A',marginTop:8}}>Filtered to {selEnt?data.entities.find(e=>e.id===selEnt)?.name:'all'}: {filtered.properties.length} props, {filtered.leases.length} leases, {filtered.tenants.length} tenants</p>
        <table style={{width:'100%',marginTop:12,borderCollapse:'collapse'}}><thead><tr><th style={th}>Property</th><th style={th}>Entity</th><th style={th}>Info</th></tr></thead><tbody>{filtered.properties.map(p=>{const ent=data.entities.find(e=>e.id===p.entity_id); return <tr key={p.id}><td style={td}>{p.name}</td><td style={td}>{ent?.name}</td><td style={td}>{filtered.leases.filter(l=>l.property_id===p.id).length} leases</td></tr>})}</tbody></table>
      </div>}
    </main>
  </div>
}
createRoot(document.getElementById('root')).render(<App/>)
