import 'vite/modulepreload-polyfill'
import React from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App'
import './index.scss'

const root = document.getElementById('root')
const appPath = root.getAttribute('data-app-relative-path')
const route = root.getAttribute('data-initial-route')

axios.defaults.withCredentials = true
axios.defaults.baseURL = root.getAttribute('data-api-url')
axios.defaults.headers.post['Content-Type'] = 'application/json'
//error handling removed for demo purposes
axios.interceptors.response.use(
  r => r,
  e => {
    alert(JSON.stringify(e.response.data))
    return Promise.reject(e)
  }
)

createRoot(root).render(
  <React.StrictMode>
    <App appPath={appPath} route={route}/>
  </React.StrictMode>
)
