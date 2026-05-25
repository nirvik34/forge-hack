import React from 'react';

function ThoughtInspector({ commit, onClose }) {
  if (!commit) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="font-bold text-lg text-gray-800">Commit Details</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">Hash: {commit.hash}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
            commit.status === 'flagged' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            Status: {commit.status.toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">Memory / Context</h3>
            <div className="bg-gray-900 text-gray-300 p-3 rounded-md font-mono text-sm overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(commit.payload, null, 2)}
            </div>
          </div>
          
          {commit.status === 'flagged' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-red-800 font-bold mb-1 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Rollback Recommended
              </h4>
              <p className="text-red-700 text-sm">
                Watchdog detected a potential hallucination. Would you like to rollback to the parent commit?
              </p>
              <button className="mt-3 bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white px-4 py-2 rounded text-sm transition">
                Rollback State
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThoughtInspector;
