import update from 'immutability-helper'

export const findSectionIndex = (root, f) => {
  const bs = root.children
  for (let i=0; i<bs.length; ++i) {
    const j = bs[i].children.findIndex(f)
    if (j >= 0) return [i, j]
  }
  return null
}

export const findSectionIndexByType = (root, t) => findSectionIndex(root, s => s.type === t)

export const findSection = (root, f) => {
  const i = findSectionIndex(root, f)
  if (!i) return
  return root.children[i[0]].children[i[1]]
}

export const findSectionByType = (root, t) => findSection(root, s => s.type === t)

export const modSectionByType = (root, t, u) => {
  const i = findSectionIndexByType(root, t)
  return !i ? root : update(root, {children: {[i[0]]: {children: {[i[1]]: u}}}})
}

export const findField = (root, fnd) => {
  const bs = root.children
  for (let i=0; i<bs.length; ++i) {
    const ss = bs[i].children
    for (let j=0; j<ss.length; ++j) {
      const f = ss[j].children.find(fnd)
      if (f) return f
    }
  }
}

export const findFieldByTax = (root, asp, cat, att) => findField(root, f => f.aspect === asp && f.category === cat && f.attribute === att)
