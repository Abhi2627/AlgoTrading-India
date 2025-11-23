'use client';

interface SectorNavProps {
  sectors: string[];
  activeSector: string;
  onSectorChange: (sector: string) => void;
}

export default function SectorNav({ sectors, activeSector, onSectorChange }: SectorNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {/* Home Button - Always first */}
          <button
            onClick={() => onSectorChange('home')}
            className={`flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm ${
              activeSector === 'home'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏠 Home
          </button>

          {/* Sector Buttons */}
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => onSectorChange(sector)}
              className={`flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeSector === sector
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}