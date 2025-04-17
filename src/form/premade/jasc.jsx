import update from 'immutability-helper'
import { MinusButton, PlusButton } from '../../component/button'

const action = {
  addRow: 'ADD_ROW',
  removeRow: 'REMOVE_ROW',
  setCat: 'SET_CAT',
  setAtt: 'SET_ATT',
  setVal: 'SET_VAL'
}

const addRow = () => ({ type: action.addRow })
const removeRow = i => ({ type: action.removeRow, i })
const setCat = (i, c) => ({ type: action.setCat, i, c })
const setAtt = (i, a) => ({ type: action.setAtt, i, a })
const setVal = (i, v) => ({ type: action.setVal, i, v })

//perhaps the state should've just been an array all the way through
export const makeS0 = partialState => {
  if (partialState)
    return partialState.map(r => ({ c: r[0], a: r[1], v: r[2] }))
  return []
}
const rowS0 = { c: '', a: '', v: '' }

export const exportValues = (st, s) => st.map(r => [s.et, s.asp, r.c, 0, r.a, r.v])

const reducer = (s, a) => {
  const setRow = (c, _a, v) => update(s, {[a.i]: {$set: { c, a: _a, v }}})
  switch (a.type) {
  case action.addRow: return s.concat(rowS0)
  case action.removeRow: return update(s, {$splice: [[a.i, 1]]})
  case action.setCat: return setRow(a.c, '', '')
  case action.setAtt: return setRow(s[a.i].c, a.a, '')
  case action.setVal: const r = s[a.i]; return setRow(r.c, r.a, a.v)
  }
  return s
}

const Select = p => {
  const [d, os] = p.os.length == 1 ? [true, p.os] : [false, [''].concat(p.os)]
  return <select disabled={d} value={p.v} onChange={e => p.oc(e.target.value)}>
    {os.map((o, i) => <option key={i} value={o}>{o}</option>)}
  </select>
}

const JascRow = p => {
  const cas = p.s.catAtts
  const cats = Object.keys(cas)
  const atts = cas[p.c] || []
  const vals = p.a && p.s.vals || []
  return <div className='jasc-row'>
    <Select l='Category' v={p.c} os={cats} oc={v => p.d(setCat(p.i, v))}/>
    <Select l='Attribute' v={p.a} os={atts} oc={v => p.d(setAtt(p.i, v))}/>
    <Select l='Value' v={p.v} os={vals} oc={v => p.d(setVal(p.i, v))}/>
    <MinusButton aria-label='Remove JASC' onClick={() => p.d(removeRow(p.i))}/>
  </div>
}

//p.st=state, p.s=section
const Jasc = p => {
  const maybeMakeErr = (r, i) => !(r.c && r.a && r.v) && `JASC row ${i+1} must be fully filled out`
  const getErrs = rs => rs.map(maybeMakeErr).filter(x => x)
  const d = a => {
    const st = reducer(p.st, a)
    p.sin(p.sectionId, getErrs(st))
    p.setSt(st)//dispatch
  }
  const rs = l => <span className='required'>{l}</span>//req-span, label
  return <div className='jasc'>
    <div className='jasc-row'>
      {rs('Category')}
      {rs('Attribute')}
      {rs('Value')}
    </div>
    {p.st.map((r, i) => <JascRow key={i} i={i} s={p.s} d={d} { ...r }/>)}
    <PlusButton aria-label='Add JASC' onClick={() => d(addRow())}/>
  </div>
}

export default Jasc