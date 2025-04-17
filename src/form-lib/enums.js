export const oper = {
  delete: 'delete',
  insert: 'insert',
  move: 'move',
  set: 'set'
}

export const type = {
  root: 'root',
  banner: 'banner',
  section: 'section',
  field: 'field',
  
  affectedDepartment: 'affected-department',
  affectedFaaApprovedProgram: 'affected-faa-approved-program',
  affectedManual: 'affected-manual',
  affectedRegulatoryComplianceElement: 'affected-regulatory-compliance-element',
  analyst: 'analyst',
  anticipatedAggregateResidualRiskAssessment:
    'anticipated-aggregate-residual-risk-assessment',
  anticipatedResidualRiskAssessment: 'anticipated-residual-risk-assessment',
  attachment: 'attachment',
  employee: 'employee',
  flightSelect: 'flight-select',
  foqa: 'foqa',
  hazmatEventInformation: 'hazmat-event-information',
  jascEvent: 'jasc-event',
  jascFailure: 'jasc-failure',
  losaErrorInformation: 'losa-error-information',
  losaThreatInformation: 'losa-threat-information',
  losaUndesiredAircraftState: 'losa-undesired-aircraft-state',
  losav2ThreatError: 'losav2-threat-error',
  otherEmployees: 'other-employees',
  ratWorksheet: 'rat-worksheet',
  riskAssessment: 'risk-assessment',
  rmpType: 'rmp-type',
  safety: 'safety',
  substituteRiskAssessment: 'substitute-risk-assessment'
}

export const isPremade = t =>
  ![type.root, type.banner, type.section, type.field].includes(t)

const premade = hasCount => a => a.concat(
  [hasCount, type.section, type.banner, 1]
)

export const makeNode = (t, k) => {
  const n = { ...node[t] }
  n.reactKey = k
  switch (t) {
  case type.root:
    throw Error('makeNode: cannot make root')
  case type.banner:
    n.children = []
    break
  case type.field:
    n.aspect = ''
    n.category = ''
    n.attribute = ''
    n.required = false
    n.edit = true
    break
  case type.section:
    n.children = []
    break
  default:
    if (n.hasCount)
      n.count = 1
  }
  return n
}

export const node = [//basic
  [type.root, 'Root', false, null, null, null],
  [type.banner, 'Banner', false, type.banner, type.root, 0],
  [type.section, 'Section', false, type.section, type.banner, 1],
  [type.field, 'Field', false, type.field, type.section, 2]
].concat([//single
  [type.affectedDepartment, 'Affected Department'],
  [type.affectedFaaApprovedProgram, 'Affected FAA Approved Program'],
  [type.affectedManual, 'Affected Manual'],
  [type.affectedRegulatoryComplianceElement, 'Affected Regulatory Compliance Element'],
  [type.anticipatedAggregateResidualRiskAssessment, 'Anticipated Aggregate Residual Risk Assessment'],
  [type.anticipatedResidualRiskAssessment, 'Anticipated Residual Risk Assessment'],
  [type.attachment, 'Attachment'],
  [type.employee, 'Employee'],
  [type.flightSelect, 'Flight Select'],
  [type.jascEvent, 'JASC Event'],
  [type.jascFailure, 'JASC Failure'],
  [type.foqa, 'FOQA'],
  [type.losav2ThreatError, 'LOSAV2 Threat Error'],
  [type.riskAssessment, 'Risk Assessment'],
  [type.rmpType, 'RMP Type'],
  [type.safety, 'Safety'],
  [type.substituteRiskAssessment, 'Substitute Risk Assessment']
]).map(premade(false)).concat([//multi
  [type.hazmatEventInformation, 'Hazmat Event Information'],
  [type.losaErrorInformation, 'LOSA Error Information'],
  [type.losaThreatInformation, 'LOSA Threat Information'],
  [type.losaUndesiredAircraftState, 'LOSA Undesired Aircraft State'],
  [type.otherEmployees, 'Other Employees'],
  [type.ratWorksheet, 'RAT Worksheet']
].map(premade(true))).reduce((acc, a) => ({
  ...acc,
  [a[0]]: {
    type: a[0],
    class: a[0],
    label: a[1],
    hasCount: a[2],
    selector: '.' + a[3],
    parentSelector: '.' + a[4],
    ddDepth: a[5]
  }
}), {})

export const mode = {
  partial: 'partial',
  hotline: 'hotline',
  complete: 'complete'
}
