export const normalizeSkills = (raw) => {
  if (!raw) return [];

  const hydrate = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed !== trimmed) {
          return hydrate(parsed);
        }
      } catch {
        
      }
      return trimmed.split(',');
    }
    return [];
  };

  return hydrate(raw)
    .map((item) => {
      if (item == null) return '';
      return String(item)
        .replace(/\\"/g, '"')
        .replace(/^"+|"+$/g, '')
        .trim();
    })
    .filter(Boolean);
};

