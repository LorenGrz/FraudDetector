(function () {
    const style = document.createElement('style');
    style.textContent = `
        .mobile-topbar {
            display: none;
            position: fixed; top: 0; left: 0; right: 0; z-index: 200;
            background: #0f172a; height: 52px; padding: 0 1rem;
            align-items: center; justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .mob-brand {
            color: #fff; font-size: 0.9rem; font-weight: 700;
            display: flex; align-items: center; gap: 0.5rem;
        }
        .mob-logo {
            width: 28px; height: 28px; background: #ef4444; border-radius: 6px;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .mob-hamburger {
            background: none; border: none; color: rgba(255,255,255,0.7);
            font-size: 1.3rem; padding: 0.25rem 0.4rem; cursor: pointer;
            line-height: 1; border-radius: 6px;
        }
        .mob-hamburger:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .sb-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.45);
            z-index: 149; display: none;
        }
        .sb-overlay.active { display: block; }
        @media (max-width: 768px) {
            .mobile-topbar { display: flex; }
            .sidebar {
                display: flex !important;
                transform: translateX(-100%);
                transition: transform 0.22s ease;
                z-index: 150 !important;
            }
            .sidebar.sb-open { transform: translateX(0); }
            .main {
                margin-left: 0 !important;
                padding-top: calc(52px + 1rem) !important;
            }
        }
    `;
    document.head.appendChild(style);

    const topbar = document.createElement('div');
    topbar.className = 'mobile-topbar';
    topbar.innerHTML =
        '<div class="mob-brand">' +
            '<div class="mob-logo"><i class="bi bi-shield-fill-check text-white" style="font-size:0.72rem;"></i></div>' +
            '<span>Fraud Detector</span>' +
        '</div>' +
        '<button class="mob-hamburger" id="sb-toggle" aria-label="Menú"><i class="bi bi-list"></i></button>';

    const overlay = document.createElement('div');
    overlay.className = 'sb-overlay';

    document.body.prepend(overlay);
    document.body.prepend(topbar);

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    function openSidebar() {
        sidebar.classList.add('sb-open');
        overlay.classList.add('active');
        document.getElementById('sb-toggle').innerHTML = '<i class="bi bi-x-lg"></i>';
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('sb-open');
        overlay.classList.remove('active');
        document.getElementById('sb-toggle').innerHTML = '<i class="bi bi-list"></i>';
        document.body.style.overflow = '';
    }

    document.getElementById('sb-toggle').addEventListener('click', function () {
        sidebar.classList.contains('sb-open') ? closeSidebar() : openSidebar();
    });

    overlay.addEventListener('click', closeSidebar);

    sidebar.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () { setTimeout(closeSidebar, 60); });
    });
})();
