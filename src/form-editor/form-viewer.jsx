import React, { useState } from 'react'
import update from 'immutability-helper'
import SelectTaxonomy from './select-taxonomy'
import Button, { MinusButton } from '../component/button'
import HPair from '../component/hpair'
import { isPremade, node, oper, type } from '../form-lib/enums'
import { dropMode, formUpdate, isArrEq, setDdDepth, setDdNode, setDragPath, setDrop } from './state'

const Field = p => {
  const { d, ot } = p.props
  const allTax = window.taxonomy
  
  const select = () => <SelectTaxonomy
    style={{ gridArea: 'field' }}
    tax={allTax}
    init={[
      { val: ot, hide: true },
      { val: p.node.aspect },
      { val: p.node.category },
      { val: p.node.attribute }
    ]}
    onCancel={() => p.setEdit(false)}
    onOk={(ot, asp, cat, att) => {
      if (!(asp && cat && att))
        return
      p.setEdit(false)
      d(formUpdate(p.path, {
        name: oper.set,
        data: [{
          key: 'aspect',
          oldVal: p.node.aspect,
          val: asp
        }, {
          key: 'category',
          oldVal: p.node.category,
          val: cat
        }, {
          key: 'attribute',
          oldVal: p.node.attribute,
          val: att
        }]
      }))
    }}
  />
  
  return (
    <>
      {p.edit ?
        select() :
        <Button
          className='select-taxonomy'
          type='other'
          text={`${p.node.aspect} | ${p.node.category} | ${p.node.attribute}`}
          onClick={() => p.setEdit(true)}
        />
      }
      <HPair className='required'>
        <input
          id={p.path}
          type='checkbox'
          checked={p.node.required}
          onChange={() => d(formUpdate(p.path, {
            name: oper.set,
            data: [{
              key: 'required',
              oldVal: p.node.required,
              val: !p.node.required
            }]
          }))}
        />
        <label htmlFor={p.path}>Required</label>
      </HPair>
    </>
  )
}

/* This controls drag and drop ('dd') with the following data:
 * p.path = where the node came from ([bannerIdx, sectionIdx, ...])
 * s.ddDepth = where the node can be inserted (is it field? then ddD=2)
 */
export const DraggableNode = p => {
  const { s, d } = p.props
  
  let cn, dropClass
  if (!p.actualNode) {
    cn = ''
    dropClass = 'side-bar-button'
  } else {
    switch (p.node.type) {
    case type.banner: cn = 'banner'; break
    case type.section: cn = 'section'; break
    case type.field: cn = 'field'; break
    default: cn = 'section'
    }
    dropClass = ''
    if (s.dropPath && s.dropPath.length > 0) {
      switch (s.dropMode) {
      case dropMode.parent:
        if (isArrEq(s.dropPath, p.path))
          dropClass = 'drop-row-bottom'
        break
      case dropMode.equalDepth:
        if (isArrEq(s.dropPath.slice(0, -1), p.path.slice(0, -1))) {
          //last drop, last path (last element in each array)
          const ld = s.dropPath[s.ddDepth]
          const lp = p.path[s.ddDepth]
          if (ld === lp)
            dropClass = 'drop-row-top'
          else if (ld - 1 === lp)
            dropClass = 'drop-row-bottom'
        }
        break
      }
    }
  }
  
  const moveWithinSameDepth = e => {
    const { y, height: h } =
      e.target.closest(node[p.node.type].selector).getBoundingClientRect()
    const diff = e.clientY - y <= h/2 ? 0 : 1
    const dp = update(p.path, {[s.ddDepth]: i => i + diff})
    d(setDrop(dropMode.equalDepth, dp))
  }
  const insertIntoEmptyParent = e => {
    d(setDrop(dropMode.parent, p.path))
  }
  
  return (
    <div
      className={`${cn} ${dropClass}`}
      draggable
      onDragStart={e => {
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        d(setDdDepth(p.node.ddDepth))
        d(setDdNode(p.node))
        if (p.actualNode)
          d(setDragPath(p.path))
      }}
      onDragOver={!p.actualNode ?
        () => {} :
        e => {
          //don't allow putting fields into premades
          if (isPremade(p.node.type) && s.ddNode.type === type.field) {
            e.stopPropagation()
            d(setDrop(null, null))
          } else if (s.ddDepth === p.path.length - 1) {
            e.stopPropagation()
            moveWithinSameDepth(e)
          } else if (
            s.ddDepth === p.path.length &&
            (!p.node.children || p.node.children.length === 0)
          ) insertIntoEmptyParent(e)
        }
      }
      onDragEnd={e => {
        e.stopPropagation()
        if (!s.dropPath) return//e.g. if target was going to be a premade
        d(setDdDepth(null))
        if (p.actualNode) {
          d(formUpdate(s.dragPath, {
            name: oper.move,
            destPath: s.dropMode === dropMode.parent ?
              s.dropPath.concat(0) :
              s.dropPath
          }))
          d(setDragPath(null))
        } else {
          d(formUpdate(
            s.dropMode === dropMode.parent ?
              s.dropPath.concat(0) :
              s.dropPath,
            { name: oper.insert, val: s.ddNode },
            !p.actualNode
          ))
        }
        d(setDdNode(null))
        d(setDrop(null, null))
      }}
    >
      {p.children}
    </div>
  )
}

