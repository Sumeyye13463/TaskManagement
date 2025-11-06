// src/api/pm.js
import api from './http';

export const PMApi = {
  listProjects: () => api.get('/pm/projects'),
  createProject: (body) => api.post('/pm/projects', body),
  getProject: (id) => api.get(`/pm/projects/${id}`),
  updateProject: (id, body) => api.put(`/pm/projects/${id}`, body),
  archiveProject: (id) => api.delete(`/pm/projects/${id}`),
};
