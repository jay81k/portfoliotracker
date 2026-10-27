// window.storage localStorage shim + screenshot upload via the Worker.
// Importing this module installs window.storage.

import { PROXY } from './config';

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
// Screenshot upload: the image goes to the Worker, which adds the imgbb key server-side.
export const uploadToImgbb = async (blob) => {
    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    const form = new FormData();
    form.append('image', base64);
    const res = await fetch(`${PROXY}/upload`, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'imgbb upload failed');
    return data.data.url;
};
// ─────────────────────────────────────────────────────────────────────
