/*
ServerSearchableList: like SearchableList but designed to fetch the autocompletes
*/

import { useState } from 'react'
import Button from './button'

const ServerSearchableList = p => {
  const [searchString, setSearchString] = useState(p.renderOption(p.value))
  const [searchOptions, setSearchOptions] = useState([])
  
  const clearSearch = () => {
    setSearchString('')
    setSearchOptions([])
  }
  
  const updateAllOptions = async s => {
    try {
      const r = await p.options(s)
      return r.data
    } catch (e) {
      console.log(e)
      return []
    }
  }
  
  const onSearchStringChange = async s => {
    setSearchString(s)
    setSearchOptions(await updateAllOptions(s))
  }
  
  const onSetSelected = o => {
    clearSearch()
    p.setValue(o)
  }

  const v = searchString || p.renderOption(p.value)
  const oc = e => onSearchStringChange(e.target.value)

  const inp = <input
    placeholder={p.placeholder}
    value={v}
    onChange={oc}
    onBlur={clearSearch}
  />

  const clear = <Button text='&times;' onClick={() => { p.setValue(''); clearSearch() }}/>

  const maybeOptions = searchOptions.length > 0 &&
    <div className='search-options'>
      {searchOptions.map((o, i) => <div
        key={i}
        onMouseDown={() => onSetSelected(o)}
      >
        {p.renderOption(o)}
      </div>)}
    </div>
    
  return <div className='searchable-list'>
    {inp}
    {clear}
    {maybeOptions}
  </div>
}

export default ServerSearchableList
