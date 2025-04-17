//TODO: heliport field
//TODO: make sure all fields exist, check with Arend
import { useEffect, useState } from 'react'
import update from 'immutability-helper'
import { post, useCFetch } from '../session'
import SearchableList from '../component/searchable-list'
import ServerSearchableList from '../component/server-searchable-list'
import { CancelButton, MinusButton, OkButton } from '../component/button'
import ButtonBar from '../component/button-bar'
import Box from '../component/box'
import Modal from '../component/modal'
import Separated from '../component/separated'
import Spinner from '../component/spinner'
import { type } from '../form-lib/enums'

export const isField = x => x && x.type === 'field'

export const fieldMode = f => {
  if (f.required) return ['required']
  else if (typeof f.mode === 'string') return [f.mode]
  else if (Array.isArray(f.mode)) return f.mode
  return ['not-required']
}

export const exportValues = fvs => fvs.map(f => {
  if (f.value === '' || f.value === null) return { ...f, value: null }
  let v = f.value
  switch (f['control-class']) {
  case 'airport-field': v = { ...(v.airport && v.airport.data) }; break
  case 'airport-ext-field':
    const tmp = {
      ...(v.airport && v.airport.data),
      ...(v.runway && v.runway.data)
    }
    if (v.gate) tmp.gate = v.gate
    v = tmp
    break
  case 'attachment-field': v = v.local; break
  case 'checkbox-group':
    let it = -1
    return v.map((r, i) => {
      if (!r) return false
      ++it
      return {
        'event-tag': f['event-tag'],
        aspect: f.aspect,
        category: f.category,
        'instance-tag': it,
        attribute: f.attribute,
        value: f['values/options'][i]
      }
    }).filter(x => x)
  case 'date-time-field':
    v = v.replace(/T/, ' ')
    //if (v.match(/:/g).length == 1)//not using seconds//evidently :00 is dropped in the browser
    v += ':00'
    v += f.timezone
    break
  case 'time-field': v += ':00'; break
  case 'user-name-field': v = v['user-name']; break
  default:
  }
  return { ...f, value: v }
})

export const importValue = f => {
  if (f.value === '' || f.value === null || f.value === undefined) {
    if (f['control-class'] === 'attachment-field')
      return { local: [], remote: [] }
    return null
  }
  let v = f.value
  switch (f['control-class']) {
  case 'airport-field': v = v.value; break
  case 'airport-ext-field': break
  case 'attachment-field': v = { local: [], remote: v }; break
  case 'date-time-field': v = v.replace(/ /, 'T'); v = v.slice(0, v.length - 1); break
  case 'time-field': v = v.slice(0, v.length - 3); break
  case 'user-name-field': break
  default:
  }
  return v
}

const exportPremade = (fields, isBasic, etIsZero) => {
  if (fields.length === 0) return []

  const basic = () => fields.filter(f =>
    !(f.parentType === 'employee' && f.name === 'employee-section-review')
  ).map(f => !f.aspect ?
    [f.name, f.value] : [
      f.aspect === 'header' || f.aspect === 'foqa' || etIsZero ? 0 : 1,
      f.aspect,
      f.category,
      f['instance-tag'] || 0,
      f.attribute,
      f.value
    ]
  )
  if (isBasic) return basic()

  switch (fields[0].parentType) {
  //case type.losav2ThreatError:
    //return { ...s, schema: s.children, children: [] }
  //fallthrough
  case type.employee:
    return []
  case type.affectedDepartment:
  case type.affectedFaaApprovedProgram:
  case type.affectedManual:
  case type.affectedRegulatoryComplianceElement:
  case type.attachment:
  case type.hazmatEventInformation:
  case type.foqa:
  case type.jascEvent:
  case type.jascFailure:
  case type.losaErrorInformation:
  case type.losaThreatInformation:
  case type.losaUndesiredAircraftState:
  //case type.losav2ThreatError:
  case type.otherEmployees:
  case type.rmpType:
  case type.losav2ThreatError:
  case type.section:
    return basic()
  //fallthrough
  case type.safety:
    /*return { ...s, children: [{
      type: 'field',
      name: 'checklist-template-id',
      label: 'Path',
      'control-class': 'path-field',
      'values/options': s['checklist-template-paths']
    }]}*/
  //fallthrough
  case type.anticipatedAggregateResidualRiskAssessment:
  case type.anticipatedResidualRiskAssessment:
  case type.riskAssessment:
    /*return {
      ...s,
      jsonml: s.children.jsonml,
      children: s.children.fields
    }*/
  case type.ratWorksheet:
    /*const w = s.children
    const ts = w.children
    return {
      ...s,
      ...w,
      children: ts.map(t => ({
        ...t,
        children: t.children.map(q => ({
          ...q,
          children: [...Array(s.count)].map((x, i) => ({
            type: 'field',
            'control-class': 'checkbox'
          }))
        }))
      }))
    }*/
   return fields
  default:
    throw Error('unknown section: ' + s.type)
  }
}

