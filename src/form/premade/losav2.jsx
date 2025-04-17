//#region Imports
import update from 'immutability-helper'
import { MinusButton, PlusButton } from '../../component/button'
//#endregion

//#region STATE, ACTIONS, REDUCER
const actions = {
  setValue: 'SET_VALUE',
  addGroup: 'ADD_GROUP',
  deleteGroup: 'DELETE_GROUP'
}

const setValue = (ks, v) => ({ type: actions.setValue, ks: ks, v: v })
const addGroup = (n, sn) => ({ type: actions.addGroup, n: n, sn: sn })
const deleteGroup = (n, sn, gid) => ({ type: actions.deleteGroup, n: n, sn: sn, gid: gid })

export const makeS0 = (schema, partialState={}) => {
  const s = {}
  schema.op.forEach(op => {
    s[op.n] = {}
    op.subs.forEach(sop => s[op.n][sop.sn] = { value: '', groups: [] })
  })
  Object.keys(partialState).forEach(opk => {
    const sops = partialState[opk]
    Object.keys(sops).forEach(sopk => {
      const psop = sops[sopk]
      const ssop = s[opk][sopk]
      ssop.value = psop.value
      ssop.groups = psop.groups
    })
  })
  return s
}

const xatt = (it, att, val) => val === '' ? null :
  [0, 'header', 'losav2-threat-error', it, att, val]
export const exportValues = s => (
  //return s.flatMap(ops =>
    //starting with the repeated section count in the form definition
  Object.keys(s).flatMap(opk => {//observation phase label
    const op = s[opk]
    return Object.keys(op).flatMap(sopk => {//sub-observation phase label
      const sop = op[sopk]
      const sopVal = [
        ['observation-phase', opk],
        ['sub-observation-phase', sopk]
      ]
      if (sop.value !== '')
        sopVal.push(['value', sop.value])
      const gsVals = sop.groups.map(g =>
        sopVal.concat(Object.keys(g)
          .map(gk => [gk, g[gk]])
          .filter(r => r[1] !== '')
        )
      )
//            .filter(g => g.length > 0)
      return gsVals.length === 0 ?
        (sopVal.length === 2 ? null : [sopVal]) :
        gsVals
    })
  })
    .filter(r => r !== null)
    //this is now a grouping of attributes as an array of instance tags, so flatten and finalize
    .flatMap((avs, it) => avs.map(av => xatt(it, av[0], av[1])))
)

const reducer = (s, a) => {
  switch (a.type) {
  case actions.setValue:
    const k = a.ks[0]
    if (a.ks.length === 1)
      return update(s, {[k]: {$set: a.v}})
    if (!Array.isArray(s)) {
      return update(s, {
        [k]: {$set: reducer(s[k], { ...a, ks: a.ks.slice(1) })}
      })
    }
    const arr = s.slice()
    arr[k] = reducer(s[k], { ...a, ks: a.ks.slice(1) })
    return arr
  case actions.addGroup:
    const g = {
      'crew-uas-response': '',
      'uas-outcome': '',
      'human-factor': '',
      'comment': '',
      'threat': '',
      'sub-threat': '',
      'error': '',
      'sub-error': '',
      'uas': '',
      'sub-uas': ''
    }
    return reducer(s, setValue(
      [a.n, a.sn, 'groups'],
      s[a.n][a.sn].groups.concat(g)
    ))
  case actions.deleteGroup:
    return reducer(s, setValue(
      [a.n, a.sn, 'groups'],
      s[a.n][a.sn].groups.filter((x, i) => i !== a.gid)
    ))
  default:
    return s
  }
}

const logReducer = (s, a) => {
  const s1 = reducer(s, a)
  console.log(a, s, s1)
  return s1
}
//#endregion

//#region Queries
export const getSubmitData = s => {
  return s
}
//#endregion

//#region UI
const SingleSelect = p => {
  const n = p.op.n
  const sn = p.sop.sn
  const [a, b] = Array.from(p.layout).map(s => ({ gridArea: s }))
  return (
    <>
      <label style={a}>{p.label}</label>
      <select
        style={b}
        aria-label={p.label}
        value={p.s[n][sn].groups[p.gid][p.ikey]}
        onChange={e => p.d(setValue(
          [n, sn, 'groups', p.gid, p.ikey],
          e.target.value
        ))}
      >
        <option></option>
        {p.sc[p.skey].map((x, i) => <option key={i} value={x}>{x}</option>)}
      </select>
    </>
  )
}

