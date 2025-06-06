let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
const rowsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('data.json');
    const data = await response.json();
    

    const initialDate = new Date(data.dataInicial);
    const today = new Date();
    const filteredRendimentos = data.rendimentos.filter(rendimento => new Date(rendimento.data) >= initialDate);
    const filteredTransacoes = data.transacoes.filter(transacao => new Date(transacao.data) >= initialDate);
    const realizedExpenses = filteredTransacoes.filter(transacao => new Date(transacao.data) <= today);
    const futureExpenses = filteredTransacoes.filter(transacao => new Date(transacao.data) > today);

    allTransactions = [
        ...filteredTransacoes.map(transaction => ({ ...transaction, tipo: 'Despesa' })),
        ...filteredRendimentos.map(rendimento => ({ ...rendimento, tipo: 'Rendimento' }))
    ];

    filteredTransactions = [...allTransactions];

    populateYearFilter(allTransactions);
    calculateAndDisplaySummary(data);
    renderTable(filteredTransactions);
    generateCharts(data);

    const generatePromptButton = document.getElementById('generatePromptButton');
    const generatedPrompt = document.getElementById('generatedPrompt');

    generatePromptButton.addEventListener('click', () => {
        const stats = calculateFinancialStats(data, filteredRendimentos, realizedExpenses, futureExpenses);

        const prompt = `
            Você é um assistente financeiro especializado em ajudar pessoas a melhorar sua saúde financeira. Com base nos seguintes dados do usuário, forneça um relatório detalhado com sugestões práticas:

            - Saldo Atual: €${stats.currentBalance.toFixed(2)}
            - Rendimentos Totais (até hoje): €${stats.totalIncome.toFixed(2)}
            - Despesas Totais Realizadas: €${stats.totalRealizedExpenses.toFixed(2)}
            - Despesas Recorrentes Mensais (ex.: Prestação, Meo, Digi): €${stats.monthlyRecurringExpense.toFixed(2)}
            - Despesas Futuras Planejadas: €${stats.totalFutureExpenses.toFixed(2)}

            Com base nessas informações:
            1. Quais são as principais áreas onde o usuário pode reduzir despesas?
            2. Qual seria uma estratégia realista para aumentar a poupança mensal?
            3. Como o usuário pode planejar o pagamento de suas despesas recorrentes?
            4. Sugira um plano para criar um fundo de emergência (pé de meia).

            Por favor, forneça um relatório claro e prático com exemplos específicos.
        `;

        generatedPrompt.value = prompt.trim();
    });

    copyPromptButton.addEventListener('click', () => {
        const promptText = generatedPrompt.value;
        if (promptText) {
            navigator.clipboard.writeText(promptText)
                .then(() => {
                    alert('Prompt copiado para a área de transferência!');
                })
                .catch((error) => {
                    console.error('Erro ao copiar o prompt:', error);
                    alert('Ocorreu um erro ao copiar o prompt.');
                });
        } else {
            alert('Nenhum prompt disponível para copiar.');
        }
    });
});

function calculateFinancialStats(data, filteredRendimentos, realizedExpenses, futureExpenses) {
    const totalIncome = filteredRendimentos.reduce((sum, item) => sum + item.valor, 0);
    const totalRealizedExpenses = realizedExpenses.reduce((sum, item) => sum + item.valor, 0);
    const totalFutureExpenses = futureExpenses.reduce((sum, item) => sum + item.valor, 0);
    const currentBalance = data.saldoInicial + totalIncome - totalRealizedExpenses;

    const recurringExpenses = realizedExpenses.filter(transaction => ["Prestação", "Meo", "Digi"].includes(transaction.nome));
    const monthlyRecurringExpense = recurringExpenses.length > 0 ? recurringExpenses[0].valor : 0;

    return {
        currentBalance,
        totalIncome,
        totalRealizedExpenses,
        totalFutureExpenses,
        monthlyRecurringExpense,
    };
}

function calculateAndDisplaySummary(data) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const incomeByYear = calculateMonthlyIncomeByYear(data.rendimentos);
    const expensesByYear = calculateMonthlyExpensesByYear(data.transacoes);

    const initialDate = new Date(data.dataInicial);
    const filteredRendimentos = data.rendimentos.filter(rendimento => new Date(rendimento.data) >= initialDate);
    const filteredTransacoes = data.transacoes.filter(transacao => new Date(transacao.data) >= initialDate);

    const totalIncome = filteredRendimentos.reduce((sum, item) => sum + item.valor, 0);
    const totalExpenses = filteredTransacoes.reduce((sum, item) => sum + item.valor, 0);
    const totalBalance = data.saldoInicial + totalIncome - totalExpenses;

    document.getElementById('totalBalance').textContent = `€${totalBalance.toFixed(2)}`;
    document.getElementById('monthlyIncome').textContent = `€${incomeByYear[currentYear]?.[currentMonth - 1]?.toFixed(2) || 0}`;
    document.getElementById('remainingAfterExpenses').textContent = `€${(incomeByYear[currentYear]?.[currentMonth - 1] || 0) - (expensesByYear[currentYear]?.[currentMonth - 1] || 0).toFixed(2)}`;
}

