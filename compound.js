document.addEventListener('DOMContentLoaded', () => {
    const principalInput    = document.getElementById('principal');
    const rateInput         = document.getElementById('rate');
    const termInput         = document.getElementById('term');
    const termUnitSelect    = document.getElementById('termUnit');
    const compoundFreqSelect = document.getElementById('compoundFreq');
    const contributionInput = document.getElementById('contribution');
    const resetButton       = document.getElementById('resetButton');
    const copyButton        = document.getElementById('copyButton');

    const finalAmountEl   = document.getElementById('finalAmount');
    const totalInvestedEl = document.getElementById('totalInvested');
    const totalIncomeEl   = document.getElementById('totalIncome');
    const multiplierEl    = document.getElementById('multiplier');
    const totalYieldEl    = document.getElementById('totalYield');
    const growthTableBody = document.getElementById('growthTableBody');

    function formatNumber(value) {
        if (value === 0) return '0.00';
        if (Math.abs(value) >= 10_000_000) return value.toExponential(2);
        return value.toFixed(2);
    }

    function calculate() {
        const P = parseFloat(principalInput.value) || 0;
        const r = (parseFloat(rateInput.value) || 0) / 100;
        const termVal = parseFloat(termInput.value) || 0;
        const termUnit = termUnitSelect.value;
        const n = parseInt(compoundFreqSelect.value);
        const C = parseFloat(contributionInput.value) || 0;

        // Срок в годах и общее число периодов
        const t = termUnit === 'year' ? termVal : termVal / 12;
        const totalPeriods = Math.round(n * t);

        if (P <= 0 || totalPeriods <= 0 || r <= 0) {
            finalAmountEl.textContent = formatNumber(P);
            totalInvestedEl.textContent = formatNumber(P + C * totalPeriods);
            totalIncomeEl.textContent = '0.00';
            multiplierEl.textContent = '×1.00';
            totalYieldEl.textContent = '0.00%';
            growthTableBody.innerHTML = '';
            return;
        }

        const rPerPeriod = r / n;

        // Симуляция период за периодом
        let balance = P;
        const rows = [];

        // Если периодов много — показываем снимки по годам
        const showByYear = totalPeriods > 24;
        const snapshotSet = new Set();

        if (showByYear) {
            for (let y = 1; y * n <= totalPeriods; y++) snapshotSet.add(y * n);
        } else {
            for (let i = 1; i <= totalPeriods; i++) snapshotSet.add(i);
        }
        snapshotSet.add(totalPeriods);

        const periodLabels = { 365: 'День', 12: 'Месяц', 4: 'Квартал', 1: 'Год' };

        for (let i = 1; i <= totalPeriods; i++) {
            balance = balance * (1 + rPerPeriod) + C;

            if (snapshotSet.has(i)) {
                const cumInvested = P + C * i;
                const cumInterest = balance - cumInvested;

                let label;
                if (showByYear) {
                    const yearNum = Math.round(i / n);
                    label = `Год ${yearNum}`;
                } else {
                    label = `${periodLabels[n]} ${i}`;
                }

                rows.push({ label, balance, cumInvested, cumInterest });
            }
        }

        const totalInvested = P + C * totalPeriods;
        const totalIncome = balance - totalInvested;
        const mult = P > 0 ? balance / P : 1;
        const yieldPct = totalInvested > 0 ? (totalIncome / totalInvested) * 100 : 0;

        finalAmountEl.textContent = formatNumber(balance);
        totalInvestedEl.textContent = formatNumber(totalInvested);
        totalIncomeEl.textContent = formatNumber(totalIncome);
        multiplierEl.textContent = `×${mult.toFixed(2)}`;
        totalYieldEl.textContent = `${yieldPct.toFixed(2)}%`;

        growthTableBody.innerHTML = rows.map(row => `
            <tr>
                <td>${row.label}</td>
                <td>${formatNumber(row.balance)}</td>
                <td>${formatNumber(row.cumInvested)}</td>
                <td>${formatNumber(row.cumInterest)}</td>
            </tr>
        `).join('');
    }

    function resetAll() {
        principalInput.value    = '100000';
        rateInput.value         = '10';
        termInput.value         = '5';
        termUnitSelect.value    = 'year';
        compoundFreqSelect.value = '12';
        contributionInput.value = '0';
        calculate();
    }

    function copyResult() {
        const termLabel = termUnitSelect.value === 'year' ? 'лет' : 'месяцев';
        const freqLabels = { 365: 'ежедневно', 12: 'ежемесячно', 4: 'ежеквартально', 1: 'раз в год' };
        const text =
`coNVErt — Калькулятор сложного процента
Начальная сумма: ${principalInput.value}
Ставка: ${rateInput.value}% годовых (начисление ${freqLabels[compoundFreqSelect.value]})
Срок: ${termInput.value} ${termLabel}
Пополнение за период: ${contributionInput.value}
Итоговая сумма: ${finalAmountEl.textContent}
Инвестировано: ${totalInvestedEl.textContent}
Доход от %: ${totalIncomeEl.textContent}
Множитель: ${multiplierEl.textContent}
Доходность: ${totalYieldEl.textContent}`;

        navigator.clipboard.writeText(text).then(() => {
            copyButton.textContent = 'Скопировано!';
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.textContent = 'Скопировать результат';
                copyButton.classList.remove('copied');
            }, 1500);
        });
    }

    const inputs = [principalInput, rateInput, termInput, termUnitSelect, compoundFreqSelect, contributionInput];
    inputs.forEach(el => {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    });

    resetButton.addEventListener('click', resetAll);
    copyButton.addEventListener('click', copyResult);

    // ===== Переключатель контекста: Вложение / Долг =====
    const MODES = {
        invest: {
            principalField:     'Начальная сумма',
            principalHint:      'Стартовый капитал',
            contributionField:  'Регулярное пополнение',
            contributionHint:   'За каждый период начисления (0 = без пополнений)',
            finalAmount:        'Итоговая сумма',
            invested:           'Инвестировано',
            income:             'Доход от %',
            multiplier:         'Множитель роста',
            yield:              'Доходность',
            thBalance:          'Баланс',
            thInvested:         'Инвестировано',
            thIncome:           'Доход от %',
        },
        debt: {
            principalField:     'Сумма долга',
            principalHint:      'Начальный размер долга',
            contributionField:  'Регулярная выплата',
            contributionHint:   'За каждый период начисления (0 = без выплат)',
            finalAmount:        'Итого к выплате',
            invested:           'Тело долга + выплаты',
            income:             'Начисленные проценты',
            multiplier:         'Множитель долга',
            yield:              'Переплата в %',
            thBalance:          'Остаток',
            thInvested:         'Тело + выплаты',
            thIncome:           'Начислено %',
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
        modeInvestBtn.classList.add('active');
        modeDebtBtn.classList.remove('active');
        applyMode('invest');
    });

    modeDebtBtn.addEventListener('click', () => {
        modeDebtBtn.classList.add('active');
        modeInvestBtn.classList.remove('active');
        applyMode('debt');
    });

    calculate();
});
