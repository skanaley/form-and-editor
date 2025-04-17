/* Form Editor State:

(...not fully documented...)

Drag and Drop Substate:
ddNode = union of backend form and form-lib, actual and meta data
         respectively
ddDepth = where the node can be inserted (banner=0, section=1, ...)
dragPath = where the node was ([1, 2] is 3rd section in 2nd banner)
dropMode = either we're dropping within siblings or into a parent, the latter
           if we're dragged on top of the parent (to handle the case of an
           empty parent)
dropPath = the target node we're dropping "onto", either slotting into the
           parent, or displacing siblings
*/
import update from 'immutability-helper'
import { oper } from '../form-lib/enums'

//#region ACTION
export const dropMode = {
  parent: 'parent',
  equalDepth: 'equalDepth'
}

export const action = {
  formUpdate: 'formUpdate',
  setAllContainerNodes: 'setAllContainerNodes',
  undo: 'undo',
  setDdNode: 'setDdNode',
  setDdDepth: 'setDdDepth',
  setDragPath: 'setDragPath',
  setDrop: 'setDrop',
}

export const formUpdate = (path, op, incKey=false) => ({ type: action.formUpdate, path, op, incKey })
export const setAllContainerNodes = (k, v) => ({ type: action.setAllContainerNodes, k, v })
export const undo = () => ({ type: action.undo })
export const setDdNode = n => ({ type: action.setDdNode, n })
export const setDdDepth = d => ({ type: action.setDdDepth, d })
export const setDragPath = p => ({ type: action.setDragPath, p })
export const setDrop = (m, p) => ({ type: action.setDrop, m, p })
//#endregion

//#region UTILITY
export const isArrEq = (as, bs) => as.length === bs.length &&
  as.every((a, i) => a === bs[i])
//#endregion

//#region S0
export const makeS0 = form => {
  // The usual "runtime" map((thing, i) => ... key={i}) doesn't work with
  // modifiable arrays (the keys will shift). Must use persistent ids.
  let k = -1
  const addReactKeys = t => {
    ++k
    t.reactKey = k
    if (t.hasOwnProperty('children'))
      t.children.forEach(addReactKeys)
  }
  addReactKeys(form)
  return {
    form,
    history: [],
    //NOTE: this probably also requires reinverting the undo, not worth?
    //index of thing to be redone, e.g. [h0, h1] with historyPtr=1
    //means we just undid h1
    //historyPtr: null,
    nextNodeKey: k + 1,
    ddNode: null,//dd=dragDrop
    ddDepth: null,
    dragPath: null,
    dropMode: null,
    dropPath: null
  }
}
//#endregion

//#region HISTORY
/* Undo:
The react-addons-update structure is too general to easily invert (apply
probably guarantees it's impossible). Use simpler grammar:

updateArg  = { path: [index], op: op }
index      = number | objectKeyAsString
op         = DeleteNode | InsertNode | MoveNode | Set
DeleteNode = { name: 'delete', val: form-data-that-was-deleted }
InsertNode = { name: 'insert' }
MoveNode   = { name: 'move', destPath: [index] }
Set        = { name: 'set', oldVal: form-data-that-was-overwritten }

delete^-1 path   = insert path val
insert^-1 path _ = delete path
move^-1   path _ = path >>= \n -> delete destPath >> insert path n
set^-1    path _ = set    path oldVal
*/
const liftUpdate = u => form => {
  const up = u.path
  const rp = up.slice()
  rp.reverse()
  let op
  switch (u.op.name) {
  case oper.delete: op = {$splice: [[rp[0], 1]]}; break
  case oper.insert: op = {$splice: [[rp[0], 0, u.op.val]]}; break
  case oper.move:
    const merge = (a, b) => {
      if (Array.isArray(a))
        return a.concat(b)
      if (typeof a === 'object') {
        return Object.keys(a).reduce((acc, k) => acc.hasOwnProperty(k) ?
          { ...acc, [k]: merge(a[k], b[k]) } :
          { ...acc, [k]: a[k] }
        , b)
      }
    }
    /* Be careful:
     * - If dest > source within same level, the level shifts so the dest is 1
     *   less, e.g. if you have [a, b, c] and you move "a" to 3 (after "c"), you
     *   actually moved it to 2.
     * - Relatedly, moving "a" to 0 or 1 (before or after "a") is a no-op
     */
    const dp = u.op.destPath
    const dps = dp.slice(0, -1)
    const ldp = dp.at(-1)
    const lup = up.at(-1)
    let dp1 = dp
    if (isArrEq(up.slice(0, -1), dps)) {
      if (lup === ldp || lup === ldp - 1)
        return null
      if (lup < ldp)
        dp1 = dps.concat(ldp - 1)
    }
    const n = up.reduce((acc, i) => acc.children[i], form)
    const du = liftUpdate({ path: up, op: { name: oper.delete }})(form)
    const iu = liftUpdate({ path: dp1, op: { name: oper.insert, val: n }})(form)
    return merge(du, iu)
  case oper.set:
    op = {[rp[0]]: u.op.data.reduce(
      (acc, x) => ({ ...acc, [x.key]: {$set: x.val} }),
      {}
    )}
    break
  default: throw Error(`unknown form operation: ${u.op.name}`)
  }
  return {children: rp.slice(1).reduce(
    (acc, i) => ({[i]: {children: acc}}),
    op
  )}
}

