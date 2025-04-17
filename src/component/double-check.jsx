/*
DoubleCheck: dialog intended to simply nag for a confirmation
*/

import ButtonBar from '../component/button-bar'
import Box from '../component/box'
import { CancelButton, SubmitButton } from '../component/button'
import Modal from '../component/modal'

const DoubleCheck = p => (
  <Modal>
    <Box>
      <p>{p.text}</p>
      <ButtonBar className='narrow'>
        <SubmitButton onClick={p.onSubmit}/>
        <CancelButton onClick={p.onCancel}/>
      </ButtonBar>
    </Box>
  </Modal>
)

export default DoubleCheck