const Node = p => {
  const { s, d, ratWorksheets } = p.props
  const [label, setLabel] = useState(p.node.label)
  const [edit, setEdit] = useState(false)
  const cnodes = p.node.children || []
  const mn = node[p.node.type]
  
  const set = (k, ov, v) => d(formUpdate(p.path, {
    name: oper.set,
    data: [{ key: k, oldVal: ov, val: v }]
  }))
  
  const hidejsx = mn.type === type.field ?
    <></> :
    <span
      className={'toggle ' + (p.node.hide ? 'hide' : 'show')}
      onClick={() => set('hide', p.node.hide, !p.node.hide)}
    />
  
  const labeljsx = <input
    className='label'
    value={label || ''}
    onChange={e => setLabel(e.target.value)}
    onBlur={() => set('label', p.node.label, label)}
    onKeyPress={e => e.key !== 'Enter' ? {} : e.target.blur()}
  />
  
  const premadejsx = ![type.banner, type.section, type.field].includes(mn.type) && <>
    <div className='premade-type'>premade: {mn.type}</div>
    {mn.type === type.ratWorksheet && <select
      className='rat-worksheet-meta'
      value={p.node['rat-worksheet-id']}
      onChange={e => set(
        'rat-worksheet-id',
        p.node['rat-worksheet-id'],
        parseInt(e.target.value) || ''
      )}
    >
      <option value=''>Select worksheet ...</option>
      {ratWorksheets.map((w, i) => <option key={i} value={w.id}>{w.name}</option>)}
    </select>}
    <div className='premade-count'>
      {p.node.count && <input
        type='number'
        min={1}
        max={20}
        value={p.node.count}
        onChange={e => set('count', p.node.count, parseInt(e.target.value))}
      />}
    </div>
  </>
  
  const fieldjsx = mn.type !== type.field ?
    <></> :
    <Field
      path={p.path}
      node={p.node}
      edit={edit}
      setEdit={setEdit}
      props={p.props}
    />
  
  const removejsx =
    <MinusButton onClick={() => d(formUpdate(p.path, {
      name: oper.delete,
      val: p.node
    }))}/>
  
  return (
    <DraggableNode actualNode path={p.path} node={{ ...mn, ...p.node}} props={p.props}>
      <div className={'node-details' + (edit ? ' node-edit' : '')}>
        {hidejsx}
        {labeljsx}
        {premadejsx}
        {fieldjsx}
        {removejsx}
      </div>
      {!p.node.hide && cnodes.length > 0 && <div>
        <Nodes path={p.path} nodes={cnodes} props={p.props}/>
      </div>}
    </DraggableNode>
  )
}

const Nodes = p => p.nodes.map((n, i) => <Node
  key={n.reactKey+n.label}
  path={p.path.concat(i)}
  node={n}
  props={p.props}
/>)

const FormViewer = p => {
  const ps = p.props
  return (
    <div className='small'>
      <Nodes path={[]} nodes={ps.s.form.children} props={ps}/>
    </div>
  )
}

export default FormViewer
