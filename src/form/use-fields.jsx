//We need to create a shared box to hold radio state so groups of radios can be mutually exclusive --
//each button should know which button is clicked
import { useCallback, useReducer } from 'react'
import update from 'immutability-helper'
import Field, { exportValues, fieldMode, importValue, toExportArray } from '../form/field'

export const initFieldState = (v=null) => ({ value: v, loading: false })

/* Implicitly upgrade plain fields to singular multifields.
 * Returns [t, fs, fsts, fstms]:
 * * t: the entire "tree", e.g. { type: root, children: ... }
 * * fs: the complete list of form fields
 * * fsts: the "subset" of the fields with state, e.g. a radio group will have 1 state per group of radio fields, i.e. not one-to-one
 * * fstms: the "field"-likes corresponding to state, e.g. so we can submit the radio button taxonomy for the respective state
 */
export const initFields = root => {
  let id = -1//field id (unique per)
  let sid = -1//state id (multifields share state, e.g. radio buttons)
  let fs = []//fields (readonly)
  let fsts = []//field states
  let fstms = []//field state metadatas, sort of like a backpointer to the fields
  const idifyF = f => {
    ++id
    f.id = id
    f.stateId = sid
    return f;
  }
  const loop = t => !t.hasOwnProperty('children') ?
    t : {
      ...t,
      children: t.children.flatMap(c => {
        switch (c.type) {
        case 'multifield':
          ++sid;
          c.fields = c.fields.map(f => loop(idifyF(f)))
          c.fields.forEach(f => fs.push(f))
          fsts.push(initFieldState())
          fstms.push(c.fields[0])//any field should be equivalent
          return c.fields
        case 'field':
          ++sid;
          c = idifyF(c)
          fs.push(c)
          fsts.push(initFieldState(importValue(c)))
          fstms.push(c)
          return loop(c)
        default: return loop(c)
        }
      })
    }
  const t = loop(root)
  return [t, fs, fsts, fstms]
}

const actions = {
  revert: 'revert',
  setFields: 'setFields',
  setFieldsNow: 'setFieldsNow'
}

const makeS0 = fsts0 => ({
  fsts0,
  fsts: fsts0,
  changed: false
})

const makeUpdateField = (i, v, l) => fsts => update(fsts, {[i]: {
  loading: {$set: l},
  value: {$set: v}
}})

const makeUpdateFields = (arrs, l) => fsts => update(
  fsts,
  arrs.reduce((acc, arr) => ({
    ...acc,
    [arr[0]]: {
      loading: {$set: l},
      value: {$set: arr[1]}
    }
  }), {})
)

const pureReducer = (s, a) => {
  switch (a.type) {
  case actions.revert:
    return {
      ...s,
      changed: false,
      fsts: s.fsts0
    }
  case actions.setFields:
    return {
      ...s,
      changed: true,
      fsts: a.u(s.fsts)
    }
  case actions.setFieldsNow:
    return {
      ...s,
      changed: true,
      fsts: a.fsts
    }
  default: return s
  }
}

/*const logReducer = (s, a) => {
  const s1 = pureReducer(s, a)
  console.log(s, a, s1)
  return s1
}*/

/* root: the original structure
 * fs: array of fields in the structure
 * fsts0: array of field states, not one-to-one due to multifields e.g. radio buttons
 * fstms: array of field metadatas (really just fields) but one-to-one with states so we know what to submit
 */
const useFields = (root, fs, fsts0, fstms, sync=null, isBasic=true, etIsZero=false) => {
  const [s, d] = useReducer(pureReducer, makeS0(fsts0))

  //get writeable state with meta
  const getWState = fsts => fstms.filter(m => !m.readonly).map(m => ({ ...m, value: fsts[m.stateId].value }))
  
  const revert = () => d({ type: actions.revert })
  
  //fixed race condition with setFieldsNow with useEffect and in theory fast user input
  //maybe just delete that
  const setField = !sync ?
    (i, v) => d({ type: actions.setFields, u: makeUpdateField(i, v, false) }) :
    async (i, v) => {
      sync.before()
      const fsts = makeUpdateField(i, v, true)(s.fsts)
      d({ type: actions.setFieldsNow, fsts })
      await sync.post(getWState(fsts))
      //test delays for overlapping two fields
      //await new Promise(r => setTimeout(r, 2000))
      d({ type: actions.setFields, u: makeUpdateField(i, v, false) })
      sync.after()
    }
  
  const setFields = !sync ?
    arrs => d({
      type: actions.setFieldsNow,
      fsts: makeUpdateFields(arrs, false)(s.fsts)
    }) :
    async arrs => {
      sync.before()
      const fsts = makeUpdateFields(arrs, true)(s.fsts)
      d({ type: actions.setFieldsNow, fsts })
      await sync.post(getWState(fsts))
      //await new Promise(r => setTimeout(r, 2000))
      d({ type: actions.setFields, u: makeUpdateFields(arrs, false) })
      sync.after()
    }
  
  const fsts = s.fsts

  //divide into unshared & shared, where shared are grouped by same key
  const partitionRequiredIds = () => {
    const us = []//unshareds
    const ss = {}//shareds
    fs.forEach(f => {
      const m = fieldMode(f)
      if (m[0] === 'required') {
        const k = m[1]
        if (k) {
          if (ss.hasOwnProperty(k)) ss[k].push(f.id)
          else ss[k] = [f.id]
        } else us.push(f.id)
      }
    })
    return [us, ss]
  }

  const getEmptyRequiredFieldIds = () => {
    const [us, sks] = partitionRequiredIds()
    const mt = i => {//mt='empty'
      const v = fsts[i].value
      return v === null || v === ''
    }
    const mtUs = us.filter(mt)
    const mtSss = Object.keys(sks).filter(k => sks[k].every(mt)).map(k => sks[k])
    return [mtUs, mtSss]
  }
  
  //deleted usecallback as the state doesn't update in some cases, don't recall its original purpose, may lose efficiency?
  const renderField = (f, i) => {
    const st = s.fsts[f.stateId]
    return (
      <Field
        key={i}
        loading={st.loading}
        f={f}
        val={st.value || ''}
        set={v => setField(f.stateId, v)}
      />
    )
  }
  
  const getState = (_s=fsts) => _s.filter(f => !f.readonly)
  
  const makeSubmitData = () => {
    const isOk = m => !m.readonly && m['control-class'] !== 'attachment-field'
    const fvs = fstms.filter(isOk).map(m => update(m, {value: {$set: fsts[m.stateId].value}}))//fvs="fields with value"
    return toExportArray(exportValues(fvs), isBasic, etIsZero)
  }
  
  const getAttachments = () => {
    const ams = fstms.filter(f => !f.readonly && f['control-class'] === 'attachment-field')
    //don't support multiple fields
    if (ams.length !== 1) return []
    return fsts[ams[0].stateId].value.local || []
  }
  
  return {
    root,
    renderField,
    changed: s.changed,
    revert,
    getState,
    getWState,
    setField,
    setFields,
    makeSubmitData,
    getAttachments,
    getEmptyRequiredFieldIds
  }
}

export default useFields
