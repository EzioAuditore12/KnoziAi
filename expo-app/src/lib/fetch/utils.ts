export const buildQueryParams = (query?: object) => {
  if (!query) return '';

  const params = new URLSearchParams();

  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined) return;

    if (value === null) {
      params.append(key, '');
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }

    params.append(key, String(value));
  });

  return params.toString();
};
