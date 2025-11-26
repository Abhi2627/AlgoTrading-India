'use client';

interface SectorNavProps {
  sectors: string[];
  activeSector: string;
  onSectorChange: (sector: string) => void;
}

// Helper function to determine the class names for an active/inactive button
const getButtonClasses = (isActive: boolean) => 
  `flex-shrink-0 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
    isActive
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`;

export default function SectorNav({ sectors, activeSector, onSectorChange }: SectorNavProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {/* 1. Home Button */}
          <button
            onClick={() => onSectorChange('home')}
            className={getButtonClasses(activeSector === 'home')}
          >
            Home
          </button>

          {/* 2. Portfolio Button - Added link that should map to /portfolio */}
          <button
            onClick={() => onSectorChange('portfolio')}
            className={getButtonClasses(activeSector === 'portfolio')}
          >
            Portfolio
          </button>

          {/* 3. Sector Buttons */}
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => onSectorChange(sector)}
              className={getButtonClasses(activeSector === sector)}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}