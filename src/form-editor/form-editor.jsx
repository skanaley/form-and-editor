//TODO: redo form grammar comment up here
import React, { useReducer } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { post, useFetch } from '../session'
import Nav from '../component/nav'
import Button, { BackButton, CollapseAllButton, ExpandAllButton, SaveButton } from '../component/button'
import ButtonBar from '../component/button-bar'
import FormViewer, { DraggableNode } from './form-viewer'
import { makeNode, node, type } from '../form-lib/enums'
import { findSectionByType } from '../form-lib/query'
import { makeS0, reducer, setAllContainerNodes, undo } from './state'
/*let s0
if (process.env.NODE_ENV === 'development') {
  s0 = {
    label: 'Flight Crew Submitter ASAP',
    type: enode.root,
    children: require('./mock-form').mockFormFlightCrewSubmitterAsap
  }
} else
  s0 = { type: enode.root, children: [] }*/

const WithSideBar = p => {
  const c = React.Children.toArray(p.children)
  return <>
    <div id='side-bar'>{c[0]}</div>
    <div id='main-view'>{c[1]}</div>
  </>
}

const InsertNode = p => {
  const k = p.props.s.nextNodeKey
  const t = p.type
  return <DraggableNode node={makeNode(t, k)} props={p.props}>
    {node[t].label}
  </DraggableNode>
}

const exportForm = root => {
  const loop = t => {
    let tk = { ...t };//need this semicolon
    [
      'reactKey', 'hide', 'hasCount', 'class', 'selector', 'ddDepth',
      'parentSelector', 'edit'
    ].forEach(k => delete tk[k])
    tk.tooltip = t.tooltip || null
    if (!['banner', 'section'].includes(t.type))
      delete tk.children
    else if (t.hasOwnProperty('children'))
      tk.children = t.children.map(loop)
    return tk
  }
  //dipping a level so we don't put tooltip in root
  return {
    type: 'root',
    children: root.children.map(loop)
  }
}

const ensureBanner = form => form.children.length > 0 ? form ://can't edit if it's empty, nowhere to drag to
  { ...form, children: [{ type: 'banner', label: "Default Banner", children: []}] }

const FormEditorAux = p => {
  const [s, d] = useReducer(reducer, makeS0(ensureBanner(p.data.form)))
  const bfs = [type.banner, type.section, type.field]
  const rbfs = bfs.concat(type.root)
  const legalPremade = k => !rbfs.includes(k) && p.data.sections.includes(k) && !findSectionByType(s.form, k)
  const premades = Object.keys(node).filter(legalPremade).sort()
  
  const props = {
    s, d,
    ot: p.ot,
    name: p.name,
    ratWorksheets: p.ratWorksheets
  }

  const setHide = b => d(setAllContainerNodes('hide', b))
  const hide = () => setHide(true)
  const show = () => setHide(false)
  
  return (
    <Nav actions={[]}>
      <ButtonBar mainNav className='narrow small'>
        <Button type='other' text='Undo' onClick={() => d(undo())}/>
        <ExpandAllButton onClick={show}/>
        <CollapseAllButton onClick={hide}/>
        <SaveButton onClick={async () => {
          const r = await post('submission-form-put', {
            form: {
              ...exportForm(s.form),
              ot: p.ot,
              name: p.name
            }
          })
          const errs = r.data
          if (errs.length > 0) alert(errs)
        }}/>
        <BackButton/>
      </ButtonBar>
      <div className='form-editor'>
        <WithSideBar>
          <>
            <h3>Add Item</h3>
            {bfs.map((k, i) => <InsertNode key={i} type={k} props={props}/>)}
            <hr/>
            {premades.map((k, i) => <InsertNode key={i} type={k} props={props}/>)}
          </>
          <FormViewer name={p.name} props={props}/>
        </WithSideBar>
      </div>
    </Nav>
  )
}

const FormEditor = p => {
  const params = useParams()
  const [sparams,] = useSearchParams()
  const name = sparams.get('name') || 'submission-form'
  //const nav = useNavigate()
  const { data, error } = useFetch('submission-form-and-sections-get', {
    ot: params.ot,
    name
    //probably convert all fields to children on the backend, a field should
    //probably be a child of type field, and if there was some reason
    //we needed an extra children-like key, come up with an "aux" name
  }, [params.ot, name])
  const ratWorksheets = useFetch('get-rat-worksheets', {
    ot: params.ot
  }, [params.ot])
  if (process.env.NODE_ENV === 'development') {
    if (error) {
      console.log(error)
      return `FormEditor: ${error.message}`
    }
    const e = ratWorksheets.error
    if (e) {
      console.log(e)
      return `FormEditor: ${e.message}`
    }
  }
  const d = ratWorksheets.data
  if (!data || !d) return 'Loading ...'
  return <FormEditorAux ot={params.ot} name={name} data={data} ratWorksheets={d}/>
}

export default FormEditor
