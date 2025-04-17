import { Route, Routes } from 'react-router-dom'
import { FormParam } from './form'

const FormRoutes = p => (
  <Routes>
    <Route path=':otOrId' element={<FormParam/>}/>
  </Routes>
)

export default FormRoutes
