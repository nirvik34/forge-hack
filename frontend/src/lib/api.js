import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const getCommits = async () => {
  // Mock function if endpoint doesn't exist to fetch all commits
  // For a real app, you'd want an endpoint to list commits by branch/agent
  return [];
};

export const getCommit = async (hash) => {
  const response = await api.get(`/commits/${hash}`);
  return response.data;
};

export const triggerScan = async (hash) => {
  const response = await api.post(`/scan`, { commit_hash: hash });
  return response.data;
};

export default api;