const invertUpdate = u => {
  switch (u.op.name) {
  case oper.delete:
    return { ...u, op: { name: oper.insert, val: u.op.val } }
  case oper.insert:
    return { ...u, op: { name: oper.delete } }
  case oper.move:
    // same thing as above, careful about dest > source
    const dp = u.op.destPath
    const dps = dp.slice(0, -1)
    const ldp = dp.at(-1)
    const up = u.path
    const dp1 = isArrEq(up.slice(0, -1), dps) && up.at(-1) < ldp ?
        dps.concat(ldp - 1) :
        dp
    return {
      ...u,
      path: dp1,
      op: { name: oper.move, destPath: u.path }
    }
  case oper.set:
    return { ...u, op: {
      name: oper.set,
      data: u.op.data.map(x => ({ ...x, val: x.oldVal }))
    }}
  default: throw Error(`unknown inverted form operation: ${u.op.name}`)
  }
}

// for batch undoing of expand/collapse all
const _setAllContainerNodes = (form, key, val) => {
  const u = form.children.reduce((facc, b, i) => ({
    ...facc,
    [i]: {
      [key]: {$set: val},
      children: b.children.reduce((bacc, s, j) => ({
        ...bacc,
        [j]: {[key]: {$set: val}}
      }), {})
    }
  }), {})
  const uundo = form.children.reduce((facc, b, i) => ({
    ...facc,
    [i]: {
      [key]: {$set: b[key]},
      children: b.children.reduce((bacc, s, j) => ({
        ...bacc,
        [j]: {[key]: {$set: s[key]}}
      }), {})
    }
  }), {})
  return {
    do: {children: u},
    undo: {children: uundo}
  }
}
//#endregion

//#region REDUCER
export const pureReducer = (s, a) => {
  switch (a.type) {
  case action.formUpdate: {// "{" because u is used more than once
    const u = { path: a.path, op: a.op }
    //const uli = liftUpdate(invertUpdate(u))
    const f = liftUpdate(u)(s.form)
    if (f === null) return s
    return update(s, {
      form: f,
      history: {$push: [liftUpdate(invertUpdate(u))]},
      //historyPtr: null,
      nextNodeKey: k => a.incKey ? k + 1 : k
    })
  }
  case action.setAllContainerNodes: {
    const u = _setAllContainerNodes(s.form, a.k, a.v)
    return update(s, {
      form: u.do,
      history: {$push: [f => u.undo]}
    })
  }
  case action.undo:
    const h = s.history
    if (h.length === 0) return s
    const i = h.length - 1
    return update(s, {
      form: h[i](s.form),
      history: {$splice: [[i, 1]]}
    })
  /*case action.redo:
    const hp = s.historyPtr
    if (!hp) return s
    return update(s, {
      form: h[hp](s.form),*/
  case action.setDdNode:
    return { ...s, ddNode: a.n }
  case action.setDdDepth:
    return { ...s, ddDepth: a.d }
  case action.setDragPath:
    return { ...s, dragPath: a.p }
  case action.setDrop:
    return { ...s, dropMode: a.m, dropPath: a.p }
  default:
    return s
  }
}

/*export const logReducer = (s, a) => {
  const s1 = pureReducer(s, a)
  console.log(s, a, s1)
  return s1
}*/

export const reducer = pureReducer
//#endregion
