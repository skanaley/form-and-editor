import { useEffect, useReducer } from 'react'
import axios from 'axios'

const source = axios.CancelToken.source()

export const noBackQueryParam = () => {
  const s = new URLSearchParams(window.location.search)
  s.append('noback', 1)
  history.replaceState(null, null, '?'+s)
  return encodeURIComponent(window.location)
}

export const ultimateUrlNoBackQueryParam = () =>
    `ultimate-url=${noBackQueryParam()}`

export const post = (a, o={}) => axios.post('', {
  id: document.getElementById('root').getAttribute('data-request-id'),
  action: a,
  args: o
}, {
  cancelToken: source.token
}).then(r => {
  /*if (r.data.data === "Log In Expired" && !r.data.success) {
    source.cancel('cancel: Log In Expired')
    endSession()
  }*/
  return r
}).catch(e => {
  /*if (e.response.status === 401)
    endSession()*/
  throw e
})

export const fetch = async (a, o={}) => {
  const r = await post(a, o)
  return Promise.resolve(r.data)
}

export const postFileAsMultipartFormData = (a, id, file) =>
  axios.postForm('', {
    id: id,
    action: a,
    file: file
  }, {
    cancelToken: source.token
  }).then(r => {
    /*if (r.data.data === "Log In Expired" && !r.data.success) {
      source.cancel('cancel: Log In Expired')
      endSession()
    }*/
    return r
  }).catch(e => {
    /*if (e.response.status === 401)
      endSession()*/
    throw e
  })

const fetchS0 = {
  data: null,
  isLoading: false,
  error: null
}

const fetchReducer = (s, a) => {
  switch (a.type) {
  case 'FETCH_START':
    return { ...s, error: null, isLoading: true }
  case 'FETCH_OK':
    return { ...s, data: a.d, error: null, isLoading: false }
  case 'FETCH_ERROR':
    return { ...s, error: a.e, isLoading: false }
  default:
    throw new Error()
  }
}

export const useFetch = (action, args, deps) => {
  const [s, d] = useReducer(fetchReducer, fetchS0)
  
  useEffect(() => {
    let cancel = false
    const fetch = async () => {
      d({ type: 'FETCH_START' })
      try {
        const r = await post(action, args)
        if (!cancel)
          d({ type: 'FETCH_OK', d: r.data })
      } catch (e) {
        if (!cancel)
          d({ type: 'FETCH_ERROR', e: e })
      }
    }
    fetch()
    return () => { cancel = true }
  }, deps.concat(action))
  
  return s
}

// fetch with modification of result to prime useState
export const useFFetch = (action, args, deps, f) => {
  const [s, d] = useReducer(fetchReducer, fetchS0)
  
  useEffect(() => {
    let cancel = false
    const fetch = async () => {
      d({ type: 'FETCH_START' })
      try {
        //await new Promise(r => setTimeout(r, 1000))
        const r = await post(action, args)
        if (!cancel)
          d({ type: 'FETCH_OK', d: f(r.data) })
      } catch (e) {
        if (!cancel)
          d({ type: 'FETCH_ERROR', e: e })
      }
    }
    fetch()
    return () => { cancel = true }
  }, deps.concat(action))
  
  return s
}

// conditional fetch for e.g. new vs. edit where you might not need to fetch
export const useCFetch = (action, args, deps, c, defaultVal) => {
  const [s, d] = useReducer(fetchReducer, fetchS0)
  
  useEffect(() => {
    if (!c) {
      d({ type: 'FETCH_OK', d: defaultVal })
      return
    }
    let cancel = false
    const fetch = async () => {
      d({ type: 'FETCH_START' })
      try {
        const r = await post(action, args)
        if (!cancel)
          d({ type: 'FETCH_OK', d: r.data })
      } catch (e) {
        if (!cancel)
          d({ type: 'FETCH_ERROR', e: e })
      }
    }
    fetch()
    return () => { cancel = true }
  }, deps.concat(c).concat(action))
  
  return s
}

export const postLogout = () => post('logout')