function calculateMonthlyIncomeByYear(rendimentos) {
    const incomeByYear = {};
    rendimentos.forEach(rendimento => {
        const [year, month] = rendimento.data.split('-').map(Number);
        const value = rendimento.valor;
        if (!incomeByYear[year]) incomeByYear[year] = Array(12).fill(0);
        incomeByYear[year][month - 1] += value;
    });
    return incomeByYear;
}

function calculateMonthlyExpensesByYear(transactions) {
    const expensesByYear = {};
    transactions.forEach(transaction => {
        const [year, month] = transaction.data.split('-').map(Number);
        const value = transaction.valor;
        if (!expensesByYear[year]) expensesByYear[year] = Array(12).fill(0);
        expensesByYear[year][month - 1] += value;
    });
    return expensesByYear;
}

function renderTable(transactions) {
    const transactionsTableBody = document.querySelector('#transactionsTable tbody');
    transactionsTableBody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = transactions.slice(start, end);

    paginatedData.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.data}</td>
            <td>${transaction.nome}</td>
            <td>€${transaction.valor.toFixed(2)}</td>
            <td>${transaction.tipo}</td>
        `;
        transactionsTableBody.appendChild(row);
    });

    updatePagination(transactions.length);
}

function updatePagination(totalRows) {
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderTable(filteredTransactions);
}

function filterTable() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const monthFilter = document.getElementById('monthFilter').value;

    filteredTransactions = allTransactions.filter(transaction => {
        const [year, month] = transaction.data.split('-'); 
        const matchesSearch = transaction.nome.toLowerCase().includes(searchValue) ||
                              transaction.valor.toString().includes(searchValue);
        const matchesType = typeFilter ? transaction.tipo === typeFilter : true;
        const matchesYear = yearFilter ? year === yearFilter : true;
        const matchesMonth = monthFilter ? month === monthFilter : true;
        return matchesSearch && matchesType && matchesYear && matchesMonth;
    });

    currentPage = 1; 
    renderTable(filteredTransactions);
}

let dividaChartInstance = null;
function generateCharts(data) {
    const incomeByYear = calculateMonthlyIncomeByYear(data.rendimentos);
    const expensesByYear = calculateMonthlyExpensesByYear(data.transacoes);

    Object.keys(expensesByYear).forEach(year => {
        const yearlyExpenses = expensesByYear[year];
        const yearlyIncome = incomeByYear[year] || Array(12).fill(0);
        const yearlyNet = yearlyIncome.map((income, index) => income - yearlyExpenses[index]);

        const chartContainer = document.createElement('div');
        chartContainer.classList.add('chart-container');
        chartContainer.innerHTML = `<h3>Resumo Financeiro em ${year}</h3><canvas></canvas>`;
        document.querySelector('.charts').appendChild(chartContainer);

        const canvas = chartContainer.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: generateMonths(),
                datasets: [
                    { label: 'Rendimentos (€)', data: yearlyIncome, backgroundColor: '#28a745' },
                    { label: 'Despesas (€)', data: yearlyExpenses, backgroundColor: '#dc3545' },
                    { label: 'Saldo Líquido (€)', data: yearlyNet, backgroundColor: '#007bff' }
                ]
            },
            options: { responsive: true,
                maintainAspectRatio: false, 
                scales: {
                    y: { beginAtZero: false }
                } }
        });
    });

    const dividaCtx = document.getElementById('dividaChart').getContext('2d');
    if (dividaChartInstance) {
        dividaChartInstance.destroy();
    }
    dividaChartInstance = new Chart(dividaCtx, {
        type: 'line',
        data: {
            labels: data.previsaoDivida.map(item => `Mês ${item.mesesRestantes}`),
            datasets: [{
                label: 'Dívida Restante (€)',
                data: data.previsaoDivida.map(item => item.dividaRestante),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'Saldo Previsto (€)',
                data: data.previsaoDivida.map(item => item.saldoPrevisto),
                borderColor: '#00e676',
                backgroundColor: 'rgba(0, 230, 118, 0.2)',
                borderWidth: 2,
                fill: true
            }
        ]
        },
        options: { responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false }
            } }
    });
}

function generateMonths() {
    return Array.from({ length: 12 }, (_, i) => `Mês ${i + 1}`);
}

function populateYearFilter(transactions) {
    const years = [...new Set(transactions.map(transaction => transaction.data.split('-')[0]))].sort((a, b) => b - a);
    const yearFilter = document.getElementById('yearFilter');

    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}