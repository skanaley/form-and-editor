/*
Dialog: basic HTML dialog
Modal: dialog + onClose handler
*/

import { useEffect, useRef } from 'react'

export const Dialog = p => {
  const ref = useRef(null)
  const cn = `dialog-wrapper${p.className ? ' ' + p.className : ''}`
  
  useEffect(() => {
    const r = ref.current
    if (r) r.show()
  }, [ref])
  
  return (
    <div className={cn}>
      <dialog ref={ref}>
        {p.children}
      </dialog>
    </div>
  )
}

const Modal = p => {
  const ref = useRef(null)
  
  useEffect(() => {
    const r = ref.current
    if (r) r.showModal()
  }, [ref])
  
  return (
    <dialog ref={ref} onClose={p.onClose}>
      {p.children}
    </dialog>
  )
}

export default Modal