/*this needs refactoring probably, but the key things are:
* premades
* plain sections
* legacy dialogs or other groups of fields e.g. safety checklist
*/
export const toExportArray = (fields, isBasic, etIsZero) => {
  if (isBasic) return exportPremade(fields, isBasic, etIsZero)
  const gs = Object.groupBy(fields, f => f.parentId)
  return Object.keys(gs).flatMap(k => exportPremade(gs[k], isBasic, etIsZero))
}

const AirportField = p => {
  const a = p.val.airport
  if (p.readonly) return a && a.label || ''
  return (
    <ServerSearchableList
      size='small'
      placeholder='Airport'
      options={async s => await post('airport-search', { value: s })}
      value={a || ''}
      setValue={o => p.set({ airport: o })}
      renderOption={o => o && o.label || ''}
    />
  )
}

const AirportExtField = p => {
  const av = p.val.airport || '' //airport value
  const aid = av && av.data.id
  const getRid = r => r.data['rwy-id']
  const ridv = p.val.runway && getRid(p.val.runway) || '' //it's the ID and select value
  const { data } = useCFetch('runway-list', { airport: av }, [aid], av, [])
  const rs = data || []
  const findR = rid => rs.find(r => rid == getRid(r))//string vs int
  const fetchOs = async s => await post('airport-search', { value: s })
  const aoc = o => {
    //keep gate
    const tmp = p.val
    delete tmp.runway
    p.set({ ...tmp, airport: o })
  }
  const roc = e => p.set({ ...p.val, runway: findR(e.target.value) })
  const goc = e => p.set({ ...p.val, gate: e.target.value })
  return <>
    <ServerSearchableList size='small' placeholder='Airport' options={fetchOs} value={av} setValue={aoc} renderOption={o => o && o.label || ''}/>
    <select disabled={!av} value={ridv} onChange={roc}>
      <option value=''>Runway</option>
      {rs.map((r, i) => <option key={i} value={getRid(r)}>{r.label}</option>)}
    </select>
    <input placeholder='Gate' value={p.val.gate || ''} onChange={goc}/>
  </>
}

const AttachmentLocalTr = p => {
  return <div className='attachment-row'>
    <span><input type='checkbox' readOnly disabled/></span>
    <span>{p.a.name}</span>
    <span></span>
    <span></span>
    <span></span>
    <MinusButton onClick={() => p.rem(p.i)}/>
  </div>
}

const AttachmentUploadedTr = p => {
  return <div className='attachment-row'>
    <span><input type='checkbox' readOnly disabled checked/></span>
    <span>{p.a.filename}</span>
    <span>{p.a.date}</span>
    <span>{p.a.viewer}</span>
    <span>{p.a.description}</span>
    <MinusButton onClick={async () => {
      const r = await post('object-delete-attachment', { id: p.a.id })
      if (r.data === 'ok')
      p.rem(p.a.id)
    }}/>
  </div>
}

