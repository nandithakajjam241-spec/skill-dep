// ═══════════════════════════════════════════════════════════
// VERIFICATION PAGE (PUBLIC)
// ═══════════════════════════════════════════════════════════

function renderVerifyPage() {
    const code = window._pageData || '';

    // Auto-fetch if code is in URL
    if (code) {
        setTimeout(() => verifyCert(code), 100);
    }

    return `
    <div class="auth-container">
        <div class="auth-card animate-in">
            <div class="auth-header">
                <h1 class="auth-title">Verify Certificate</h1>
                <p class="auth-subtitle">Enter certificate code to validate authenticity</p>
            </div>
            <div class="form-group">
                <label class="form-label">Certificate ID</label>
                <input type="text" id="verify-code" class="form-input" placeholder="e.g. CERT-ABC-123" value="${code}">
            </div>
            <button class="btn btn-primary w-100" onclick="verifyCert()">Verify Now</button>
            
            <div id="verify-result" class="mt-20"></div>
            
            <div style="margin-top:20px; text-align:center">
                <a href="#" onclick="navigate('home')" style="color:var(--primary); font-size:.9rem">← Back to Home</a>
            </div>
        </div>
    </div>`;
}

async function verifyCert(inputCode) {
    const code = inputCode || document.getElementById('verify-code').value;
    if (!code) return toast('Please enter a code', 'warning');

    const resDiv = document.getElementById('verify-result');
    resDiv.innerHTML = '<div class="loader">Verifying...</div>';

    try {
        const data = await api('/verify/' + code);
        resDiv.innerHTML = `
        <div class="verify-success-card animate-in">
            <div class="verify-banner">
                <div class="seal">🏆</div>
                <h3>Certificate Verified</h3>
                <p>Authentic Achievement</p>
            </div>
            <div class="verify-details">
                <div style="text-align:center; margin-bottom: 24px;">
                    <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">Student Name</span>
                    <h2 style="font-size: 2rem; color: var(--primary); margin-top: 4px;">${data.student_name}</h2>
                </div>
                
                <div class="detail-row">
                    <span>Course Title</span>
                    <strong>${data.course_title}</strong>
                </div>
                <div class="detail-row">
                    <span>Skill Level</span>
                    <strong>${data.skill_name} (${data.skill_level})</strong>
                </div>
                <div class="detail-row">
                    <span>Certificate ID</span>
                    <strong>${data.certificate_code}</strong>
                </div>
                <div class="detail-row">
                    <span>Issue Date</span>
                    <strong>${new Date(data.issued_at).toLocaleDateString()}</strong>
                </div>
                <div class="detail-row">
                    <span>Valid Until</span>
                    <strong>${new Date(data.expiry_at).toLocaleDateString()}</strong>
                </div>
                
                <div style="margin-top: 24px; padding: 16px; background: var(--bg-surface); border-radius: var(--radius-sm); border-left: 4px solid var(--success);">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;"> This document is an official digital record. Validation confirmed against secure repository. </p>
                </div>
            </div>
        </div>`;
    } catch (err) {
        resDiv.innerHTML = `
        <div class="card" style="background:rgba(255,255,255,0.05); border:1px solid var(--danger); text-align:center">
            <div style="font-size:2rem">❌</div>
            <h3 style="color:var(--danger)">Invalid Code</h3>
            <p style="font-size:.85rem; color:var(--text-muted)">The certificate code provided does not exist or has been revoked.</p>
        </div>`;
    }
}
