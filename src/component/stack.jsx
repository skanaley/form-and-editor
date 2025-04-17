/*
HStack: horizontal list of things, not boxed
VStack: vertical list of things, not boxed
*/

import { Children, cloneElement } from 'react'

export const HStack = p => (
  <div
    id={p.id}
    style={{
      ...p.style,
      display: 'flex',
      justifyContent: 'space-between',
      height: '100%'
    }}
  >
    {Children.map(p.children, c => cloneElement(c, {
      style: {
        ...c.props.style,
        flexBasis: p.flexBasis || '100%',
        textAlign: c.props.textalign || 'center'
      }
    }))}
  </div>
)

export const VStack = p => (
  <div style={{
    ...p.style,
    display: 'flex',
    flexDirection: 'column'
  }}>
    {Children.map(p.children, c => cloneElement(c, {
      style: {
        ...c.props.style,
        flexGrow: 1,
        textAlign: 'center'
      }
    }))}
  </div>
)