const AttachmentsField = p => {
  const oc = e => p.set({ ...p.val, local: Array.from(e.target.files) })
  const remLocal = i => () => p.set({ ...p.val, local: p.val.local.filter((a, j) => i !== j) })
  const remRemote = id => p.set({ ...p.val, remote: p.val.remote.filter(a => a.id !== id) })
  return <div className='attachments'>
    <div className='attachment-row'>
      <label>Uploaded</label>
      <label>Filename</label>
      <label>Date</label>
      <label>Viewer</label>
      <label>Description</label>
    </div>
    {p.val.local.map((a, i) => <AttachmentLocalTr key={i} i={i} a={a} rem={remLocal(i)}/>)}
    {p.val.remote.map((a, i) => <AttachmentUploadedTr key={i} a={a} rem={remRemote}/>)}
    <input multiple name='attachment' type='file' accept='.csv' onChange={oc}/>
  </div>
}

const CheckboxGroup = p => {
  const os = p.f['values/options']
  useEffect(() => { p.set(Array(os.length).fill(false)) }, [])
  const n = o => `${p.f.attribute}-${o}`
  const c = i => p.val[i] || false
  const onChange = i => e => p.set(p.val.toSpliced(i, 1, e.target.checked))
  return os.map((o, i) => <div key={i} className='field'>
    <input type='checkbox' name={n(o)} required={p.f.required} checked={c(i)} onChange={onChange(i)}/>
    <label htmlFor={n(o)}>{o}</label>
  </div>)
}

const EditableComboBox = p => {
  const [i, setI] = useState(0)
  if (p.f.readonly) return p.val
  return (
    <SearchableList
      size='small'
      placeholder='Search ...'
      options={p.f['values/options']}
      value={p.val}
      setValue={p.set}
      searchStringIsValue={true}
      renderOption={o => o}
      optionSearchString={o => o}
      index={i}
      setIndex={setI}
    />
  )
}

export const ElemEditor = p => {
  const [edit, setEdit] = useState(false)
  const [text, setText] = useState(p.val)
  const t = text || ''
  
  if (p.f.readonly)
    return p.val
  
  const onClose = () => {
    setText(p.val)
    setEdit(false)
  }
  
  return !edit ?
    <input
      value={t.length <= 20 ? t : t.substring(0, 20) + '...'}
      onFocus={() => setEdit(true)}
      readOnly
    /> :
    <Modal onClose={onClose}>
      <Box>
        <Separated size='small'>
          <textarea
            autoFocus
            value={t}
            onChange={e => setText(e.target.value)}
            rows={20}
            cols={80}
          />
          <ButtonBar className='wide'>
            <OkButton onClick={() => {
              setText(text)
              setEdit(false)
              p.set(text)
            }}/>
            <CancelButton onClick={onClose}/>
          </ButtonBar>
        </Separated>
      </Box>
    </Modal>
}

const findHlpt = o => window.heliports.find(h => h.id === o.heliport)

const HeliportField = p => {
  const [hlpt, setHlpt] = useState((p.val && findHlpt(p.val)) || null)
  const [i, setI] = useState(0)
  if (p.readonly)
    return (hlpt && hlpt.name) || ''
  return (
    <SearchableList
      size='small'
      placeholder='Search heliport ...'
      options={window.heliports}
      value={hlpt || ''}
      setValue={o => {
        setHlpt(o)
        p.set(o)
      }}
      renderOption={o => (o && o.name) || ''}
      optionSearchString={o => `${o.id}${o.name}`}
      index={i}
      setIndex={setI}
    />
  )
}

const LatLongField = p => {
  const { latitude, longitude } = p.val
  const lbl = <label>{`${p.f.label} (Lat / Long)`}</label>
  if (p.f.readonly) {
    return (
      <>
        {lbl}
        <span>{latitude} / {longitude}</span>
      </>
    )
  }

  const set = k => e => p.set({ ...p.val, [k]: e.target.value })
  return (
    <>
      {lbl}
      <input value={latitude} onChange={set('latitude')}/>
      &nbsp;/&nbsp;
      <input value={longitude} onChange={set('longitude')}/>
    </>
  )
}

