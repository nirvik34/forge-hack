import React from 'react';

// Mock data for Watchdog alerts
const alerts = [
  { id: 1, commit: '4c5b6a', verdict: 'FAIL', reasoning: 'Hallucination detected: The agent assumed the file existed without checking.', time: '10 mins ago' },
  { id: 2, commit: 'f9e8d7', verdict: 'PASS', reasoning: 'Logic is sound.', time: '25 mins ago' },
];

function WatchdogAlerts() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm flex justify-between items-center">
        <span>Watchdog Scanner</span>
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {alerts.map(alert => (
          <div key={alert.id} className={`p-3 mb-2 rounded border text-sm ${alert.verdict === 'FAIL' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex justify-between mb-1">
              <span className={`font-bold ${alert.verdict === 'FAIL' ? 'text-red-700' : 'text-green-700'}`}>
                {alert.verdict}
              </span>
              <span className="text-gray-500 text-xs font-mono">{alert.commit}</span>
            </div>
            <p className="text-gray-700 mt-1 leading-tight">{alert.reasoning}</p>
            <p className="text-gray-400 text-xs mt-2">{alert.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WatchdogAlerts;
