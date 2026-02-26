
import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

export default function ProductSearch({search, setSearch, onSearch}) {

  return (
    <div className='flex gap-2 mb-4'>
     <Input
     placeholder='Search products...'
     value={search}
     onChange={(e)=>setSearch(e.target.value)}
     />
     <Button onClick={onSearch}>Search</Button>
    </div>
  )
}