const UsernameField = p => {
  const [val, setVal] = useState(p.val)
  const [i, setI] = useState(0)
  
  const f = (sep, val, closer='') => val ? sep + val + closer : ''
  
  const render = o => {
    if (!o) return ''
    return (
      f('', o['last-name']) +
      f(' ', o.suffix) +
      f(', ', o['first-name']) +
      f(' ', o['middle-initial']) +
      f(' (', o['employee-number'], ')')
    )
  }
  
  if (p.f.readonly) return render(val)
  return (
    <SearchableList
      size='small'
      placeholder='Search username ...'
      options={s => post('find-poc', {
        type: 'name',
        val: s,
        usergroup: null
      })}
      value={val || ''}
      setValue={v => {
        setVal(v)
        p.set(v)
      }}
      renderOption={render}
      optionSearchString={o =>
        o['first-name'] +
        o['last-name'] +
        o['user-name'] +
        o['employee-number']
      }
      index={i}
      setIndex={setI}
    />
  )
}

//convert id + path array into nested hashes with id + leaves
//this is to make "cascading" <select>s where the leaves have primary keys
export const treeify = os => {
  const root = {}
  os.forEach(o => {
    const a = o.path[0]
    if (!root.hasOwnProperty(a))
      root[a] = {}
    const ra = root[a]
    const b = o.path[1]
    if (!ra.hasOwnProperty(b))
      ra[b] = []
    const rab = ra[b]
    const c = o.path[2]
    if (!rab.find(x => x.title === c))
      rab.push({ id: o.id, title: c })
  })
  return root
}

//currently very specific to checklist-template but hypothetically
//could support any sort of path (e.g. taxonomy)
const PathField = p => {
  const [path, setPath] = useState(['', '', ''])
  const setI = (i, v) => {
    const newPath = update(path, {$splice: [[i, 3-i, v].concat(Array(2-i).fill(''))]})
    setPath(newPath)
    if (i === 2 && v !== '') p.set(cs.find(c => c.title === v).id)
    else p.set('')
  }
  const { labels, paths } = p.f['values/options']
  const vos = treeify(paths)
  const as = Object.keys(vos)
  const bs = (path[0] && Object.keys(vos[path[0]])) || []
  const cs = (path[1] && vos[path[0]][path[1]]) || []
  const cs_ = cs.map(c => c.title)
  return <>{[as, bs, cs_].map((xs, i) => <select
    className='path-field-element'
    key={i}
    value={path[i]}
    onChange={e => setI(i, e.target.value)}
  >
    <option disabled value=''>{labels[i]}</option>
    {xs.map((x, j) => <option key={j} value={x}>{x}</option>)}
  </select>)}</>
}

