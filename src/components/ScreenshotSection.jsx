// Screenshot picker used by the add/edit trade modals — moved out of App.jsx.

import React from 'react';
import { CameraIcon, ClipboardIcon } from './icons';

export default function ScreenshotSection(props) {
    const {
        T, fileInputRef, handleScreenshotFile, isPasteActive, pendingBlobs, screenshotUrls, setIsPasteActive,
        setLightboxData, setPendingBlobs, setScreenshotUrls, showConfirm, uploadingScreenshots,
    } = props;

        const totalCount = screenshotUrls.length + pendingBlobs.length;
        const atMax = totalCount >= 10;
        const allItems = [
            ...screenshotUrls.map(url => ({ type: 'url', src: url })),
            ...pendingBlobs.map(blob => ({ type: 'blob', src: blob instanceof Blob ? URL.createObjectURL(blob) : null }))
        ].filter(item => item.src);
        const removeItem = (idx) => {
            const isUploaded = idx < screenshotUrls.length;
            if (isUploaded) {
                showConfirm(
                    'Delete Screenshot',
                    'Are you sure you want to remove this screenshot?',
                    () => setScreenshotUrls(prev => prev.filter((_, i) => i !== idx))
                );
            } else {
                setPendingBlobs(prev => prev.filter((_, i) => i !== (idx - screenshotUrls.length)));
            }
        };
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: T.textSecondary, fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>
                    Screenshots
                    <span style={{ color: T.textFaint, fontSize: '0.68rem', fontWeight: 400, marginLeft: '0.4rem', textTransform: 'none' }}>
                        {totalCount > 0 ? `${totalCount}/10` : 'optional'}
                    </span>
                </label>
                <div style={{ flex: 1, minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {allItems.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {allItems.map((item, idx) => (
                                <div key={idx} style={{ position: 'relative', width: 80, height: 60, borderRadius: '3px', overflow: 'hidden', border: `1px solid ${item.type === 'blob' ? T.amber : T.borderStrong}`, flexShrink: 0 }}>
                                    <img src={item.src} alt={`screenshot ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                                        onClick={() => setLightboxData({ srcs: allItems.map(i => i.src), index: idx })}
                                    />
                                    {item.type === 'blob' && (
                                        <div style={{ position: 'absolute', bottom: 1, left: 1, fontSize: '0.45rem', fontWeight: '700', color: T.amber, background: 'rgba(0,0,0,0.65)', padding: '0 2px', borderRadius: '2px', lineHeight: 1.4 }}>PENDING</div>
                                    )}
                                    <button onClick={() => removeItem(idx)} style={{ position: 'absolute', top: 1, right: 1, width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: '900', lineHeight: 1 }} title="Remove">&#x2715;</button>
                                </div>
                            ))}
                        </div>
                    )}
                    {uploadingScreenshots && (
                        <div style={{ fontSize: '0.68rem', color: T.blue, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: `2px solid ${T.blue}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                            Uploading...
                        </div>
                    )}
                    {!atMax && (
                        <div style={{ flex: allItems.length === 0 ? 1 : 0, minHeight: allItems.length === 0 ? '80px' : 'unset', border: isPasteActive ? `1px dashed ${T.blue}` : 'none', borderRadius: '4px', background: isPasteActive ? 'rgba(0,204,255,0.04)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem', transition: 'all 0.15s' }}>
                            {isPasteActive ? (
                                <>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,204,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue }}><ClipboardIcon size={13} /></div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ color: T.blue, fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.05em' }}>READY</div>
                                        <div style={{ color: T.textMuted, fontSize: '0.62rem', marginTop: '0.15rem' }}>Press Cmd/Ctrl+V</div>
                                    </div>
                                    <button onClick={() => setIsPasteActive(false)} style={{ fontSize: '0.6rem', color: T.textFaint, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>cancel</button>
                                </>
                            ) : (
                                <>
                                    {allItems.length === 0 && <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.raisedBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textFaint }}><CameraIcon size={13} /></div>}
                                    <div style={{ display: 'flex', gap: '0.3rem', width: '100%' }}>
                                        <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '0.4rem 0.3rem', background: T.raisedBg, border: `1px solid ${T.borderStrong}`, borderRadius: '3px', color: T.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: '600' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textSecondary; }}>
                                            <CameraIcon size={11} /> ATTACH
                                        </button>
                                        <button onClick={() => setIsPasteActive(true)} style={{ flex: 1, padding: '0.4rem 0.3rem', background: T.raisedBg, border: `1px dashed ${T.borderStrong}`, borderRadius: '3px', color: T.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: '600' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderStrong; e.currentTarget.style.color = T.textSecondary; }}>
                                            <ClipboardIcon size={11} /> PASTE
                                        </button>
                                    </div>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={handleScreenshotFile} />
                        </div>
                    )}
                    {atMax && <div style={{ padding: '0.35rem', textAlign: 'center', color: T.textFaint, fontSize: '0.65rem', fontWeight: '600', letterSpacing: '0.05em' }}>10 / 10 MAX REACHED</div>}
                </div>
            </div>
        );
}
