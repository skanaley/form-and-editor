/*
Nav: Nav bar at the top with button bar for primary actions like "submit".
     Also contains alerts on the left and hamburger menu on the right with
     additional common (e.g. "Home") and secondary actions.
*/

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Dialog } from './modal'
import { intercalate } from '../util'
import Icon from './icon'

const root = document.getElementById('root')
const home = root.getAttribute('data-home-page-url')

const Nav = p => {
  const nav = useNavigate()
  const [params,] = useSearchParams()
  const noback = params.get('noback')
  const [showAlerts, setShowAlerts] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const alerts = p.alerts && p.alerts.length > 0 ? p.alerts : []
  const hasAlerts = alerts.length > 0

  const maybeAlertsIcon = hasAlerts &&
    <span
      className='alerts'
      onMouseEnter={() => setShowAlerts(true)}
      onMouseLeave={() => setShowAlerts(false)}
    />
  
  const actionsIcon = <Icon type='actions' onClick={() => setShowActions(b => !b)}/>

  const maybeAlerts = showAlerts && hasAlerts &&
    <Dialog className='alerts'>
      <ul>{p.alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
    </Dialog>

  const basicActions = noback ? [[['Home', null]]] : [[
    ['Home', null],
    ['Back', -1]
  ]]

  const actionOnClick = a => a[1] ? nav(a[1]) : window.location = home
  
  //have to defer the key until after intercalating to avoid dup keys in the flat result
  const actionGroup = g => g.map(a => i => <button
    key={i}
    onClick={() => actionOnClick(a)}
  >{a[0]}</button>)

  const maybeActions = showActions &&
    <Dialog className='actions'>
      {intercalate(
        [i => <hr key={i}/>],
        basicActions.concat(p.actions).map(actionGroup)
      ).map((a, i) => a(i))/*the defer*/}
    </Dialog>

  let bar, content
  if (p.children && p.children.length > 0 && p.children[0].props.mainNav) {
    bar = p.children[0]
    content = p.children.slice(1)
  } else {
    bar = <></>
    content = p.children
  }

  return (
    <>
      <nav id="main-nav">
        {maybeAlertsIcon}
        {bar}
        {actionsIcon}
      </nav>
      {maybeAlerts}
      {maybeActions}
      {content}
    </>
  )
}

export default Nav
