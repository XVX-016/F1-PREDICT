import { useState } from 'react';
import { BarChart3, Zap, Gauge, Timer, Settings, TrendingUp } from 'lucide-react';

export default function TelemetryPage() {
  const [selectedDriver1, setSelectedDriver1] = useState('verstappen');
  const [selectedDriver2, setSelectedDriver2] = useState('hamilton');
  const [selectedMetric, setSelectedMetric] = useState('speed');

  const drivers = [
    { id: 'verstappen', name: 'Max Verstappen', team: 'Red Bull', color: 'bg-blue-600' },
    { id: 'hamilton', name: 'Lewis Hamilton', team: 'Mercedes', color: 'bg-teal-500' },
    { id: 'leclerc', name: 'Charles Leclerc', team: 'Ferrari', color: 'bg-red-600' },
    { id: 'norris', name: 'Lando Norris', team: 'McLaren', color: 'bg-orange-500' }
  ];

  const telemetryMetrics = [
    { id: 'speed', label: 'Speed', unit: 'km/h', value1: 324, value2: 318 },
    { id: 'throttle', label: 'Throttle', unit: '%', value1: 98, value2: 95 },
    { id: 'brake', label: 'Brake', unit: '%', value1: 12, value2: 18 },
    { id: 'gforce', label: 'G-Force', unit: 'G', value1: 4.2, value2: 3.9 }
  ];

  const sectorTimes = [
    { sector: 'Sector 1', driver1: '24.123', driver2: '24.456', delta: '+0.333' },
    { sector: 'Sector 2', driver1: '38.789', driver2: '38.234', delta: '-0.555' },
    { sector: 'Sector 3', driver1: '26.456', driver2: '26.789', delta: '+0.333' }
  ];

  const circuitCorners = [
    { id: 1, name: 'Turn 1', speed: 180, drs: false },
    { id: 2, name: 'Turn 2', speed: 220, drs: false },
    { id: 3, name: 'Turn 3', speed: 280, drs: true },
    { id: 4, name: 'Turn 4', speed: 160, drs: false },
    { id: 5, name: 'Turn 5', speed: 200, drs: false },
    { id: 6, name: 'Turn 6', speed: 320, drs: true }
  ];

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-red-500" />
            Live Telemetry Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Real-time driver performance analysis and comparison</p>
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Driver 1
            </h3>
            <select 
              value={selectedDriver1}
              onChange={(e) => setSelectedDriver1(e.target.value)}
              className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            >
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-500" />
              Driver 2
            </h3>
            <select 
              value={selectedDriver2}
              onChange={(e) => setSelectedDriver2(e.target.value)}
              className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            >
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Metric Focus
            </h3>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
            >
              {telemetryMetrics.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Circuit Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Gauge className="w-6 h-6 text-red-500" />
                Circuit Analysis - Monaco GP
              </h2>
              
              {/* Simplified Circuit Visualization */}
              <div className="relative h-64 bg-gray-800/50 rounded-lg p-4 overflow-hidden">
                <div className="absolute inset-4 border-2 border-dashed border-gray-600 rounded-lg"></div>
                <div className="grid grid-cols-3 gap-4 h-full">
                  {circuitCorners.map((corner) => (
                    <div key={corner.id} className="relative">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        corner.drs ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-gray-500 bg-gray-500/20'
                      }`}>
                        {corner.id}
                      </div>
                      <div className="absolute top-10 left-0 text-xs">
                        <div className="font-semibold">{corner.name}</div>
                        <div className="text-gray-400">{corner.speed} km/h</div>
                        {corner.drs && <div className="text-green-400">DRS</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Telemetry Comparison */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Real-Time Telemetry Comparison
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {telemetryMetrics.map((metric) => (
                  <div key={metric.id} className="p-4 bg-black/30 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold">{metric.label}</span>
                      <span className="text-gray-400 text-sm">{metric.unit}</span>
                    </div>
                    
                    {/* Driver 1 Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-400">Driver 1</span>
                        <span>{metric.value1}{metric.unit}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${(metric.value1 / (metric.id === 'speed' ? 350 : 100)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Driver 2 Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-teal-400">Driver 2</span>
                        <span>{metric.value2}{metric.unit}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-teal-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${(metric.value2 / (metric.id === 'speed' ? 350 : 100)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Live Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-green-500" />
                Live Race Stats
              </h3>
              <div className="space-y-4">
                <div className="text-center p-3 bg-black/30 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-green-400">1:23:45</div>
                  <div className="text-gray-400 text-sm">Race Time</div>
                </div>
                <div className="text-center p-3 bg-black/30 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-yellow-400">1:18.543</div>
                  <div className="text-gray-400 text-sm">Fastest Lap</div>
                </div>
                <div className="text-center p-3 bg-black/30 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-red-400">45/78</div>
                  <div className="text-gray-400 text-sm">Current Lap</div>
                </div>
              </div>
            </div>

            {/* Sector Times */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Sector Times</h3>
              <div className="space-y-3">
                {sectorTimes.map((sector, i) => (
                  <div key={i} className="p-3 bg-black/30 rounded-lg">
                    <div className="font-semibold mb-2">{sector.sector}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-blue-400">D1: {sector.driver1}</div>
                      <div className="text-teal-400">D2: {sector.driver2}</div>
                    </div>
                    <div className={`text-center mt-1 font-mono text-sm ${
                      sector.delta.startsWith('+') ? 'text-red-400' : 'text-green-400'
                    }`}>
                      Δ {sector.delta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tire Information */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-red-600/20 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Tire Status</h3>
              <div className="space-y-4">
                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-400">Driver 1</span>
                    <span className="bg-red-600 px-2 py-1 rounded text-xs">SOFT</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Wear: 75%</div>
                </div>
                
                <div className="p-3 bg-black/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-teal-400">Driver 2</span>
                    <span className="bg-yellow-600 px-2 py-1 rounded text-xs">MEDIUM</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Wear: 45%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}