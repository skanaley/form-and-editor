import { Fragment, useState } from 'react'
import { post, useFetch } from '../../session'
import Button, { SearchButton } from '../../component/button'

const _status = {
  start: 'Search for flights',
  noneFound: 'No flights found',
  notSelected: 'Please select a flight'
}

const type = {
  date: 'DATE',
  select: 'SELECT',
  text: 'TEXT'
}

const Field = p => {
  const f = p.f
  switch (f.type) {
  case type.date: return <input type='date' value={f.v} onChange={f.s}/>
  case type.select: return <select value={f.v} onChange={f.s}>
    <option value=''></option>
    {f.os.map((o, i) => <option key={i} value={o[0]}>{o[1]}</option>)}
  </select>
  case type.text: return <input value={f.v} onChange={f.s}/>
  default: throw Error('Field: unknown type: ' + f.type)
  }
}

const Form = p => <div className='form'>
  <div className='fields'>{p.fs.map((f, i) => <Fragment key={i}>
    <label>{f.l}</label>
    <Field f={f}/>
  </Fragment>)}</div>
  <SearchButton onClick={p.search}/>
</div>

const Flights = p => <div className='flights'>
  <select size={6} value={p.v} onChange={p.sv}>
    <option value=''></option>
    {p.os.map((o, i) => <option key={i} value={o[0]}>{o[1]}</option>)}
  </select>
  <Button type='other' text='Select' onClick={p.ofs}/>
</div>

const FlightSelect = p => {
  const [search, setSearch] = useState({
    dt: '',
    fn: '',
    tn: '',
    dep: '',
    arr: '',
    ldg: ''
  })
  const [status, setStatus] = useState(_status.start)
  const [val, setVal] = useState('')
  const { data, error } = useFetch('flight-select-tail-numbers', {}, [])
  if (process.env.NODE_ENV === 'development') {
    if (error) {
      console.log(error)
      return `Form: ${error.message}`
    }
  }
  if (!data) return 'Loading ...'

  const tmpModKey = (k, f) => ({ ...search, [k]: f(search[k]) })
  const setKey = k => e => setSearch(s => ({ ...s, [k]: e.target.value }))
  
  const postSearch = async () => {
    const fmtDt = dtStr => {
      if (dtStr === '') return ''
      const dt = new Date(dtStr)
      return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`//not sure this is correct in general
    }
    const r = await post('flight-select-list', tmpModKey('dt', fmtDt))
    const fs = r.data
    setStatus(fs.length === 0 ? _status.noneFound : fs)
  }

  const sv = e => setVal(e.target.value)
  const ofs = () => p.s.onFlightSelect(val)

  const ctrl = t => (l, k) => ({ type: t, l, v: search[k], s: setKey(k) })
  const date = ctrl(type.date)
  const select = os => (l, k) => ({ ...ctrl(type.select)(l, k), os })
  const text = ctrl(type.text)
  const fs = [
    date('Flight Date:', 'dt'),
    text('Flight Number:', 'fn'),
    select(data)('Tail Number:', 'tn'),
    text('Departure Airport Code:', 'dep'),
    text('Arrival Airport Code:', 'arr'),
    text('Landing Airport Code:', 'ldg')
  ]
  return <div className='flight-select'>
    <Form fs={fs} search={postSearch}/>
    {typeof status === 'string' ?
      <span className='status'>{status}</span> :
      <Flights os={status} v={val} sv={sv} ofs={ofs}/>
    }
  </div>
}

export default FlightSelect
