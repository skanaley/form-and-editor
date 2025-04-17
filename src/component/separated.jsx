import { Fragment } from 'react'
import { intersperse } from '../util'

const Separated = p => {
  const cn = `separated-${p.size} ${p.className || ''}`

  return <div className={cn}>
    {p.children}
  </div>
}

export const SeparatedWithHr = p => {
  const cn = `separated-${p.size} ${p.className || ''}`
  const cs = p.children.filter(c => c)

  return <div className={cn}>
    {intersperse(<hr/>, cs.map((c, i) => <Fragment key={i}>{c}</Fragment>))}
  </div>
}

export default Separated
