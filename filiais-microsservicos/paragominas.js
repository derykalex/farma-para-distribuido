// filiais-microsservicos/paragominas.js
const express = require('express');
const axios = require('axios'); // Para fazer requisições à Matriz
const app = express();
app.use(express.json());

app.get('/estoque-local', async (req, res) => {
    // Escalonamento geográfico: A filial pede dados para a Matriz em Belém
    try {
        const respostaMatriz = await axios.get('http://localhost:3000/api/estoque');
        res.json({ local: 'Paragominas', estoque: respostaMatriz.data });
    } catch (error) {
        // Lidar com falhas de comunicação na rede
        res.status(500).json({ erro: 'Falha de comunicação com a Matriz Belém' });
    }
});

app.listen(3001, () => console.log('Nó de Distribuição Paragominas rodando na porta 3001'));
