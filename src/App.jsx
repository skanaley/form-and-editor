import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Form from './form/routes'
import FormEditor from './form-editor/routes'

const App = p => (
  <BrowserRouter basename={p.appPath}>
    <Routes>
      <Route path='form/*' element={<Form/>}/>
      <Route path='form-editor/*' element={<FormEditor/>}/>
    </Routes>
  </BrowserRouter>
)

export default App
