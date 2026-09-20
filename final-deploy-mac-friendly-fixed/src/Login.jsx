
import React, { useState } from 'react'
import { supabase } from './supabase.js'
export default function Login({ onLoggedIn }){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [mode,setMode]=useState('signin')
  const handleSubmit=async(e)=>{
    e.preventDefault(); setLoading(true); setError('')
    try{
      if(!supabase){
        onLoggedIn({id:'demo-admin', email, role:'admin', display_name: email.split('@')[0] || 'Admin', tracking_tag:''})
        return
      }
      if(mode==='signup'){
        const {error} = await supabase.auth.signUp({email,password})
        if(error) throw error
        setError('Check email for confirmation link, then sign in.')
      } else {
        const {data,error} = await supabase.auth.signInWithPassword({email,password})
        if(error) throw error
        const {data:prof} = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        onLoggedIn({...data.user, ...prof})
      }
    }catch(err){ setError(err.message) } finally{ setLoading(false) }
  }
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#FDFCF8'}}>
      <div style={{background:'#fff',border:'1px solid #E8E5DE',borderRadius:16,padding:'36px 32px',width:400,boxShadow:'0 12px 24px rgba(22,40,61,0.06)'}}>
        <div style={{fontFamily:'Fraunces, serif',fontSize:24,fontWeight:600}}>Portfolio Register</div>
        <div style={{fontSize:11,letterSpacing:'0.12em',color:'#9AA8B6',marginTop:6}}>PRIVATE PORTFOLIO • 60 PROPERTIES</div>
        <form onSubmit={handleSubmit} style={{marginTop:28}}>
          <div style={{fontSize:10,letterSpacing:'0.08em',color:'#6B7A8A'}}>EMAIL</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="you@company.co.nz" style={{width:'100%',marginTop:6,padding:'11px 12px',border:'1px solid #E8E5DE',borderRadius:8}}/>
          <div style={{fontSize:10,letterSpacing:'0.08em',color:'#6B7A8A',marginTop:16}}>PASSWORD</div>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={{width:'100%',marginTop:6,padding:'11px 12px',border:'1px solid #E8E5DE',borderRadius:8}}/>
          {error && <div style={{marginTop:12,background:'#FDF2F0',color:'#8C3B2E',padding:'10px',borderRadius:8,fontSize:12}}>{error}</div>}
          <button disabled={loading} style={{width:'100%',marginTop:20,background:'#1F4B3F',color:'#fff',border:'none',padding:'12px',borderRadius:8,fontWeight:600,cursor:'pointer'}}>{loading?'...': mode==='signin'?'Sign in':'Create account'}</button>
        </form>
        <div style={{textAlign:'center',marginTop:14}}>
          <button onClick={()=>setMode(mode==='signin'?'signup':'signin')} style={{background:'none',border:'none',color:'#6B7A8A',fontSize:12,textDecoration:'underline',cursor:'pointer'}}>{mode==='signin'?'Need account? Sign up':'Have account? Sign in'}</button>
        </div>
        {!supabase && <div style={{marginTop:16,fontSize:11,color:'#9AA8B6',background:'#FDFCF8',padding:10,borderRadius:8}}>Demo mode: Supabase not configured. Add VITE_SUPABASE_URL + KEY in Vercel to enable real logins. Demo will log you in as Admin.</div>}
      </div>
    </div>
  )
}
