/*
Icon: combined with CSS serves as a hoverable icon with help text
*/

const Icon = p => {
  let cn
  switch (p.type) {
    case 'actions': cn = 'actions'; break
    case 'alerts': cn = 'alerts'; break
    default: cn = 'default'
  }
  cn = `${cn} ${p.className ? ' ' + p.className : ''}`
  
  return (
    <button
      className={cn}
      type='button'
      onClick={p.onClick}
    >
      <i className={cn}>&nbsp;</i>
    </button>
  )
}

export default Icon
