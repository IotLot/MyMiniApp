document.addEventListener('DOMContentLoaded', () => {
    // Получаем все поля ввода
    const buyPrice = document.getElementById('buyPrice');
    const sellPrice = document.getElementById('sellPrice');
    const volume = document.getElementById('volume');
    const extraCosts = document.getElementById('extraCosts');
    const buyFee = document.getElementById('buyFee');
    const sellFee = document.getElementById('sellFee');
    const resetButton = document.getElementById('resetButton');
    
    // Поля результатов
    const netProfitSpan = document.getElementById('netProfit');
    const spreadSpan = document.getElementById('spread');
    const spreadPercentSpan = document.getElementById('spreadPercent');
    const totalCostSpan = document.getElementById('totalCost');
    const totalRevenueSpan = document.getElementById('totalRevenue');
    const statusBadge = document.getElementById('statusBadge');
    
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

// Вешаем обработчики на все поля
const inputs = [buyPrice, sellPrice, volume, extraCosts, buyFee, sellFee];
inputs.forEach(input => {
    input.addEventListener('input', calculate);
});

// Кнопка сброса
resetButton.addEventListener('click', resetAll);

// Первый расчёт
calculate();
});