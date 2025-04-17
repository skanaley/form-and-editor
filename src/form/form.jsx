/* NOTE: Validation currently works as a tree matching the form where if any
node has the key invalid=true, the whole form cannot be submited.
*/

//#region Imports
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import update from 'immutability-helper'
import { post, postFileAsMultipartFormData, useFFetch } from '../session'
import Nav from '../component/nav'
import useFields, { initFields } from './use-fields'
import useCollapsible, { addIds } from '../component/use-collapsible'
import Button, {
  BackButton,
  CancelButton,
  CollapseAllButton,
  ExpandAllButton,
  SubmitButton
} from '../component/button'
import ButtonBar from '../component/button-bar'
import Box from '../component/box'
import Modal from '../component/modal'
import Separated from '../component/separated'
import { mode, type } from '../form-lib/enums'
import { findFieldByTax, findSection, findSectionByType, modSectionByType } from '../form-lib/query'
import DoubleCheck from '../component/double-check'
import Employee, { verifySelfAlert } from './premade/employee'
import FlightSelect from './premade/flight-select'
import Jasc, { exportValues as jascExportValues, makeS0 as makeJascS0 } from './premade/jasc'
import Losav2, { makeS0 as makeLosav2S0, exportValues as exportLosav2Values } from './premade/losav2'
import RatWorksheet, { exportValues as ratExportValues, init as ratInit } from './premade/rat-worksheet'
import RiskAssessment from './premade/risk-matrix'
//#endregion

//#region Form State Init
const fillPremade = (s, sId) => {
  switch (s.type) {
  case type.losav2ThreatError: {//var scope
    const is = s['incomplete-state'] || {}
    const s0 = makeLosav2S0(s.children, is)
    return [
      { ...s, sectionId: sId, schema: s.children, children: [] },
      s0,
      exportLosav2Values
    ]
  }
  //fallthrough
  case type.affectedDepartment:
  case type.affectedFaaApprovedProgram:
  case type.affectedManual:
  case type.affectedRegulatoryComplianceElement:
  case type.analyst:
  case type.attachment:
  //case type.employee:
  case type.hazmatEventInformation:
  case type.foqa:
  case type.losaErrorInformation:
  case type.losaThreatInformation:
  case type.losaUndesiredAircraftState:
  //case type.losav2ThreatError:
  case type.otherEmployees:
  case type.rmpType:
  case type.safety:
  case type.section:
    return [{ ...s, sectionId: sId, children: s.children.map(c => ({
      ...c,
      //bit of a hack to allow premades to do their custom submits
      parentId: sId,
      parentType: s.type
    }))}, null, null]
  //fallthrough
  case type.anticipatedAggregateResidualRiskAssessment:
  case type.anticipatedResidualRiskAssessment:
  case type.riskAssessment:
  case type.substituteRiskAssessment:
    return [{
      ...s,
      jsonml: s.children.jsonml,
      children: s.children.multifields
    }, null, null]
  //fallthrough
  case type.jascEvent:
  case type.jascFailure: {
    const s0 = makeJascS0(s['incomplete-state'])
    return [{ ...s, sectionId: sId, children: [], ...s.children }, s0, jascExportValues]
  }
  case type.ratWorksheet:
    const w = s.children
    if (typeof w === 'string') return [{ ...s, children: [w] }, null, null]
    const [ts, s0] = ratInit(w)
    return [{ ...s, sectionId: sId, children: [], w, ts }, s0, ratExportValues]
  case type.flightSelect: return [{ ...s, sectionId: sId, children: [] }, null, null]
  default:
    throw Error('unknown section: ' + s.type)
  }
}

const mapFormSectionsAndAccumStates = (form, f) => {
  let id = -1
  const states = {}
  const exporters = {}
  return [{
    ...form, children: form.children.map(b => ({
      ...b, children: b.children.map(s => {
        ++id
        const [s1, st, e] = f(s, id)
        states[id] = st
        exporters[id] = e
        return s1
      })
    }))
  }, states, exporters]
}

const fillPremadesAndMakeInitState = form => mapFormSectionsAndAccumStates(form, fillPremade)
//#endregion

