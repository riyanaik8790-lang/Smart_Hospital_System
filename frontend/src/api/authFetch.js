let redirectingForExpiredSession = false;

const clearExpiredSessionAndRedirect = () => {
  localStorage.clear();

  // Several requests may receive a 401 together; redirect once and let the
  // router's unauthenticated guard keep the login page protected.
  if (redirectingForExpiredSession || window.location.pathname === '/login') return;
  redirectingForExpiredSession = true;
  window.location.replace('/login');
};

export const authFetch = async (input, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...options, headers });

  if (response.status === 401) clearExpiredSessionAndRedirect();

  return response;
};
