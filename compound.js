document.addEventListener('DOMContentLoaded', () => {
    const principalInput     = document.getElementById('principal');
    const rateInput          = document.getElementById('rate');
    const termInput          = document.getElementById('term');
    const termUnitSelect     = document.getElementById('termUnit');
    const compoundFreqSelect = document.getElementById('compoundFreq');
    const contributionInput  = document.getElementById('contribution');
    const resetButton        = document.getElementById('resetButton');
    const copyButton         = document.getElementById('copyButton');

    const finalAmountEl   = document.getElementById('finalAmount');
    const totalInvestedEl = document.getElementById('totalInvested');
    const totalIncomeEl   = document.getElementById('totalIncome');
    const multiplierEl    = document.getElementById('multiplier');
    const totalYieldEl    = document.getElementById('totalYield');
    const growthTableBody = document.getElementById('growthTableBody');
    const finalAmountCard = document.getElementById('finalAmountCard');

    let currentMode = 'invest';

    function formatNumber(value) {
        if (value === 0) return '0.00';
        if (Math.abs(value) >= 10_000_000) return value.toExponential(2);
        return value.toFixed(2);
    }

    function getParams() {
        const P = parseFloat(principalInput.value) || 0;
        const r = (parseFloat(rateInput.value) || 0) / 100;
        const termVal = parseFloat(termInput.value) || 0;
        const n = parseInt(compoundFreqSelect.value);
        const C = parseFloat(contributionInput.value) || 0;
        const t = termUnitSelect.value === 'year' ? termVal : termVal / 12;
        const totalPeriods = Math.round(n * t);
        return { P, r, n, t, totalPeriods, C };
    }

    function buildSnapshots(totalPeriods, n) {
        const showByYear = totalPeriods > 24;
        const set = new Set();
        if (showByYear) {
            for (let y = 1; y * n <= totalPeriods; y++) set.add(y * n);
        } else {
            for (let i = 1; i <= totalPeriods; i++) set.add(i);
        }
        set.add(totalPeriods);
        return { set, showByYear };
    }

    const PERIOD_LABELS = { 365: 'День', 12: 'Месяц', 4: 'Квартал', 1: 'Год' };

    function makeLabel(i, n, showByYear) {
        if (showByYear) return `Год ${Math.round(i / n)}`;
        return `${PERIOD_LABELS[n] || 'Период'} ${i}`;
    }

    // ===== Режим: Вложение =====
    function runInvest({ P, r, n, totalPeriods, C }) {
        const rPer = r / n;
        const { set, showByYear } = buildSnapshots(totalPeriods, n);

        let balance = P;
        const rows = [];

        for (let i = 1; i <= totalPeriods; i++) {
            balance = balance * (1 + rPer) + C;
            if (set.has(i)) {
                const cumInvested = P + C * i;
                rows.push({
                    label:  makeLabel(i, n, showByYear),
                    col1:   balance,
                    col2:   cumInvested,
                    col3:   balance - cumInvested
                });
            }
        }

        const totalInvested = P + C * totalPeriods;
        const totalIncome   = balance - totalInvested;
        const mult          = P > 0 ? balance / P : 1;
        const yieldPct      = totalInvested > 0 ? (totalIncome / totalInvested) * 100 : 0;

        finalAmountEl.textContent   = formatNumber(balance);
        totalInvestedEl.textContent = formatNumber(totalInvested);
        totalIncomeEl.textContent   = formatNumber(totalIncome);
        multiplierEl.textContent    = `×${mult.toFixed(2)}`;
        totalYieldEl.textContent    = `${yieldPct.toFixed(2)}%`;

        setCardStyle('invest', false);
        renderTable(rows, false);
    }

    // ===== Режим: Долг =====
    function runDebt({ P, r, n, totalPeriods, C }) {
        const rPer = r / n;
        const { set, showByYear } = buildSnapshots(totalPeriods, n);

        let balance   = P;
        let paidOffAt = null;
        const rows    = [];

        for (let i = 1; i <= totalPeriods; i++) {
            // Сначала начисляем проценты, затем вычитаем выплату
            balance = balance * (1 + rPer) - C;

            const isPaidOff = C > 0 && balance <= 0;
            if (isPaidOff) {
                balance   = 0;
                paidOffAt = i;
            }

            if (set.has(i) || isPaidOff) {
                const cumPayments = C * i;
                // Суммарные проценты = остаток + выплачено - исходный долг
                const cumInterest = Math.max(0, balance + cumPayments - P);
                rows.push({
                    label:     makeLabel(i, n, showByYear),
                    col1:      balance,
                    col2:      cumPayments,
                    col3:      cumInterest,
                    isPaidOff
                });
            }

            if (isPaidOff) break;
        }

        const actualPeriods = paidOffAt || totalPeriods;
        const totalPaid     = C * actualPeriods;
        const totalInterest = Math.max(0, balance + totalPaid - P);
        const totalCost     = totalPaid + balance;
        const mult          = P > 0 ? totalCost / P : 1;
        const overPayPct    = P > 0 ? (totalInterest / P) * 100 : 0;

        finalAmountEl.textContent   = formatNumber(balance);
        totalInvestedEl.textContent = formatNumber(totalPaid);
        totalIncomeEl.textContent   = formatNumber(totalInterest);
        multiplierEl.textContent    = `×${mult.toFixed(2)}`;
        totalYieldEl.textContent    = `${overPayPct.toFixed(2)}%`;

        setCardStyle('debt', !!paidOffAt);
        renderTable(rows, true);
    }

    // Цвет карточки "Итоговая сумма / Остаток долга"
    function setCardStyle(mode, paidOff) {
        finalAmountCard.classList.remove('final-card--paid', 'final-card--debt');
        if (mode === 'debt') {
            finalAmountCard.classList.add(paidOff ? 'final-card--paid' : 'final-card--debt');
        }
    }

    function renderTable(rows, isDebt) {
        growthTableBody.innerHTML = rows.map(row => `
            <tr${row.isPaidOff ? ' class="row-paid-off"' : ''}>
                <td>${row.label}${row.isPaidOff ? ' ✓' : ''}</td>
                <td>${row.isPaidOff ? 'Долг погашен' : formatNumber(row.col1)}</td>
                <td>${formatNumber(row.col2)}</td>
                <td>${formatNumber(row.col3)}</td>
            </tr>
        `).join('');
    }

    function calculate() {
        const params = getParams();
        if (params.P <= 0 || params.totalPeriods <= 0) return;
        currentMode === 'invest' ? runInvest(params) : runDebt(params);
    }

    function resetAll() {
        principalInput.value     = '100000';
        rateInput.value          = '10';
        termInput.value          = '5';
        termUnitSelect.value     = 'year';
        compoundFreqSelect.value = '12';
        contributionInput.value  = '0';
        calculate();
    }

    function copyResult() {
        const termLabel  = termUnitSelect.value === 'year' ? 'лет' : 'месяцев';
        const freqLabels = { 365: 'ежедневно', 12: 'ежемесячно', 4: 'ежеквартально', 1: 'раз в год' };
        const modeLabel  = currentMode === 'invest' ? 'Вложение' : 'Долг';
        const text =
`coNVErt — Калькулятор сложного процента (${modeLabel})
Начальная сумма: ${principalInput.value}
Ставка: ${rateInput.value}% годовых (начисление ${freqLabels[compoundFreqSelect.value]})
Срок: ${termInput.value} ${termLabel}
${document.getElementById('labelContributionField').textContent}: ${contributionInput.value}
${document.getElementById('labelFinalAmount').textContent}: ${finalAmountEl.textContent}
${document.getElementById('labelInvested').textContent}: ${totalInvestedEl.textContent}
${document.getElementById('labelIncome').textContent}: ${totalIncomeEl.textContent}
${document.getElementById('labelMultiplier').textContent}: ${multiplierEl.textContent}
${document.getElementById('labelYield').textContent}: ${totalYieldEl.textContent}`;

        navigator.clipboard.writeText(text).then(() => {
            copyButton.textContent = 'Скопировано!';
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.textContent = 'Скопировать результат';
                copyButton.classList.remove('copied');
            }, 1500);
        });
    }

    // ===== Переключатель Вложение / Долг =====
    const MODES = {
        invest: {
            principalField:    'Начальная сумма',
            principalHint:     'Стартовый капитал',
            contributionField: 'Регулярное пополнение',
            contributionHint:  'За каждый период начисления (0 = без пополнений)',
            finalAmount:       'Итоговая сумма',
            invested:          'Инвестировано',
            income:            'Доход от %',
            multiplier:        'Множитель роста',
            yield:             'Доходность',
            thBalance:         'Баланс',
            thInvested:        'Инвестировано',
            thIncome:          'Доход от %',
        },
        debt: {
            principalField:    'Сумма долга',
            principalHint:     'Начальный размер долга',
            contributionField: 'Регулярная выплата',
            contributionHint:  'За каждый период (0 = выплат нет, долг растёт)',
            finalAmount:       'Остаток долга',
            invested:          'Выплачено всего',
            income:            'Начисленные проценты',
            multiplier:        'Множитель долга',
            yield:             'Переплата в %',
            thBalance:         'Остаток долга',
            thInvested:        'Выплачено',
            thIncome:          'Начислено %',
        }
    };

    function applyMode(mode) {
        const m = MODES[mode];
        document.getElementById('labelPrincipalField').textContent    = m.principalField;
        document.getElementById('hintPrincipal').textContent          = m.principalHint;
        document.getElementById('labelContributionField').textContent = m.contributionField;
        document.getElementById('hintContribution').textContent       = m.contributionHint;
        document.getElementById('labelFinalAmount').textContent       = m.finalAmount;
        document.getElementById('labelInvested').textContent          = m.invested;
        document.getElementById('labelIncome').textContent            = m.income;
        document.getElementById('labelMultiplier').textContent        = m.multiplier;
        document.getElementById('labelYield').textContent             = m.yield;
        document.getElementById('thBalance').textContent              = m.thBalance;
        document.getElementById('thInvested').textContent             = m.thInvested;
        document.getElementById('thIncome').textContent               = m.thIncome;
    }

    const modeInvestBtn = document.getElementById('modeInvest');
    const modeDebtBtn   = document.getElementById('modeDebt');

    modeInvestBtn.addEventListener('click', () => {
        currentMode = 'invest';
        modeInvestBtn.classList.add('active');
        modeDebtBtn.classList.remove('active');
        applyMode('invest');
        calculate();
    });

    modeDebtBtn.addEventListener('click', () => {
        currentMode = 'debt';
        modeDebtBtn.classList.add('active');
        modeInvestBtn.classList.remove('active');
        applyMode('debt');
        calculate();
    });

    [principalInput, rateInput, termInput, termUnitSelect, compoundFreqSelect, contributionInput].forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });

    resetButton.addEventListener('click', resetAll);
    copyButton.addEventListener('click', copyResult);

    calculate();
});
