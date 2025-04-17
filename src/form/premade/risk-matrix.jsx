const Jsonml = p => {
  const rewriteStyleAtt = a => {
    const [k, v] = a
    switch (k) {
    case 'background-color': return ['backgroundColor', v]
    default: return a
    }
  }
  const rewriteAtt = a => {
    const [k, v] = a
    switch (k) {
    case 'class': return ['className', v]
    case 'colspan': return ['colSpan', v]
    case 'rowspan': return ['rowSpan', v]
    case 'style': return ['style', v.reduce((acc, kv) => {
      const [sk, sv] = rewriteStyleAtt(kv)
      return { ...acc, [sk]: sv }
    }, {})]
    default: return a
    }
  }
  const d = p.data
  /*not used, standard matrix is a single tag
  if (Array.isArray(d[0])) {
    return d.map((j, i) => <Jsonml
      key={i} data={j} rf={p.rf} fields={p.fields}
    />)
  }*/
  if (typeof d === 'string') return d
  const tag = d[0]
  let atts = []
  let children
  if (d[1] && d[1][0] === '@') {
    atts = d[1].slice(1).reduce((acc, a) => {
      const [k, v] = rewriteAtt(a)
      return { ...acc, [k]: v }
    }, {})
    children = d.slice(2)
  } else children = d.slice(1)
  const jsx = () => children.map((c, i) => <Jsonml key={i} data={c} rf={p.rf} fields={p.fields}/>)
  switch (tag) {
  case 'div': return <div { ...atts }>{jsx()}</div>
  case 'table': return <table { ...atts }>{jsx()}</table>
  case 'tbody': return <tbody { ...atts }>{jsx()}</tbody>
  case 'tr': return <tr { ...atts }>{jsx()}</tr>
  case 'td': return <td { ...atts }>{jsx()}</td>
  case 'field':
    const id = children[0]
    return p.rf(p.fields.find(f => id === f.htmlId))
  default:
    throw Error('Jsonml: unknown tag: ' + tag)
  }
}

const RiskMatrix = p => <Jsonml data={p.s.jsonml} rf={p.rf} fields={p.s.children}/>

export default RiskMatrix
