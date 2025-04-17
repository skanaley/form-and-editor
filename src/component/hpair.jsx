/*
HPair: horizontal pair, e.g. [aLabel, aFormField]
*/

const HPair = p => (
  <div className={`hpair` + (p.className ? ` ${p.className}` : '')}>
    {p.children[0]}
    {p.children[1]}
  </div>
)

export default HPair