//#region UI
const Section = p => {
  const show = p.expanded(p.s)
  const renderChildren = () => {
    switch (p.s.type) {
    case type.losav2ThreatError: return <Losav2 s={p.s} st={p.gps(p.s.sectionId)} setSt={st => p.sps(p.s.sectionId, st)}/>
    //fallthrough, these premades render as plain sections once built
    case type.affectedDepartment:
    case type.affectedFaaApprovedProgram:
    case type.affectedManual:
    case type.affectedRegulatoryComplianceElement:
    case type.analyst:
    case type.foqa:
    case type.hazmatEventInformation:
    case type.losaErrorInformation:
    case type.losaThreatInformation:
    case type.losaUndesiredAircraftState:
    case type.otherEmployees:
    case type.rmpType:
    case type.safety:
    case type.section: return <Separated size='small' className='fields'>
      {p.s.children.map((f, i) => p.rf(f, i))}
    </Separated>
    case type.attachment: return p.s.children.map((f, i) => p.rf(f, i))
    //fallthrough
    case type.anticipatedAggregateResidualRiskAssessment:
    case type.anticipatedResidualRiskAssessment:
    case type.riskAssessment:
    case type.substituteRiskAssessment: return <RiskAssessment s={p.s} rf={p.rf}/>
    //case type.employee: return <Employee s={p.s} rf={p.rf} sin={p.sin}/>
    case type.flightSelect: return <FlightSelect s={p.s}/>
    //fallthrough
    case type.jascEvent:
    case type.jascFailure: return <Jasc s={p.s} st={p.gps(p.s.sectionId)} setSt={st => p.sps(p.s.sectionId, st)} sin={p.sin}/>
    case type.ratWorksheet: return <RatWorksheet s={p.s} st={p.gps(p.s.sectionId)} setSt={st => p.sps(p.s.sectionId, st)}/>
    default: throw Error('Section::premade: unknown type: ' + p.s.type)
    }
  }
  return (
    <section className='section'>
      <header>
        {p.lite ?
          <></> :
          <span
            className={show ? 'hide' : 'show'}
            onClick={p.lite ? () => {} : () => p.toggle(p.s)}
          />
        }
        <h3 title={p.s.tooltip}>{p.s.label}</h3>
      </header>
      {show ? renderChildren() : <></>}
    </section>
  )
}

const Banner = p => {
  const show = p.expanded(p.b)
  return (
    <section className='banner'>
      <header>
        <h2>{p.b.label}</h2>
        <span
          className={show ? 'hide' : 'show'}
          onClick={() => p.toggle(p.b)}
        />
        </header>
      {show && <>{p.b.children.map((s, i) => <Section
        key={i}
        bannerLabel={p.b.label}
        s={s}
        expanded={p.expanded}
        toggle={p.toggle}
        get={p.getState}
        rf={p.rf}
        sfs={p.sfs}
        gps={p.gps}
        sps={p.sps}
        sin={p.sin}
      />)}</>}
    </section>
  )
}

const Progress = p => {
  const ref = useRef()
  const n = p.progress.filter(x => x).length
  const m = p.progress.length
  const w = 300
  const h = 30
  useEffect(() => {
    if (ref.current) {
      const x = ref.current.getContext('2d')
      x.clearRect(0, 0, w, h)
      x.fillStyle = '#1c883a'
      x.fillRect(0, 0, w*n/m, h)
      x.fillStyle = 'black'
      x.strokeRect(0, 0, w, h)
      x.font = '16px sans serif'
      x.fillText(`${n} / ${m}`, w/2, h-16/2)
    }
  }, [n])
  return (
    <Box>
      <h3>Upload Progress</h3>
      <canvas ref={ref} width={w} height={h}/>
    </Box>
  )
}

const tmpFoqaHack = data => {
  //we assume TN is 1st field
  const f = data.children[0].children[0].children[0]
  if (!f || !f.attribute === 'cp-tail-number') return data
  const os = f['values/options']
  if (f.length === 0) return data
  f.value = os[0]
  return data
}

