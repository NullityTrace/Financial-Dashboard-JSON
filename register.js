let data = {};

document.addEventListener('DOMContentLoaded', async () => {
    const transactionForm = document.getElementById('transactionForm');
    const jsonDataDisplay = document.getElementById('jsonDataDisplay');
    const copyJsonButton = document.getElementById('copyJsonButton');

    await loadData();
    updateJsonDisplay();

    transactionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const value = parseFloat(document.getElementById('value').value);
        const type = document.getElementById('type').value;
        const date = document.getElementById('date').value;

        if (!name || isNaN(value) || !date) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        const newTransaction = { nome: name, valor: value, tipo: type, data: date };

        if (type === 'Rendimento') {
            data.rendimentos.push(newTransaction);
        } else {
            data.transacoes.push(newTransaction);
        }

        updateJsonDisplay();
        transactionForm.reset();
    });

    copyJsonButton.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2))
            .then(() => {
                alert('JSON copiado para a área de transferência!');
            })
            .catch((error) => {
                console.error('Erro ao copiar JSON:', error);
                alert('Ocorreu um erro ao copiar o JSON.');
            });
    });
});

async function loadData() {
    try {
        const response = await fetch('data.json'); 
        if (!response.ok) {
            throw new Error(`Erro ao carregar o arquivo data.json: ${response.status}`);
        }
        data = await response.json(); 
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        alert('Ocorreu um erro ao carregar os dados. Verifique o console para mais detalhes.');
    }
}

function updateJsonDisplay() {
    const jsonDataDisplay = document.getElementById('jsonDataDisplay');
    jsonDataDisplay.textContent = JSON.stringify(data, null, 2); 
}