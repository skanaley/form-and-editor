import { useState } from 'react'
import Separated from '../../component/separated'

export const verifySelfAlert = 'You must review your employee information.'

const Lock = p => <button
  className={p.locked ? 'locked' : 'unlocked'}
  onClick={p.toggleLock}>
</button>

const Verify = p => <div className='field'>
  <input
    style={{ marginLeft: 0 }}
    type='checkbox'
    name='employee-validate'
    checked={p.verified}
    onChange={e => p.setVerify(e.target.checked)}
  />
  <label className='required'>I have reviewed my employee information.</label>
</div>

const Employee = p => {
  const [locked, setLocked] = useState(true)
  const [verified, _setVerified] = useState(false)
  const setVerified = b => {
    _setVerified(b)
    p.sin(p.s.sectionId, b ? [] : [verifySelfAlert])
  }
  return <>
    <Lock locked={locked} toggleLock={() => setLocked(l => !l)}/>
    <Separated size='small' className='fields'>
      {p.s.children.map((f, i) => p.rf({ ...f, readonly: locked }, i))}
      <Verify verified={verified} setVerify={setVerified}/>
    </Separated>
  </>
}

export default Employee