const SelectFamily = p => {
  const n = p.op.n
  const sn = p.sop.sn
  const i = p.s[n][sn].groups[p.gid]
  const v = i[p.ikey]
  const sk = 'sub-' + p.ikey
  const sv = i[sk]
  const parents = p.sc[p.skey]
  const subl = 'Sub-' + p.label
  const [a, b, c, d] = Array.from(p.layout).map(s => ({ gridArea: s }))
  return (
    <>
      <label style={a}>{p.label}</label>
      <select
        style={b}
        aria-label={p.label}
        value={v}
        onChange={e => p.d(setValue(
          [n, sn, 'groups', p.gid, p.ikey],
          e.target.value
        ))}
      >
        <option></option>
        {parents.map((x, i) => <option key={i} value={x.n}>{x.n}</option>)}
      </select>
      <label style={c}>{subl}</label>
      <select
        style={d}
        aria-label={subl}
        value={sv}
        onChange={e => p.d(setValue(
          [n, sn, 'groups', p.gid, sk],
          e.target.value
        ))}
      >
        <option></option>
        {!v ? <></> : parents.find(x => x.n === v).subs.map((x, i) =>
          <option key={i} value={x.sn}>{x.sn}</option>
        )}
      </select>
    </>
  )
}

const Group = p => {
  const n = p.op.n
  const sn = p.sop.sn
  return (
    <div className='losav2-group'>
      <div className='losav2-group-contents'>
        {[
          ['t','threat','Threat','abcd'],
          ['e','error','Error','efgh'],
          ['u','uas','UAS','ijkl']
        ].map((x, i) => <SelectFamily
          key={i}
          layout={x[3]}
          s={p.s}
          d={p.d}
          sc={p.sc}
          skey={x[0]}
          ikey={x[1]}
          label={x[2]}
          op={p.op}
          sop={p.sop}
          gid={p.gid}
        />)}
        {[
          ['cur','crew-uas-response','Crew UAS Response','mn'],
          ['uo','uas-outcome','UAS Outcome','op'],
          ['hf','human-factor','Human Factor','qr']
        ].map((x, i) => <SingleSelect
          key={i}
          layout={x[3]}
          s={p.s}
          d={p.d}
          sc={p.sc}
          skey={x[0]}
          ikey={x[1]}
          label={x[2]}
          op={p.op}
          sop={p.sop}
          gid={p.gid}
        />)}
        <div style={{ gridArea: 's' }}>
          <label style={{ display: 'block' }}>Comment</label>
          <textarea
            aria-label={n + ' ' + sn + ' Comment'}
            rows='10'
            cols='80'
            wrap='soft'
            value={p.s[n][sn].groups[p.gid].comment}
            onChange={e => p.d(setValue(
              [n, sn, 'groups', p.gid, 'comment'],
              e.target.value
            ))}
          ></textarea>
        </div>
      </div>
      <MinusButton aria-label='Remove Observation' onClick={
        () => p.d(deleteGroup(n, sn, p.gid))
      }/>
    </div>
  )
}

const SubObservationPhase = p => {
  const n = p.op.n
  const sn = p.sop.sn
  const i = p.s[n][sn]
  const sts = p.sc.sts
  return (
    <div className='losav2-sub-observation'>
      <label>{sn}</label>
      <select
        aria-label={n + ' ' + sn}
        className='losav2-value'
        value={i.value}
        onChange={e => p.d(setValue([n, sn, 'value'], e.target.value))}
      >
        <option></option>
        {p.sc.v.map((o, i) => <option key={i} value={o}>{o}</option>)}
      </select>
      {i.groups.map((x, i) => <Group
        key={i} s={p.s} d={p.d} sc={p.sc} op={p.op} sop={p.sop} gid={i} data={x}
      />)}
      {!sts ? '' : <PlusButton aria-label='Add Observation' onClick={
        () => p.d(addGroup(n, sn))
      }/>}
    </div>
  )
}

const ObservationPhase = p => (
  <div className='losav2-observation'>
    <label>{p.op.n}</label>
    {p.op.subs.map((sop, i) => <SubObservationPhase
      key={i} s={p.s} d={p.d} sc={p.sc} op={p.op} sop={sop}
    />)}
  </div>
)

const Losav2 = p => {
  const sc = p.s.schema
  const dispatch = a => p.setSt(reducer(p.st, a))
  return (
    <div className='losav2'>
      {sc.op.map((op, i) => <ObservationPhase
        key={i} s={p.st} d={dispatch} sc={sc} op={op}
      />)}
    </div>
  )
}

export default Losav2
//#endregion