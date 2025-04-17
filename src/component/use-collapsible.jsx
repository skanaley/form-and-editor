/*
useCollapsible: hook to convert a tree like the following:

    data Tree a = Leaf a | Tree [Tree a]

  into:

    data Tree a = Leaf a | Tree Bool [Tree a]

  where the Bool stores if the children are shown
*/

import { useState } from 'react'
import update from 'immutability-helper'

export const addIds = root => {
  let tn = -1
  const loop = t => {
    if (!t.hasOwnProperty('children'))
      return t
    else {
      ++tn
      return {
        ...t,
        collapseId: tn,
        children: t.children.map(loop)
      }
    }
  }
  const t = loop(root)
  t.tn = tn + 1
  return t
}

const initState = (root, v, k) => root && Array(root[k]).fill(v)

const useCollapsible = (root, initVal=true, key='tn') => {
  const [s, setS] = useState(initState(root, initVal, key))
  
  const expanded = c => s[c.collapseId]
  const toggle = c => setS(_s => update(_s, {[c.collapseId]: b => !b}))
  const setAll = b => setS(Array(s.length).fill(b))
  
  return { root, expanded, toggle, setAll }
}

export default useCollapsible
