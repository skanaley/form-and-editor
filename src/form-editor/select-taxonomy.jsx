import React, { useReducer } from 'react'
import Widget from '../component/separated'
import { CancelButton, OkButton } from '../component/button'
import ButtonBar from '../component/button-bar'

const _s0 = {
  ot: '',
  asps: [],
  asp: '',
  cats: [],
  cat: '',
  atts: [],
  att: ''
}

const getAsps = (tax, ot) => {
  if (ot === '')
    return []
  const asps = Object.keys(tax.ot[ot])
  return asps.sort()
}

const getCats = (tax, ot, asp) => {
  if (asp === '')
    return []
  const cats = Object.keys(tax.ot[ot][asp].cats)
  return cats.sort()
}

const getAtts = (tax, cat) => {
  if (cat === '')
    return []
  const atts = Object.keys(tax.cat[cat].atts)
  return atts.sort()
}

const makeS0 = (tax, ks) => {
  const s = _s0
  if (ks[0]) {
    const ot = ks[0].val
    s.ot = ot
    s.asps = getAsps(tax, ot)
    if (ks[1]) {
      const asp = ks[1].val
      s.asp = asp
      s.cats = getCats(tax, ot, asp)
      if (ks[2]) {
        const cat = ks[2].val
        s.cat = ks[2].val
        s.atts = getAtts(tax, cat)
        if (ks[3])
          s.att = ks[3].val
      }
    }
  }
  return s
}

// this is basically a stack, e.g.
// state :: Path
// type Path = [(String, [String])]
// where the tuple is (chosenOption, allOptions) at a given level
// may not be worth the formalization...
const reducer = (s, a) => {
  switch (a.type) {
  case 'SET_OT':
    return {
      ...s,
      ot: a.ot,
      asps: a.asps,
      asp: '',
      cats: [],
      cat: '',
      atts: [],
      att: ''
    }
  case 'SET_ASP':
    return {
      ...s,
      asp: a.asp,
      cats: a.cats,
      cat: '',
      atts: [],
      att: ''
    }
  case 'SET_CAT':
    return {
      ...s,
      cat: a.cat,
      atts: a.atts,
      att: ''
    }
  case 'SET_ATT':
    return {
      ...s,
      att: a.att
    }
  default:
    return s
  }
}

const SelectTaxonomy = p => {
  const [s, d] = useReducer(reducer, makeS0(p.tax, p.init))
  const ots = Object.keys(p.tax.ot)
  ots.sort()
  const pickOt = ot => d({ type: 'SET_OT', ot: ot, asps: getAsps(p.tax, ot) })
  const pickAsp = asp =>
    d({ type: 'SET_ASP', asp: asp, cats: getCats(p.tax, s.ot, asp) })
  const pickCat = cat =>
    d({ type: 'SET_CAT', cat: cat, atts: getAtts(p.tax, cat) })
  const pickAtt = att => d({ type: 'SET_ATT', att: att })
  return (
    <Widget className='select-taxonomy'>
      <div className='taxonomy-picker'>
        {[
          ['ot-picker', 'Object Type', s.ot, ots, pickOt],
          ['asp-picker', 'Aspect', s.asp, s.asps, pickAsp],
          ['cat-picker', 'Category', s.cat, s.cats, pickCat],
          ['att-picker', 'Attribute', s.att, s.atts, pickAtt]
        ].filter((r, i) => !(p.init[i] && p.init[i].hide)).map((r, i) =>
          <React.Fragment key={i}>
            <label htmlFor={r[0]}>{r[1]}</label>
            <select
              name={r[0]}
              value={r[2]}
              onChange={e => r[4](e.target.value)}
            >
              <option value=''></option>
              {r[3].map((o, j) => <option key={j} value={o}>{o}</option>)}
            </select>
          </React.Fragment>
        )}
      </div>
      <ButtonBar className='narrow'>
        <OkButton onClick={() => p.onOk(s.ot, s.asp, s.cat, s.att)}/>
        <CancelButton onClick={p.onCancel}/>
      </ButtonBar>
    </Widget>
  )
}

export default SelectTaxonomy
