
export function filterDataByRole(data, profile){
  if(!profile || profile.role==='admin') return data
  if(profile.role==='entity_owner' && profile.entity_id){
    const propIds = new Set(data.properties.filter(p=>p.entity_id===profile.entity_id).map(p=>p.id))
    return {
      ...data,
      properties: data.properties.filter(p=>p.entity_id===profile.entity_id),
      leases: data.leases.filter(l=> propIds.has(l.property_id)),
      entities: data.entities.filter(e=>e.id===profile.entity_id),
      assets: data.assets.filter(a=> propIds.has(a.property_id)),
      compliance_items: data.compliance_items.filter(c=> propIds.has(c.property_id)),
      maintenance_requests: data.maintenance_requests.filter(m=> propIds.has(m.property_id)),
      opex_costs: data.opex_costs.filter(o=> propIds.has(o.property_id)),
      xero_transactions: data.xero_transactions.filter(x=> x.tracking_tag===profile.tracking_tag || propIds.has(data.leases.find(l=>l.id===x.lease_id)?.property_id)),
    }
  }
  if(profile.role==='tenant' && profile.tenant_id){
    const myLeases = data.leases.filter(l=>l.tenant_id===profile.tenant_id)
    const propIds = new Set(myLeases.map(l=>l.property_id))
    return {
      ...data,
      leases: myLeases,
      properties: data.properties.filter(p=> propIds.has(p.id)),
      tenants: data.tenants.filter(t=> t.id===profile.tenant_id),
      maintenance_requests: data.maintenance_requests.filter(m=> m.tenant_id===profile.tenant_id || propIds.has(m.property_id)),
      assets: [], compliance_items: data.compliance_items.filter(c=> propIds.has(c.property_id)),
      xero_transactions: data.xero_transactions.filter(x=> myLeases.some(l=>l.id===x.lease_id)),
      opex_costs: [],
      entities: [],
      documents: data.documents.filter(d=> propIds.has(d.property_id) || myLeases.some(l=>l.id===d.lease_id))
    }
  }
  return data
}
