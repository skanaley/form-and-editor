/*
SearchableList: yer basic text field with autocomplete
*/

//TODO: clear input and state button or on-delete-last-character kind of thing
//TODO: allOptions is apparently not needed
import { useState } from 'react'
import Button from './button'

const maxSearchDisplayLength = 15

const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const SearchableList = p => {
  const [searchString, setSearchString] = useState(p.renderOption(p.value))
  const [searchOptions, setSearchOptions] = useState([])
  
  const indexify = os => os.map((o, i) => ({ o: o, i: i}))
  
  const clearSearch = () => {
    setSearchString('')
    setSearchOptions([])
  }
  
  const updateAllOptions = async s => {
    if (!(p.options instanceof Function))
      return indexify(p.options)
    try {
      const r = await p.options(s)
      return indexify(r.data)
    } catch (e) {
      console.log(e)
      return []
    }
  }
  
  const onSearchStringChange = async s => {
    setSearchString(s)
    const os = await updateAllOptions(s)
    const r = RegExp(escape(s), 'i')
    setSearchOptions(os.filter(o => p.optionSearchString(o.o).match(r)))
    if (p.searchStringIsValue)
      p.setValue(s)
  }
  
  const onSetSelected = o => {
    clearSearch()
    p.setIndex(o.i)
    p.setValue(o.o)
  }

  const onFocus = () => p.value === '' && onSearchStringChange('')

  return (
    <div className='searchable-list'>
      <input
        placeholder={p.placeholder}
        value={searchString || p.renderOption(p.value)}
        onChange={e => onSearchStringChange(e.target.value)}
        onBlur={clearSearch}
        onFocus={onFocus}
      />
      <Button
        text='&times;'
        onClick={() => {
          p.setValue('')
          clearSearch()
          //if (p.searchStringIsValue)
            //setSearchString('')
        }}
      />
      {searchOptions.length > 0 && <div className='search-options'>
        {searchOptions.slice(0, maxSearchDisplayLength).map((o, i) => <div
          key={i}
          onMouseDown={() => onSetSelected(o)}
        >{p.renderOption(o.o)}</div>)}
      </div>}
    </div>
  )
}

export default SearchableList
