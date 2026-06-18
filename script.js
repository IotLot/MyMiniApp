document.addEventListener('DOMContentLoaded', () => {

    // ===== Меню =====
    const menuButton = document.getElementById('menuButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobile) {
        menuButton.addEventListener('mouseenter', () => dropdownMenu.classList.add('show'));
        dropdownMenu.addEventListener('mouseleave', () => dropdownMenu.classList.remove('show'));
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    } else {
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!menuButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // ===== Матричный фон =====
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const chars = '₿$€£¥₽₴฿ΞΛ0123456789↑↓+-.%×=';
    const charArray = chars.split('');
    const fontSize = 13;
    let drops = [];

    function resizeCanvas() {
        const section = canvas.parentElement;
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
        const columns = Math.floor(canvas.width / fontSize);
        drops = Array.from({ length: columns }, () => Math.random() * -50);
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(33, 34, 36, 0.07)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < drops.length; i++) {
            const char = charArray[Math.floor(Math.random() * charArray.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            // Яркая "голова" потока, тускнеющий след
            const isHead = y > canvas.height - fontSize * 3;
            if (isHead) {
                ctx.fillStyle = '#ffffff';
            } else {
                const opacity = Math.random() * 0.45 + 0.08;
                // Чередуем между синим и мятным для разнообразия
                const color = Math.random() > 0.5 ? `rgba(78, 205, 196, ${opacity})` : `rgba(91, 141, 239, ${opacity})`;
                ctx.fillStyle = color;
            }

            ctx.font = `${fontSize}px 'Courier New', monospace`;
            ctx.fillText(char, x, y);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i] += 0.5;
        }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setInterval(drawMatrix, 40);

    // ===== Тикер котировок =====
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack) return;

    const tickerData = [
        { pair: 'BTC/USD',  value: 103842, decimals: 0, change: +1.24 },
        { pair: 'ETH/USD',  value: 3867,   decimals: 1, change: +0.87 },
        { pair: 'TON/USD',  value: 5.83,   decimals: 2, change: -0.34 },
        { pair: 'SOL/USD',  value: 182.40, decimals: 2, change: +2.11 },
        { pair: 'XMR/USD',  value: 312.55, decimals: 2, change: +0.56 },
        { pair: 'EUR/USD',  value: 1.0862, decimals: 4, change: -0.12 },
        { pair: 'GBP/USD',  value: 1.2741, decimals: 4, change: +0.08 },
        { pair: 'USD/RUB',  value: 87.54,  decimals: 2, change: +0.31 },
        { pair: 'USD/JPY',  value: 157.82, decimals: 2, change: -0.45 },
        { pair: 'USD/CNY',  value: 7.2431, decimals: 4, change: +0.02 },
    ];

    function formatTickerValue(val, decimals) {
        return val.toFixed(decimals);
    }

    function renderTicker() {
        const items = tickerData.map(item => {
            const sign = item.change >= 0 ? '▲' : '▼';
            const changeClass = item.change >= 0 ? 'up' : 'down';
            return `<span class="ticker-item">
                <span class="ticker-symbol">${item.pair}</span>
                <span class="ticker-value">${formatTickerValue(item.value, item.decimals)}</span>
                <span class="ticker-change ${changeClass}">${sign} ${Math.abs(item.change).toFixed(2)}%</span>
            </span>`;
        }).join('');

        // Дублируем для бесшовного цикла
        tickerTrack.innerHTML = items + items;
    }

    function fluctuateTicker() {
        tickerData.forEach(item => {
            const delta = item.value * (Math.random() * 0.002 - 0.001);
            item.value = Math.max(0, item.value + delta);
            item.change = parseFloat((item.change + (Math.random() * 0.1 - 0.05)).toFixed(2));
        });
        renderTicker();
    }

    renderTicker();
    setInterval(fluctuateTicker, 3000);
});
