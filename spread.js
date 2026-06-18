document.addEventListener('DOMContentLoaded', () => {
    // Получаем все поля ввода
    const buyPrice = document.getElementById('buyPrice');
    const sellPrice = document.getElementById('sellPrice');
    const volume = document.getElementById('volume');
    const extraCosts = document.getElementById('extraCosts');
    const buyFee = document.getElementById('buyFee');
    const sellFee = document.getElementById('sellFee');
    const resetButton = document.getElementById('resetButton');
    const copyButton = document.getElementById('copyButton');

    const buyPriceGroup = document.getElementById('buyPriceGroup');
    const sellPriceGroup = document.getElementById('sellPriceGroup');

    // Поля результатов
    const netProfitSpan = document.getElementById('netProfit');
    const spreadSpan = document.getElementById('spread');
    const spreadPercentSpan = document.getElementById('spreadPercent');
    const totalCostSpan = document.getElementById('totalCost');
    const totalRevenueSpan = document.getElementById('totalRevenue');
    const statusBadge = document.getElementById('statusBadge');
    const breakEvenSpan = document.getElementById('breakEvenPrice');

    // История расчётов
    const saveHistoryButton = document.getElementById('saveHistoryButton');
    const historyList = document.getElementById('historyList');
    const HISTORY_KEY = 'convert_spread_history';
    const HISTORY_LIMIT = 5;

    // Функция форматирования больших чисел (экспоненциальный вид)
    function formatNumber(value) {
        if (value === 0) return '0.00';

        const absValue = Math.abs(value);

        // Для чисел больше 10 миллионов - экспоненциальный вид
        if (absValue >= 10_000_000) {
            return value.toExponential(2);
        }

        return value.toFixed(2);
    }

    // Функция расчёта
    function calculate() {
        // Получаем значения
        const buy = parseFloat(buyPrice.value) || 0;
        const sell = parseFloat(sellPrice.value) || 0;
        const vol = parseFloat(volume.value) || 0;
        const extra = parseFloat(extraCosts.value) || 0;
        const buyFeePercent = parseFloat(buyFee.value) || 0;
        const sellFeePercent = parseFloat(sellFee.value) || 0;

        // Расчёт затрат (вход)
        const buyTotal = buy * vol;
        const buyFeeAmount = buyTotal * (buyFeePercent / 100);
        const totalCost = buyTotal + buyFeeAmount + extra;

        // Расчёт дохода (выход)
        const sellTotal = sell * vol;
        const sellFeeAmount = sellTotal * (sellFeePercent / 100);
        const totalRevenue = sellTotal - sellFeeAmount;

        // Расчёт спреда и прибыли
        const spread = (sell - buy);
        const spreadPercentValue = buy !== 0 ? (spread / buy) * 100 : 0;
        const netProfit = totalRevenue - totalCost;

        // Обновляем UI с форматированием
        totalCostSpan.textContent = formatNumber(totalCost);
        totalRevenueSpan.textContent = formatNumber(totalRevenue);
        spreadSpan.textContent = spread.toFixed(4);
        spreadPercentSpan.textContent = spreadPercentValue.toFixed(2) + '%';
        netProfitSpan.textContent = formatNumber(netProfit);

        // Безубыточная цена продажи
        const sellFeeFraction = 1 - sellFeePercent / 100;
        if (vol > 0 && sellFeeFraction > 0) {
            const breakEven = totalCost / (vol * sellFeeFraction);
            breakEvenSpan.textContent = formatNumber(breakEven);
        } else {
            breakEvenSpan.textContent = '—';
        }

        // Обновляем статус сделки
        if (totalRevenue > totalCost) {
            statusBadge.textContent = 'Сделка в плюсе';
            statusBadge.className = 'status-badge positive';
        } else if (totalRevenue < totalCost) {
            statusBadge.textContent = 'Сделка в минусе';
            statusBadge.className = 'status-badge negative';
        } else {
            statusBadge.textContent = 'Сделка в нуле';
            statusBadge.className = 'status-badge neutral';
        }

        // Подсветка полей с ошибкой при убыточной сделке
        const isNegative = netProfit < 0;
        buyPriceGroup.classList.toggle('input-error', isNegative);
        sellPriceGroup.classList.toggle('input-error', isNegative);

        // Цвет карточки чистой прибыли
        const netProfitCard = document.getElementById('netProfitCard');
        if (netProfitCard) {
            netProfitCard.classList.toggle('result-card--positive', netProfit > 0);
            netProfitCard.classList.toggle('result-card--negative', netProfit < 0);
        }

        return { buy, sell, vol, extra, buyFeePercent, sellFeePercent, totalCost, totalRevenue, spread, spreadPercentValue, netProfit };
    }

    // Функция сброса всех полей
    function resetAll() {
        buyPrice.value = '0';
        sellPrice.value = '0';
        volume.value = '0';
        extraCosts.value = '0';
        buyFee.value = '0';
        sellFee.value = '0';
        calculate();
    }

    // Копирование результата
    function copyResult() {
        const result = calculate();
        const text =
`coNVErt — Калькулятор спреда
Цена покупки: ${result.buy}
Цена продажи: ${result.sell}
Объём: ${result.vol}
Спред: ${result.spread.toFixed(4)} (${result.spreadPercentValue.toFixed(2)}%)
Затраты: ${formatNumber(result.totalCost)}
Доход: ${formatNumber(result.totalRevenue)}
Чистая прибыль: ${formatNumber(result.netProfit)}
Безубыточная цена продажи: ${breakEvenSpan.textContent}`;

        navigator.clipboard.writeText(text).then(() => {
            copyButton.textContent = 'Скопировано!';
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.textContent = 'Скопировать результат';
                copyButton.classList.remove('copied');
            }, 1500);
        });
    }

    // ===== История расчётов =====
    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveHistory(history) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    function renderHistory() {
        const history = loadHistory();
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">Пока нет сохранённых расчётов</div>';
            return;
        }

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';

            const profitClass = item.netProfit > 0 ? 'positive' : (item.netProfit < 0 ? 'negative' : '');

            el.innerHTML = `
                <div class="history-item-info">
                    Покупка: ${item.buy} / Продажа: ${item.sell} / Объём: ${item.vol}<br>
                    Прибыль: <span class="history-item-profit ${profitClass}">${formatNumber(item.netProfit)}</span>
                    &nbsp;(${item.spreadPercentValue.toFixed(2)}%)
                </div>
                <button class="history-item-remove" title="Удалить">✕</button>
            `;

            el.querySelector('.history-item-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeHistoryItem(item.id);
            });

            el.addEventListener('click', () => restoreHistoryItem(item));

            historyList.appendChild(el);
        });
    }

    function removeHistoryItem(id) {
        const history = loadHistory().filter(item => item.id !== id);
        saveHistory(history);
        renderHistory();
    }

    function restoreHistoryItem(item) {
        buyPrice.value = item.buy;
        sellPrice.value = item.sell;
        volume.value = item.vol;
        extraCosts.value = item.extra;
        buyFee.value = item.buyFeePercent;
        sellFee.value = item.sellFeePercent;
        calculate();
    }

    function saveCurrentToHistory() {
        const result = calculate();
        const history = loadHistory();

        history.unshift({
            id: `${result.buy}-${result.sell}-${result.vol}-${history.length}-${Math.random().toString(36).slice(2, 8)}`,
            buy: result.buy,
            sell: result.sell,
            vol: result.vol,
            extra: result.extra,
            buyFeePercent: result.buyFeePercent,
            sellFeePercent: result.sellFeePercent,
            netProfit: result.netProfit,
            spreadPercentValue: result.spreadPercentValue
        });

        while (history.length > HISTORY_LIMIT) {
            history.pop();
        }

        saveHistory(history);
        renderHistory();
    }

    // Вешаем обработчики на все поля
    const inputs = [buyPrice, sellPrice, volume, extraCosts, buyFee, sellFee];
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
    });

    // Кнопка сброса
    resetButton.addEventListener('click', resetAll);

    // Кнопка копирования
    copyButton.addEventListener('click', copyResult);

    // Кнопка сохранения в историю
    saveHistoryButton.addEventListener('click', saveCurrentToHistory);

    // Первый расчёт
    calculate();
    renderHistory();

    // ===== Переключатель вкладок =====
    const pageTabs = document.querySelectorAll('.page-tab');
    const tabPanels = {
        spreadTab: document.getElementById('spreadTab'),
        targetTab: document.getElementById('targetTab')
    };

    pageTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            pageTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            Object.keys(tabPanels).forEach(key => {
                tabPanels[key].style.display = (key === tab.dataset.tab) ? '' : 'none';
            });
        });
    });

    // ===== Вкладка "Целевая прибыль" =====
    const targetSolveFor = document.getElementById('targetSolveFor');
    const targetProfit = document.getElementById('targetProfit');
    const targetBuyPrice = document.getElementById('targetBuyPrice');
    const targetSellPrice = document.getElementById('targetSellPrice');
    const targetVolume = document.getElementById('targetVolume');
    const targetExtraCosts = document.getElementById('targetExtraCosts');
    const targetBuyFee = document.getElementById('targetBuyFee');
    const targetSellFee = document.getElementById('targetSellFee');
    const targetSellPriceGroup = document.getElementById('targetSellPriceGroup');
    const targetVolumeGroup = document.getElementById('targetVolumeGroup');
    const targetResultLabel = document.getElementById('targetResultLabel');
    const targetResult = document.getElementById('targetResult');
    const targetTotalCostSpan = document.getElementById('targetTotalCost');
    const targetTotalRevenueSpan = document.getElementById('targetTotalRevenue');
    const targetResetButton = document.getElementById('targetResetButton');

    function calculateTarget() {
        const profit = parseFloat(targetProfit.value) || 0;
        const buy = parseFloat(targetBuyPrice.value) || 0;
        const extra = parseFloat(targetExtraCosts.value) || 0;
        const buyFeePercent = parseFloat(targetBuyFee.value) || 0;
        const sellFeePercent = parseFloat(targetSellFee.value) || 0;
        const sellFeeFraction = 1 - sellFeePercent / 100;
        const buyFeeFraction = 1 + buyFeePercent / 100;

        if (targetSolveFor.value === 'volume') {
            const sell = parseFloat(targetSellPrice.value) || 0;
            const denom = sell * sellFeeFraction - buy * buyFeeFraction;

            if (denom <= 0) {
                targetResult.textContent = 'Невозможно при таких ценах';
                targetTotalCostSpan.textContent = '—';
                targetTotalRevenueSpan.textContent = '—';
                return;
            }

            const vol = (profit + extra) / denom;

            if (vol < 0) {
                targetResult.textContent = 'Невозможно при таких ценах';
                targetTotalCostSpan.textContent = '—';
                targetTotalRevenueSpan.textContent = '—';
                return;
            }

            const totalCost = buy * vol * buyFeeFraction + extra;
            const totalRevenue = sell * vol * sellFeeFraction;

            targetResult.textContent = formatNumber(vol);
            targetTotalCostSpan.textContent = formatNumber(totalCost);
            targetTotalRevenueSpan.textContent = formatNumber(totalRevenue);
        } else {
            const vol = parseFloat(targetVolume.value) || 0;

            if (vol <= 0 || sellFeeFraction <= 0) {
                targetResult.textContent = '—';
                targetTotalCostSpan.textContent = '—';
                targetTotalRevenueSpan.textContent = '—';
                return;
            }

            const totalCost = buy * vol * buyFeeFraction + extra;
            const sell = (profit + totalCost) / (vol * sellFeeFraction);
            const totalRevenue = sell * vol * sellFeeFraction;

            targetResult.textContent = formatNumber(sell);
            targetTotalCostSpan.textContent = formatNumber(totalCost);
            targetTotalRevenueSpan.textContent = formatNumber(totalRevenue);
        }
    }

    function updateTargetMode() {
        if (targetSolveFor.value === 'volume') {
            targetSellPriceGroup.style.display = '';
            targetVolumeGroup.style.display = 'none';
            targetResultLabel.textContent = 'Необходимый объём';
        } else {
            targetSellPriceGroup.style.display = 'none';
            targetVolumeGroup.style.display = '';
            targetResultLabel.textContent = 'Необходимая цена продажи';
        }
        calculateTarget();
    }

    function resetTarget() {
        targetProfit.value = '0';
        targetBuyPrice.value = '0';
        targetSellPrice.value = '0';
        targetVolume.value = '0';
        targetExtraCosts.value = '0';
        targetBuyFee.value = '0';
        targetSellFee.value = '0';
        calculateTarget();
    }

    const targetInputs = [targetProfit, targetBuyPrice, targetSellPrice, targetVolume, targetExtraCosts, targetBuyFee, targetSellFee];
    targetInputs.forEach(input => {
        input.addEventListener('input', calculateTarget);
    });

    targetSolveFor.addEventListener('change', updateTargetMode);
    targetResetButton.addEventListener('click', resetTarget);

    updateTargetMode();
});
