document.getElementById('mobile-menu-button').addEventListener('click', function() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
});

// Language selector
(function() {
    var root = '/sofiehermind.dk';
    var p = window.location.pathname;
    if (root && p.indexOf(root) === 0) p = p.substring(root.length);
    if (p.endsWith('/')) p += 'index.html';
    var m = p.match(/^\/(en|de)\/(.*)/);
    var lang = m ? m[1] : 'da';
    var page = m ? m[2] : p.substring(1);
    if (!page) page = 'index.html';
    document.querySelectorAll('[data-lang]').forEach(function(a) {
        var l = a.dataset.lang;
        a.href = root + '/' + (l === 'da' ? page : l + '/' + page);
        if (l === lang) { a.classList.add('font-bold', 'text-burgundy'); a.classList.remove('text-slate-light'); }
    });
})();

// Active menu
(function() {
    var p = window.location.pathname;
    if (p.endsWith('/')) p = p + 'index.html';
    document.querySelectorAll('nav a[href]').forEach(function(a) {
        var h = a.getAttribute('href');
        if (!h || h.startsWith('#') || h.startsWith('http') || h.startsWith('mailto') || a.hasAttribute('data-lang')) return;
        if (h.endsWith('/')) h = h + 'index.html';
        if (h === p) {
            if (!a.classList.contains('bg-burgundy')) {
                a.classList.remove('text-slate');
                a.classList.add('text-burgundy', 'font-semibold');
            }
        }
    });
})();
