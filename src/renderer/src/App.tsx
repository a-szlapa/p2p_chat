import { Group, Panel, Separator } from 'react-resizable-panels'
import SideBar from './components/SideBar'
import { useState } from 'react'

function App(): React.JSX.Element {
  const [selectedTab, setSelectedTab] = useState('Hub')
  return (
    <div className="bg-zinc-800 w-full h-screen flex flex-row justify-left border-2 border-yellow-100">
      <SideBar selectedTab={selectedTab} onTabChange={setSelectedTab} />

      <main className="p-4">Current tab: {selectedTab}</main>
    </div>
  )
}

export default App
