// Screenshot lightbox gallery — moved out of App.jsx.

import React from 'react';

export default function Lightbox(props) {
    const {
        lightboxData, setLightboxData,
    } = props;

    if (!lightboxData) return null;
        const { srcs, index } = lightboxData;
        const total = srcs.length;
        const goPrev = (e) => { e.stopPropagation(); setLightboxData(d => ({ ...d, index: (d.index - 1 + total) % total })); };
        const goNext = (e) => { e.stopPropagation(); setLightboxData(d => ({ ...d, index: (d.index + 1) % total })); };
        return (
            <div onClick={() => setLightboxData(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
                    <img src={srcs[index]} alt={`Screenshot ${index + 1}`} style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'block' }} />
                    {total > 1 && (
                        <>
                            <button onClick={goPrev} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.35'} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', zIndex: 1, lineHeight: 1, opacity: '0.35', transition: 'opacity 0.15s' }}>&#x2039;</button>
                            <button onClick={goNext} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.35'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', zIndex: 1, lineHeight: 1, opacity: '0.35', transition: 'opacity 0.15s' }}>&#x203a;</button>
                            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', borderRadius: '10px', padding: '0.15rem 0.6rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{index + 1} / {total}</div>
                        </>
                    )}
                    <button onClick={() => setLightboxData(null)} style={{ position: 'absolute', top: -14, right: -14, width: 28, height: 28, borderRadius: '50%', background: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>&#x2715;</button>
                </div>
            </div>
        );
}
