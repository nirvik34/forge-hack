import React, { createContext, useState, useContext } from 'react';

const AgentContext = createContext();

export const AgentProvider = ({ children }) => {
  const [activeAgent, setActiveAgent] = useState(null);
  const [activeBranch, setActiveBranch] = useState('main');

  return (
    <AgentContext.Provider value={{ activeAgent, setActiveAgent, activeBranch, setActiveBranch }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => useContext(AgentContext);
