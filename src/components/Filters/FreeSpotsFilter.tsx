import React from "react"

export type FreeSpotFilterValue = "all" | "one" | "twoOrMore"

interface FreeSpotsFilterProps {
  value: FreeSpotFilterValue
  onChange: (value: FreeSpotFilterValue) => void
}

export const FreeSpotsFilter: React.FC<FreeSpotsFilterProps> = ({
  value,
  onChange,
}) => {
  const filters: { value: FreeSpotFilterValue; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "one", label: "1 свободное место" },
    { value: "twoOrMore", label: "2 и более свободных мест" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            value === filter.value
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