const InnerField = p => {
  const f = p.f
  const _p = {
    name: `${f.aspect}-${f.category}-${f.attribute}`,
    value: p.val,
    required: f.required || f.mode === 'required'//NOTE: not strictly required if mode is a list
  }
  const cc = f['control-class']
  const set = p.set
  switch (cc) {
  case 'airport-field':
    return <AirportField f={f} val={p.val} set={set}/>

  case 'airport-ext-field':
    return <AirportExtField f={f} val={p.val} set={set}/>

  case 'attachment-field':
    return <AttachmentsField f={f} val={p.val} set={set}/>

  case 'bigint-field':
    return <input
      { ..._p }
      type='number'
      onChange={e => set(parseInt(e.target.value))}
    />

  case 'checkbox':
    return <input
      type='checkbox'
      name={_p.name}
      required={_p.required}
      checked={_p.value}
      onChange={e => set(e.target.checked)}
    />

  case 'checkbox-group':
    throw Error('should not have checkbox-group as an inner field')

  case 'combo-box':
    return <select
      { ..._p }
      onChange={e => set(e.target.value)}
      // The initial option value was made dependent on required as a short term solution
    >
      {(!f.required) && <option value=''></option>}
      {f['values/options'].map((o, i) => <option key={i} value={o}>{o}</option>)}
    </select>

  case 'combo-box/values':
    return <select
      { ..._p }
      onChange={e => set(e.target.value)}
    >
      <option value=''></option>
      {f['values/options'].map((o, i) =>
        <option key={i} value={o.value}>{o.label}</option>
      )}
    </select>

  case 'date-field':
    return <input
      { ..._p }
      type='date'
      onChange={e => set(e.target.value)}
    />

  case 'date-time-field':
    return <input { ..._p } type='datetime-local' onChange={e => set(e.target.value)}/>

  case 'editable-combo-box':
    return <EditableComboBox
      { ..._p } f={f} val={p.val} set={set}
    />

  case 'heliport-field':
    return <HeliportField f={f} val={p.val} set={set}/>

  case 'integer-field':
    return <input
      { ..._p }
      type='number'
      onChange={e => set(parseInt(e.target.value))}
    />
  
  case 'link':
    return <a href={f.url} target={f.target}>{f.value}</a>

  case 'memo-field':
    return <textarea
      { ..._p }
      onChange={e => set(e.target.value)}
      rows={f.rows || 10}
      cols={f.cols || 60}
    />
  
  case 'modal-memo-field':
    return <ElemEditor
      f={f}
      val={p.val}
      set={set}
    />

  case 'path-field':
    return <PathField { ..._p } f={f} val={p.val} set={set}/>

  case 'lat-long-field':
    return <LatLongField { ..._p } f={f} val={p.val} set={set}/>

  case 'radio':
    return <input
      type='radio'
      name={_p.name}
      value={f.radioValue}
      required={_p.required}
      checked={p.val === f.radioValue}
      onChange={e => set(e.target.checked && f.radioValue)}
    />

  case 'real-field':
    return <input
      { ..._p }
      type='number'
      step='any'
      onChange={e => set(parseFloat(e.target.value))}
    />

  case 'text-field'://copied into waypoint-field
    return <input
      { ..._p }
      onChange={e => set(e.target.value)}
    />

  case 'time-field':
    return <input { ..._p } type='time' onChange={e => set(e.target.value)}/>

  case 'user-name-field':
    return <UsernameField key={p.val && p.val['user-name']}
      { ..._p } f={f} val={p.val} set={set}
    />

  case 'navaid-field':
  case 'procedure-field':
  case 'waypoint-field'://currently a copy of text-field
    return <input
      { ..._p }
      onChange={e => set(e.target.value)}
    />

  default:
    return `control-class "${cc}" N/I`
  }
}

const Field = p => {
  const cc = p.f['control-class']
  const renderReadonly = () => {
    switch (cc) {
    case 'airport-field':
    case 'airport-ext-field':
    case 'editable-combo-box':
    case 'modal-memo-field':
    case 'link':
    case 'user-name-field': return <InnerField
      f={p.f}
      val={p.val}
      set={p.set}
    />
    case 'checkbox': return p.val === true ? 'Yes' : 'No'
    default: return p.val
    }
  }
  
  const show = () => p.f.readonly ?
    renderReadonly() :
    <InnerField
      f={p.f}
      val={p.val}
      set={p.set}
    />
  
  const lbl = !(p.nolabel || !p.f.label || cc === 'lat-long-field') &&
    <label className={fieldMode(p.f)[0]}>{p.f.label}</label>
  
  const fld = p.loading ? <Spinner/> : show()

  if (cc === 'checkbox-group') return <CheckboxGroup f={p.f} val={p.val} set={p.set}/>
  
  return (
    <div className={`field ${p.className || ''}`}>
      {(cc === 'checkbox' || cc === 'radio') && !p.f.readonly ?
        <>{fld}{lbl}</> :
        <>{lbl}{fld}</>
      }
    </div>
  )
}

export default Field
