/*
Box: whitespace separated and padded groups of things
Boxify: makes boxes out of a list
HBox: horizontally flowing box
HBoxify: makes hboxes out of a list
*/

import { Children } from 'react'
import { HStack } from './stack'
import Separated from './separated'

const Box = p => {
  const cn = 'box ' + p.className

  return <div className={cn}>{p.children}</div>
}

export const Boxify = p => (
  <Separated size={p.size}>
    {Children.map(p.children, c => <Box {...p}>{c}</Box>)}
  </Separated>
)

const HBox = p => {
  const cn = 'hbox ' + p.className

  return <div className={cn}>{p.children}</div>
}

export const HBoxify = p => (
  <HStack {...p}>
    {Children.map(p.children, c => <HBox>{c}</HBox>)}
  </HStack>
)

export default Box
