/*export const Single = p => {
  const m = p.f
  return (
    <div className={m.type}>
      <label htmlFor={m.name}>{m.label}</label>
      {p.inner(m, p.value, e => p.dispatch(setField(p.i, e.target.value)))}
    </div>
  )
}

export const Range = p => {
  const m = p.f
  const v = p.val
  const minName = m.name + '-min'
  const maxName = m.name + '-max'
  return (
    <div className={m.type}>
      <label htmlFor={minName}>{m.label} between</label>
      {p.inner({ ...m, name: minName }, p.value.min, e => p.dispatch(setField(p.i, { ...v, min: e.target.value })))}
      <label htmlFor={maxName}> and </label>
      {p.inner({ ...m, name: maxName }, p.value.max, e => p.dispatch(setField(p.i, { ...v, max: e.target.value })))}
    </div>
  )
})

const numField = (m, v, oc) => (
  <input
    type='number'
    name={m.name}
    value={v || ''}
    onChange={e => oc({ target: { value: parseInt(e.target.value) } })}
  />
)

export const innerFields = {
  'bigint-field': numField,
  
  'combo-box': (m, v, oc) => (
    <select
      name={m.name}
      value={v || ''}
      onChange={oc}
    >
      <option value=''></option>
      {m.vos.map((o, j) => <option key={m.name+'_'+j} value={o}>{o}</option>)}
    </select>
  ),
  
  'combo-box/values': (m, v, oc) => (
    <select
      name={m.name}
      value={v || ''}
      onChange={oc}
    >
      <option value=''></option>
      {m.vos.map((o, j) => <option key={m.name+'_'+j} value={o.value}>{o.label}</option>)}
    </select>
  ),
  
  'date-field': (m, v, oc) => (
    <input
      type='date'
      name={m.name}
      value={v || ''}
      onChange={oc}
    />
  ),
  
  'date-time-field': (m, v, oc) => (
    <input
      type='datetime-local'
      name={m.name}
      value={v || ''}
      onChange={oc}
    />
  ),
  
  'integer-field': numField,
  
  'memo-field': (m, v, oc) => (
    <textarea
      name={m.name}
      value={v || ''}
      onChange={oc}
    ></textarea>
  ),
  
  'text-field': (m, v, oc) => (
    <input
      name={m.name}
      value={v || ''}
      onChange={oc}
    />
  )
}*/
