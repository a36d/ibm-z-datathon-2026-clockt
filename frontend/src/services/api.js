const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    }
  );

  if (!response.ok) {
    throw new Error(
      `API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export const healthCheck = () =>
  request("/v1/health");

export const getActivities = () =>
  request("/v1/activities");

export const createActivity = (activity) =>
  request("/v1/activities", {
    method: "POST",
    body: JSON.stringify(activity),
  });

export const deleteActivity = (id) =>
  request(`/v1/activities/${id}`, {
    method: "DELETE",
  });

export const getStatistics = () =>
  request("/v1/statistics");

export const getAnalytics = getStatistics;

export const getRecommendations = () =>
  request("/v1/recommendations");

export const analyzeActivities = (activities) =>
  request("/v1/analyze-activities", {
    method: "POST",
    body: JSON.stringify(activities),
  });

export const getModels = () =>
  request("/v1/models");

export const createChatCompletion = (payload) =>
  request("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
