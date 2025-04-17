import update from 'immutability-helper'
import Separated from '../../component/separated'

const wForEach = (ts, f) => ts.forEach(t =>
  t.children.forEach(q =>
    q.children.forEach((l, i) => {
      f(t, q, l, i)
    })
  )
)

export const init = w => {
  let st = []
  let sid = -1
  const ts = w.children.map(t => ({
    ...t,
    children: t.children.map(q => ({
      ...q,
      children: [...Array(w.count)].map(l => {
        ++sid
        st.push(false)
        return sid
      })
    }))
  }))
  return [ts, st]
}

const action = {
  toggle: 'TOGGLE'
}

const toggle = (ts, i, me) => ({ type: action.toggle, ts, i, me })//me=mutually exclusive

const reducer = (s, a) => {
  switch (a.type) {
  case action.toggle:
    const v = s[a.i]
    if (v || !a.me) return update(s, {[a.i]: {$set: !s[a.i]}})
    const s1 = s.slice()
    s1[a.i] = false
    wForEach(ts, (t, q, l, i) => s1[i] = false)
    return s1
  default: return s
  }
}

export const exportValues = st => ({ customExport: { ratWorksheet: st } })

const RatTable = p => (
  <table className='rat-worksheet nostyle'>
    <thead>
      {p.bh && <tr>{p.bh}</tr>}
      <tr>{p.hs.map((h, i) => <th key={i}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {p.rs.map((r, i) => <tr key={i}>
        {r.map((v, j) => <td key={j}>{v}</td>)}
      </tr>)}
    </tbody>
  </table>
)

const Tags = p => {
  const bh = t => <th colSpan={2+p.n}>
    {t.name + (t['mutually-exclusive'] ? ' (Mutually Exclusive)' : '')}
  </th>
  const hs = ['Question', 'Weight'].concat([...Array(p.n)].map((x, i) => 'Leg ' + (i+1)))
  //slight overkill in that you can't uncheck a different row since it could
  //never have also been checked to begin with
  const rs = t => t.children.map(q =>
    [q.question, q.weight].concat(q.children.map((l, i) => <input
      key={i}
      type='checkbox'
      value={p.st[l]}
      onChange={e => p.toggle(l, t['mutually-exclusive'])}
    />))
  )
  return p.ts.map((t, i) => <RatTable key={i} bh={bh(t)} hs={hs} rs={rs(t)}/>)
}

const Totals = p => {
  const totals = Array(p.n).fill(0)
  wForEach(p.ts, (t, q, l, i) => {
    if (p.st[i].value) totals[i] += q.weight
  })
  const rs = totals.map((tot, i) => [i+1, tot])
  return <RatTable hs={['Leg', 'Score']} rs={rs}/>
}

const Rules = p => {
  const score = r => r.max !== false ?
    `${r.min} - ${r.max}` :
    r.min + '+'
  const hs = ['Score', 'Risk', 'Statement', 'Automatic Processing']
  const rs = p.rules.map(
    r => [score(r), r.risk, r.statement, r['automatic-processing']]
  )
  return <RatTable hs={hs} rs={rs}/>
}

const RatWorksheet = p => {
  const c = p.s.children
  if (typeof c[0] === 'string') return c[0]
  const d = a => p.setSt(reducer(p.st, a))//dispatch
  const ts = p.s.ts
  const n = p.s.count
  return <Separated size='medium'>
    <Tags n={n} ts={ts} st={p.st} toggle={(i, me) => d(toggle(ts, i, me))}/>
    <Totals n={n} ts={ts} st={p.st}/>
    <Rules rules={p.s.w.score}/>
  </Separated>
}

export default RatWorksheet
