const BASE_URL = 'http://localhost:3001/api/credentials';

export const saveCredentialMetadata = async (hash, recipient, institution, name) => {
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash,
        recipient,
        institution,
        name,
        data: { issuedAt: new Date().toISOString() }
      })
    });
    return res.ok;
  } catch (err) {
    console.error("Backend save failed", err);
    return false; // don't crash UI
  }
};

export const fetchCredentialMetadata = async (hash) => {
  try {
    const res = await fetch(`${BASE_URL}/${hash}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Metadata fetch failed", err);
  }
  return null;
};