const isFoqaOt = ot => ot.match(/-foqa$/)

const dataToUseFields = (ot, data) =>
  initFields(!isFoqaOt(ot) ? data : tmpFoqaHack(data))

const onFlightSelect = (root, setField) => async maybeIdStr => {
  let data
  if (!maybeIdStr) {
    data = {
      number: '',
      departure: '',
      arrival: '',
      landing: '',
      'aircraft-type': '',
      name: ''
    }
  } else {
    const r = await post('flight-select-data', { id: maybeIdStr })
    data = r.data
  }
  const o = {
    description: {
      'flight-information': ['number', 'departure', 'arrival', 'landing'],
      'aircraft-configuration': ['aircraft-type', 'name']
    }
  }
  Object.keys(o).forEach(asp => {
    const oasp = o[asp]
    Object.keys(oasp).forEach(cat => {
      const ocat = oasp[cat]
      ocat.forEach(att => {
        const f = findFieldByTax(root, asp, cat, att)
        if (f) setField(f.stateId, data[att])
      })
    })
  })
}

const FormAux = p => {
  const nav = useNavigate()
  const { root: ufRoot, getState, getWState, setField, setFields, renderField, makeSubmitData, getAttachments, getEmptyRequiredFieldIds }
    = useFields(...dataToUseFields(p.ot, p.data), null, p.etIsZero)
  const { root: ucRoot, expanded, toggle, setAll } = useCollapsible(addIds(ufRoot))
  const [canSubmit, setCanSubmit] = useState(true)
  const [progress, setProgress] = useState(null)
  const [showDoubleCheck, setShowDoubleCheck] = useState(false)
  const [invalidNodes, setInvalidNodes] = useState({})//premade errors

  const setInvalidNode = (id, es) => setInvalidNodes(o => update(o, {[id]: {$set: es}}))

  //we hack on the mod function AFTER building the whole form, otherwise the fields don't exist yet
  const root = modSectionByType(ucRoot, type.flightSelect, {onFlightSelect: {$set: onFlightSelect(ucRoot, setField)}})
  
  const pErrs = Object.values(invalidNodes).flat()
  const [us, sss] = getEmptyRequiredFieldIds()
  const fs = getWState(getState())
  const uErrs = us.map(u => {
    const { label, aspect, category, attribute } = fs[u]
    return `${label} is required (${aspect} ${category} ${attribute})`
  })
  const sErrs = sss.flatMap(ss => `At least one of ${ss.map(s => `${fs[s].label}`).join(', ')} is required`)
  const errs = pErrs.concat(uErrs).concat(sErrs)
  const valid = errs.length === 0

  const [premadeStates, setPremadeStates] = useState(p.st0)
  const getPremadeState = id => premadeStates[id]
  const setPremadeState = (id, s) => setPremadeStates(
    pss => update(pss, {[id]: {$set: s}})
  )
  const getPremadeSection = id => findSection(root, s => s.sectionId == id)//== for string coerce from 'int' key

  const makeSubmitDataWithPremadeState = () => {
    const d = Object.keys(premadeStates).reduce(
      (acc, k) => {
        const st = premadeStates[k]
        if (st === null) return acc//tmp dev hack
        const x = p.exporters[k](st, getPremadeSection(k))
        if (x.customExport) return { ...acc, ...x.customExport }
        return { ...acc, standard: acc.standard.concat(x) }
      },
      { standard: makeSubmitData() }
    )
    if (Object.keys(d).length === 1) return d.standard
    return d
  }
  
  const excludes = p.data['exclude-buttons'] || []

  const doSac = async () => {
    const r = await handleSubmit(mode.partial)
    if (r !== null) {
      nav(`/form/${r.data['object-id']}?user=${p.user}&hotline=${p.hotline}`)
      location.reload()//otherwise attachments don't reload
    }
  }

  const doSacl = async () => {
    await handleSubmit(mode.partial)
    window.location = document.getElementById('root')
      .getAttribute('data-cancel-url')
  }
  
  const [handleSubmit, handleFoqaSubmit] = (() => {//sharing inner formSubmit with both
    const formSubmit = (m=mode.complete) => p.id ?
      post('submission-form-continue', {
        id: p.id,
        mode: m,
        data: makeSubmitDataWithPremadeState()
      }) :
      post('submission-form-submit', {
        gpid: p.gpid,
        pid: p.pid,
        ot: p.ot,
        name: p.name,
        mode: m,
        source: p.source,
        data: makeSubmitDataWithPremadeState()
      })
    return [
      async m => {
        try {
          const files = getAttachments()
          const n = files && files.length || 0
          //const sid = findSectionByType(root, type.attachment).children[0].stateId
          setProgress(Array(n).fill(false))
    
          const submitAttachment = id => async (file, i) => {
            await postFileAsMultipartFormData('object-submit-attachment', id, file)
            setProgress(pro => update(pro, {[i]: {$set: true}}))
            return Promise.resolve()
          }
          
          const r = await formSubmit(m)
          const id = r.data['object-id']
          if (files) await Promise.all(files.map(submitAttachment(id)))
          return r
        } catch(e) {
          console.log('form submit: ' + e.response.data)
          return null
        } finally { setProgress(null) }
      },
      async m => {
        const files = getAttachments()
        if (files.length === 0) p.onClose()//?
        const n = files.length
        
        setProgress(Array(n).fill([false, false]))
        
        const submitOneObjectPerAttachment = async (file, i) => {
          try {
            //const i1 = i + 1
            const r = await formSubmit(m)
            const id = r.data
            setProgress(pro => update(pro, {[i]: {0: {$set: true}}}))
            await postFileAsMultipartFormData(
              'submission-form-foqa-attachment-submit', id, file
            )
            setProgress(pro => update(pro, {[i]: {1: {$set: true}}}))
            return Promise.resolve(id)
          } catch (e) {
            console.log('form submit: ' + e.response.data)
            setCanSubmit(true)
            setProgress(null)
            return Promise.reject(e.response.data)
          }
        }
        
        const ids = await Promise.all(files.map(submitOneObjectPerAttachment))
        
        setProgress(null)
        
        p.onClose()
        if (ids.length > 0)
          p.onSubmit(ids[0])
      }
    ]
  })()
  
  if (p.lite) {
    const b = root.children[0]
    return (
      <Box className='form lite'>
        <Section
          lite
          bannerLabel={b.label}
          s={b.children[0]}
          expanded={expanded}
          toggle={toggle}
          rf={renderField}
        />
        <ButtonBar className='wide'>
          <SubmitButton
            disabled={!canSubmit}
            onClick={async () => {
              setCanSubmit(false)
              const r = await handleSubmit()
              const id = r.data
              //await handleAttachmentSubmit(id)
              p.onClose()
              p.onSubmit(id)
            }}
          />
          <CancelButton onClick={() => { p.onClose(); p.onCancel() }}/>
        </ButtonBar>
      </Box>
    )
  }
  
  return (
    <Nav alerts={errs} actions={[]}>
      <ButtonBar mainNav className='narrow small'>
        {!excludes.includes('expandAndCollapse') && <>
          <ExpandAllButton onClick={() => setAll(true)}/>
          <CollapseAllButton onClick={() => setAll(false)}/>
        </>}
        {!excludes.includes('bothSaves') && <>
          <Button type='other' text='Save and Continue' onClick={doSac}/>
          <Button type='other' text='Save and Complete Later' onClick={doSacl}/>
        </>}
        {p.hotline === 'true' && <Button disabled={!canSubmit} type='add' text='Submit Hotline' onClick={() => setShowDoubleCheck(mode.hotline)}/>}
        <SubmitButton disabled={!(canSubmit && valid)} onClick={() => setShowDoubleCheck(mode.complete)}/>
        <BackButton onClick={() => { p.onClose(); p.onCancel() }}/>
      </ButtonBar>
      {showDoubleCheck && <DoubleCheck
        text='Are you sure you wish to submit?'
        onCancel={() => setShowDoubleCheck(false)}
        onSubmit={async () => {
          const m = showDoubleCheck
          setShowDoubleCheck(false)
          setCanSubmit(false)
          const r = isFoqaOt(p.ot) ? await handleFoqaSubmit(m) : await handleSubmit(m)
          if (r !== null) {
            p.onClose()
            p.onSubmit(r.data['object-id'])
          } else setCanSubmit(true)
        }}
      />}
      <Box className='form'>
        {root.children.map((b, i) => <Banner
          key={i}
          b={b}
          expanded={expanded}
          toggle={toggle}
          getState={getState}
          rf={renderField}
          sfs={setFields}
          gps={getPremadeState}
          sps={setPremadeState}
          sin={setInvalidNode}
        />)}
        {progress && <Modal><Progress progress={progress.flat()}/></Modal>}
      </Box>
    </Nav>
  )
}

