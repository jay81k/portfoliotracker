// window.storage localStorage shim + imgbb screenshot upload — moved out of App.jsx unchanged.
// Importing this module installs window.storage.

window.storage = {
    async get(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? { key, value, shared: false } : null;
        } catch (e) { return null; }
    },
    async set(key, value) {
        try {
            localStorage.setItem(key, value);
            return { key, value, shared: false };
        } catch (e) { return null; }
    }
};

// ── IndexedDB helpers for trade screenshots ──────────────────────────
// imgbb upload helper
const IMGBB_API_KEY = 'c836f1377a54e55b3495ce3b42355060';
export const uploadToImgbb = async (blob) => {
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    const form = new FormData();
    form.append('image', base64);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'imgbb upload failed');
    return data.data.url;
};
// ─────────────────────────────────────────────────────────────────────
