import { Route, Routes } from 'react-router-dom'
import FormEditor from './form-editor'

const FormEditorRoutes = p => (
  <Routes>
    <Route path=':ot' element={<FormEditor/>}/>
  </Routes>
)

export default FormEditorRoutes
