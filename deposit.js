document.addEventListener('DOMContentLoaded', () => {
    // Данные
    let deposits = [];
    let nextId = 1;
    let currentIndex = 0;
    let totalPages = 1;
    let isSummaryMode = false;
    
    // DOM элементы
    const swipeWrapper = document.getElementById('swipeWrapper');
    const tabsContainer = document.getElementById('tabsContainer');
    const addBtn = document.getElementById('addDepositBtn');
    const clearBtn = document.getElementById('clearDepositBtn');
    const resetAllBtn = document.getElementById('resetAllBtn');
    const summaryBtn = document.getElementById('summaryBtn');
    const pageIndicator = document.getElementById('pageIndicator');
    
    // Форматирование чисел
    function formatNumber(value) {
        if (value === 0) return '0.00';
        const absValue = Math.abs(value);
        if (absValue >= 10_000_000) {
            return value.toExponential(2);
        }
        return value.toFixed(2);
    }
    
    // Расчёт вклада
    function calculateDeposit(deposit) {
        let amount = parseFloat(deposit.amount) || 0;
        let term = parseFloat(deposit.term) || 0;
        let rate = parseFloat(deposit.rate) || 0;
        let termUnit = deposit.termUnit;
        
        let years = termUnit === 'month' ? term / 12 : term;
        let finalAmount = amount * Math.pow(1 + rate / 100, years);
        let income = finalAmount - amount;
        
        deposit.finalAmount = finalAmount;
        deposit.income = income;
        return { finalAmount, income };
    }
    
    // Обновление блока
    function updateDepositBlock(block, deposit) {
        const { finalAmount, income } = calculateDeposit(deposit);
        
        const finalSpan = block.querySelector('.final-amount');
        const incomeSpan = block.querySelector('.income-amount');
        
        if (finalSpan) finalSpan.textContent = formatNumber(finalAmount);
        if (incomeSpan) incomeSpan.textContent = formatNumber(income);
    }
    
    // Создание блока вклада
    function createDepositBlock(deposit) {
        const block = document.createElement('div');
        block.className = 'deposit-block';
        block.setAttribute('data-id', deposit.id);
        
        block.innerHTML = `
            <div class="deposit-form">
                <div class="form-field">
                    <label>Сумма вклада</label>
                    <input type="number" class="deposit-amount" value="${deposit.amount}" step="1000" placeholder="0">
                </div>
                <div class="form-field">
                    <label>Срок вклада</label>
                    <div class="term-group">
                        <input type="number" class="deposit-term" value="${deposit.term}" step="1" placeholder="0">
                        <select class="deposit-term-unit">
                            <option value="month" ${deposit.termUnit === 'month' ? 'selected' : ''}>Месяц</option>
                            <option value="year" ${deposit.termUnit === 'year' ? 'selected' : ''}>Год</option>
                        </select>
                    </div>
                </div>
                <div class="form-field">
                    <label>Процентная ставка, % годовых</label>
                    <input type="number" class="deposit-rate" value="${deposit.rate}" step="0.1" placeholder="0">
                </div>
                <div class="form-field">
                    <label>Дата открытия</label>
                    <input type="date" class="deposit-date" value="${deposit.date}">
                </div>
            </div>
            <div class="block-results">
                <div class="result-item">
                    <div class="label">Сумма в конце срока</div>
                    <div class="value final-amount">${formatNumber(deposit.finalAmount)}</div>
                </div>
                <div class="result-item">
                    <div class="label">Доход</div>
                    <div class="value income-amount">${formatNumber(deposit.income)}</div>
                </div>
            </div>
        `;
        
        // Обработчики
        const amountInput = block.querySelector('.deposit-amount');
        const termInput = block.querySelector('.deposit-term');
        const termUnitSelect = block.querySelector('.deposit-term-unit');
        const rateInput = block.querySelector('.deposit-rate');
        
        const updateHandler = () => {
            deposit.amount = amountInput.value;
            deposit.term = termInput.value;
            deposit.termUnit = termUnitSelect.value;
            deposit.rate = rateInput.value;
            updateDepositBlock(block, deposit);
            if (isSummaryMode) refreshSummary();
        };
        
        amountInput.addEventListener('input', updateHandler);
        termInput.addEventListener('input', updateHandler);
        termUnitSelect.addEventListener('change', updateHandler);
        rateInput.addEventListener('input', updateHandler);
        
        return block;
    }
    
    // Обновление итогового блока
    function refreshSummary() {
        const summaryBlock = document.querySelector('.summary-block');
        if (!summaryBlock) return;
        
        let totalFinal = 0;
        let totalIncome = 0;
        
        deposits.forEach(deposit => {
            const { finalAmount, income } = calculateDeposit(deposit);
            totalFinal += finalAmount;
            totalIncome += income;
        });
        
        const totalSumSpan = summaryBlock.querySelector('#totalSum');
        const totalIncomeSpan = summaryBlock.querySelector('#totalIncome');
        
        if (totalSumSpan) totalSumSpan.textContent = formatNumber(totalFinal);
        if (totalIncomeSpan) totalIncomeSpan.textContent = formatNumber(totalIncome);
    }
    
    // Переключение страницы
    function goToPage(index, animate = true) {
        if (index < 0) index = 0;
        if (index >= totalPages) index = totalPages - 1;
        
        currentIndex = index;
        const offset = -currentIndex * 100;
        
        if (animate) {
            swipeWrapper.style.transition = 'transform 0.3s ease-out';
        } else {
            swipeWrapper.style.transition = 'none';
        }
        
        swipeWrapper.style.transform = `translateX(${offset}%)`;
        
        setTimeout(() => {
            swipeWrapper.style.transition = 'transform 0.3s ease-out';
        }, 50);
        
        updateIndicator();
        updateTabs();
    }
    
    // Индикатор
    function updateIndicator() {
        pageIndicator.innerHTML = '';
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('div');
            dot.className = `dot ${i === currentIndex ? 'active' : ''}`;
            dot.addEventListener('click', () => goToPage(i));
            pageIndicator.appendChild(dot);
        }
    }
    
    // Табы
    function updateTabs() {
        tabsContainer.innerHTML = '';
        
        if (isSummaryMode) {
            const backTab = document.createElement('div');
            backTab.className = 'deposit-tab';
            backTab.textContent = '← К вкладам';
            backTab.addEventListener('click', exitSummary);
            tabsContainer.appendChild(backTab);
            return;
        }
        
        deposits.forEach((deposit, idx) => {
            const tab = document.createElement('div');
            tab.className = `deposit-tab ${idx === currentIndex ? 'active' : ''}`;
            tab.textContent = `Вклад №${deposit.number}`;
            tab.dataset.index = idx;
            tab.addEventListener('click', () => {
                if (tab.dataset.suppressClick === 'true') {
                    tab.dataset.suppressClick = '';
                    return;
                }
                goToPage(idx);
            });
            tab.addEventListener('pointerdown', (e) => startTabDrag(e, tab, idx));
            tabsContainer.appendChild(tab);
        });
    }

    // Перетаскивание табов для смены порядка вкладов
    const LONG_PRESS_MS = 350;
    const MOVE_CANCEL_THRESHOLD = 10;

    function startTabDrag(e, tab, idx) {
        if (e.button !== undefined && e.button !== 0) return;

        const startX = e.clientX;
        const startY = e.clientY;
        let dragging = false;

        const longPressTimer = setTimeout(() => {
            dragging = true;
            tab.classList.add('dragging');
            tab.style.touchAction = 'none';
            tab.dataset.suppressClick = 'true';
        }, LONG_PRESS_MS);

        const onMove = (moveEvent) => {
            if (!dragging) {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                if (Math.abs(dx) > MOVE_CANCEL_THRESHOLD || Math.abs(dy) > MOVE_CANCEL_THRESHOLD) {
                    clearTimeout(longPressTimer);
                }
                return;
            }

            moveEvent.preventDefault();
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            tab.style.transform = `translate(${dx}px, ${dy}px)`;

            tabsContainer.querySelectorAll('.deposit-tab').forEach(el => {
                if (el === tab) return;
                const rect = el.getBoundingClientRect();
                const inside = moveEvent.clientX >= rect.left && moveEvent.clientX <= rect.right &&
                                moveEvent.clientY >= rect.top && moveEvent.clientY <= rect.bottom;
                el.classList.toggle('drop-target', inside);
            });
        };

        const onUp = () => {
            clearTimeout(longPressTimer);
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);

            if (!dragging) return;

            tab.classList.remove('dragging');
            tab.style.transform = '';
            tab.style.touchAction = '';

            const target = tabsContainer.querySelector('.drop-target');
            if (target) {
                target.classList.remove('drop-target');
                const targetIdx = parseInt(target.dataset.index, 10);
                swapDeposits(idx, targetIdx);
            }
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }

    // Смена мест двух вкладов
    function swapDeposits(i, j) {
        if (i === j) return;

        [deposits[i], deposits[j]] = [deposits[j], deposits[i]];
        deposits.forEach((deposit, idx) => {
            deposit.number = idx + 1;
        });

        if (currentIndex === i) currentIndex = j;
        else if (currentIndex === j) currentIndex = i;

        renderAll();
        goToPage(currentIndex, false);
    }
    
    // Выход из режима итога
    function exitSummary() {
        isSummaryMode = false;
        renderAll();
        updateButtonsVisibility();
    }
    
    // Рендер всех страниц
    function renderAll() {
        swipeWrapper.innerHTML = '';
        
        if (!isSummaryMode) {
            deposits.forEach(deposit => {
                swipeWrapper.appendChild(createDepositBlock(deposit));
            });
            totalPages = deposits.length;
            
            if (totalPages === 0) {
                const emptyBlock = document.createElement('div');
                emptyBlock.className = 'deposit-block';
                emptyBlock.style.display = 'flex';
                emptyBlock.style.alignItems = 'center';
                emptyBlock.style.justifyContent = 'center';
                emptyBlock.innerHTML = '<p style="color: white;">Нажмите "+ Добавить вклад"</p>';
                swipeWrapper.appendChild(emptyBlock);
                totalPages = 1;
            }
            
            if (currentIndex >= totalPages) currentIndex = totalPages - 1;
            if (currentIndex < 0) currentIndex = 0;
        }
        
        goToPage(currentIndex, false);
        updateTabs();
        updateButtonsVisibility();
    }
    
    // Обновление видимости кнопок
    function updateButtonsVisibility() {
        if (deposits.length >= 5) {
            addBtn.style.display = 'none';
        } else {
            addBtn.style.display = 'inline-block';
        }
        
        // Кнопка удаления
        if (clearBtn) {
            clearBtn.style.display = (deposits.length > 0 && !isSummaryMode) ? 'inline-block' : 'none';
            clearBtn.textContent = 'Удалить';
        }
    }
    
    // Добавление вклада
    function addDeposit() {
        if (deposits.length >= 5) return;
        if (isSummaryMode) exitSummary();
        
        const newNumber = deposits.length + 1;
        const newDeposit = {
            id: nextId++,
            number: newNumber,
            amount: '10000',
            term: '12',
            termUnit: 'month',
            rate: '10',
            date: new Date().toISOString().split('T')[0],
            finalAmount: 0,
            income: 0
        };
        
        calculateDeposit(newDeposit);
        deposits.push(newDeposit);
        
        renderAll();
        goToPage(deposits.length - 1);
        updateButtonsVisibility();
    }
    
    // Удаление текущего вклада
    function clearCurrentDeposit() {
        if (deposits.length === 0 || isSummaryMode) return;
        
        // Не даём удалить последний вклад
        if (deposits.length === 1) {
            alert('Нельзя удалить единственный вклад');
            return;
        }
        
        // Удаляем текущий вклад
        deposits.splice(currentIndex, 1);
        
        // Перенумеровываем оставшиеся вклады
        deposits.forEach((deposit, idx) => {
            deposit.number = idx + 1;
        });
        
        // Корректируем currentIndex
        if (currentIndex >= deposits.length) {
            currentIndex = deposits.length - 1;
        }
        
        // Перерендериваем
        renderAll();
        goToPage(currentIndex);
        updateButtonsVisibility();
        
        // Если были в режиме итога - выходим
        if (isSummaryMode) {
            isSummaryMode = false;
            renderAll();
        }
    }
    
    // Сброс всего (удаление всех вкладов)
    function resetAll() {
        if (confirm('Удалить все вклады?')) {
            deposits = [];
            nextId = 1;
            currentIndex = 0;
            isSummaryMode = false;
            
            // Создаём первый вклад по умолчанию
            const firstDeposit = {
                id: nextId++,
                number: 1,
                amount: '10000',
                term: '12',
                termUnit: 'month',
                rate: '10',
                date: new Date().toISOString().split('T')[0],
                finalAmount: 0,
                income: 0
            };
            calculateDeposit(firstDeposit);
            deposits.push(firstDeposit);
            
            renderAll();
            updateButtonsVisibility();
        }
    }
    
    // Показать итог
    function showSummary() {
        if (deposits.length === 0) return;
        
        isSummaryMode = true;
        swipeWrapper.innerHTML = '';
        
        // Блоки вкладов
        deposits.forEach(deposit => {
            swipeWrapper.appendChild(createDepositBlock(deposit));
        });
        
        // Блок итогов
        let totalFinal = 0;
        let totalIncome = 0;
        deposits.forEach(deposit => {
            const { finalAmount, income } = calculateDeposit(deposit);
            totalFinal += finalAmount;
            totalIncome += income;
        });
        
        const summaryBlock = document.createElement('div');
        summaryBlock.className = 'summary-block';
        summaryBlock.innerHTML = `
            <h3>Итог по всем вкладам</h3>
            <div class="summary-row">
                <div class="summary-card">
                    <div class="summary-label">Итоговая сумма</div>
                    <div class="summary-value" id="totalSum">${formatNumber(totalFinal)}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">Общий доход</div>
                    <div class="summary-value" id="totalIncome">${formatNumber(totalIncome)}</div>
                </div>
            </div>
        `;
        swipeWrapper.appendChild(summaryBlock);
        
        totalPages = deposits.length + 1;
        currentIndex = deposits.length;
        
        goToPage(currentIndex);
        updateTabs();
        updateButtonsVisibility();
    }
    
    // Свайпы
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeContainer = document.getElementById('swipeContainer');
    
    swipeContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    swipeContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        const threshold = 50;
        
        if (Math.abs(diff) < threshold) return;
        
        if (diff > 0 && currentIndex > 0) {
            goToPage(currentIndex - 1);
        } else if (diff < 0 && currentIndex < totalPages - 1) {
            goToPage(currentIndex + 1);
        }
    });
    
    // Инициализация
    function init() {
        const firstDeposit = {
            id: nextId++,
            number: 1,
            amount: '10000',
            term: '12',
            termUnit: 'month',
            rate: '10',
            date: new Date().toISOString().split('T')[0],
            finalAmount: 0,
            income: 0
        };
        
        calculateDeposit(firstDeposit);
        deposits.push(firstDeposit);
        
        renderAll();
        
        addBtn.addEventListener('click', addDeposit);
        clearBtn.addEventListener('click', clearCurrentDeposit);
        resetAllBtn.addEventListener('click', resetAll);
        summaryBtn.addEventListener('click', showSummary);
    }
    
    init();
});