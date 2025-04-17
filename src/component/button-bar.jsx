/*
ButtonBar: horizontal list of buttons
*/

const ButtonBar = p => (
  <div className={`button-bar ${p.className || ''}`}>
    <div>
      {p.children}
    </div>
  </div>
)

export default ButtonBar
