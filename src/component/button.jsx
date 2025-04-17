/*
Button: the 'base' button
BackButton: go back, don't save data
CancelButton: close dialog, cancel local? changes
OkButton: close dialog, confirm local? changes
SaveButton: POST changes, stay on page
SearchButton: likely POST search data, could do local stuff though
SubmitButton: standard form submit then navigate to a result
ExpandAllButton: expand all collapsible things
CollapseAllButton: collapse all collapsible things
PlusButton: add another item to a list
MinusButton: delete item from a list
*/

import { useNavigate } from 'react-router-dom'

const Button = p => {
  if (p.disabled) {
    if (p.warningText) {
      return (
        <button
          disabled
          className='warning-disabled'
          type='button'
        >{p.warningText}</button>
      )
    }
  }
  
  let cn
  switch (p.type) {
    case 'add': cn = 'root add'; break
    case 'remove': cn = 'root remove'; break
    case 'other': cn = 'root other'; break
    case 'small': cn = 'small'; break
    default: cn = 'default'
  }
  
  return (
    <button
      disabled={p.disabled}
      title={p.title}
      className={`${cn} ${p.className ? ' ' + p.className : ''}`}
      type='button'
      onClick={p.onClick}
    >{p.text}</button>
  )
}

export const BackButton = p => {
  const nav = useNavigate()
  return (
    <Button
      disabled={p.disabled}
      title={p.title}
      type='remove'
      text='Back'
      onClick={p.onClick ? p.onClick : () => nav(-1)}
    />
  )
}

export const CancelButton = p => (
  <Button
    disabled={p.disabled}
    title={p.title}
    type='remove'
    text='Cancel'
    onClick={p.onClick}
  />
)

export const OkButton = p => (
  <Button
    disabled={p.disabled}
    title={p.title}
    type='add'
    text='OK'
    onClick={p.onClick}
  />
)

export const SaveButton = p => (
  <Button
    disabled={p.disabled}
    title={p.title}
    type='add'
    text='Save'
    onClick={p.onClick}
  />
)

export const SearchButton = p => (
  <Button
    disabled={p.disabled}
    title={p.title}
    type='other'
    text='Search'
    onClick={p.onClick}
  />
)

export const SubmitButton = p => (
  <Button
    disabled={p.disabled}
    title={p.title}
    type='add'
    text='Submit'
    onClick={p.onClick}
  />
)

export const ExpandAllButton = p => (
  <Button
    className='expand'
    text='Expand All'
    onClick={p.onClick}
  />
)

export const CollapseAllButton = p => (
  <Button
    className='collapse'
    text='Collapse All'
    onClick={p.onClick}
  />
)

export const PlusButton = p => (
  <Button
    disabled={p.disabled}
    title={p.title}
    type='add'
    text='+'
    onClick={p.onClick}
  />
)

export const MinusButton = p => (
  <Button
    disabled={p.disabled}
    title={p.title}
    type='remove'
    text='-'
    onClick={p.onClick}
  />
)

export default Button