export const Form = p => {
  const { data, error } = useFFetch('submission-form-get', {
    ot: p.ot,
    name: p.name,
    user: p.user
  }, [p.ot, p.name, p.user], fillPremadesAndMakeInitState)
  if (process.env.NODE_ENV === 'development') {
    if (error) {
      console.log(error)
      return `Form: ${error.message}`
    }
  }
  if (!data) return 'Loading ...'
  return <FormAux
    etIsZero={p.etIsZero}
    lite={p.lite}
    gpid={p.gpid || null}
    pid={p.pid || null}
    ot={p.ot}
    name={p.name}
    user={p.user}
    source={p.source}
    hotline={p.hotline}
    data={data[0]}
    st0={data[1]}
    exporters={data[2]}
    onClose={p.onClose || (() => {})}
    onSubmit={p.onSubmit || (() => {})}
    onCancel={p.onCancel || (() => {})}
  />
}

const FormIncomplete = p => {
  const { data, error } = useFFetch('submission-form-get-incomplete', {
    id: p.id,
    user: p.user
  }, [p.id, p.user], fillPremadesAndMakeInitState)
  if (process.env.NODE_ENV === 'development') {
    if (error) {
      console.log(error)
      return `FormIncomplete: ${error.message}`
    }
  }
  if (!data) return 'Loading ...'
  const [form, st0, exporters] = data
  return <FormAux
    etIsZero={p.etIsZero}
    lite={p.lite}
    gpid={p.gpid || null}
    pid={p.pid || null}
    id={p.id}
    ot={form.ot}
    name={p.name}
    user={p.user}
    hotline={p.hotline}
    data={form}
    st0={st0}
    exporters={exporters}
    onClose={p.onClose || (() => {})}
    onSubmit={p.onSubmit || (() => {})}
    onCancel={p.onCancel || (() => {})}
  />
}

