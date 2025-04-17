/*
Widget: a Separated with additional implied CSS
*/

import Separated from './separated'

const Widget = p => (
  <div className={p.className}>
    <Separated size={p.space || 'small'}>
      {p.children}
    </Separated>
  </div>
)

export default Widget
