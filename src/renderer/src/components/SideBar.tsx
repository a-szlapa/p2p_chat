
import React from 'react'

type SideBarProps = {
  selectedTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  'Hub',
  'Messages',
  'Communities',
  'Contacts',
  'Settings'
]

export default function SideBar({
  selectedTab,
  onTabChange
}: SideBarProps) {
  return (
    <div className="bg-zinc-800 flex flex-col border-2 border-yellow-100">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="radio"
          aria-checked={selectedTab === tab}
          onClick={() => onTabChange(tab)}
          className={`
            text-left p-2
            border-2 border-t-0
            ${
              selectedTab === tab
                ? 'bg-yellow-300 text-zinc-800 border-yellow-300'
                : 'text-white hover:bg-zinc-700 border-zinc-600'
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