export const FormParam = p => {
  const params = useParams()
  const [sparams,] = useSearchParams()
  const nav = useNavigate()
  const name = sparams.get('name') || 'submission-form'
  const source = sparams.get('source') || null
  const user = sparams.get('user') || 'self'
  const hotline = sparams.get('hotline') || false
  
  const onSubmit = id => {
    if (process.env.NODE_ENV !== 'development') {
      window.location = document.getElementById('root')
        .getAttribute('data-submit-url').replace(/pkey=pkey/, `pkey=${id}`)
    } else
      nav('/object/' + id)
  }
  
  const onCancel = () => {
    if (process.env.NODE_ENV !== 'development') {
      window.location = document.getElementById('root')
        .getAttribute('data-cancel-url')
    }
  }

  const x = parseInt(params.otOrId)
  if (isNaN(x)) return <Form ot={params.otOrId} name={name} source={source} user={user} hotline={hotline} onSubmit={onSubmit} onCancel={onCancel}/>
  return <FormIncomplete id={x} name={name} user={user} hotline={hotline} onSubmit={onSubmit} onCancel={onCancel}/>
}
//#endregion

/*const esec = findSectionByType(p.data, type.employee)
  const [invalidNodes, setInvalidNodes] = useState(esec ?
    { [esec.sectionId]: [verifySelfAlert] } :
    {}
  )
    const eErrs = Object.values(invalidNodes).flat()
    eErrs.concat...*/
