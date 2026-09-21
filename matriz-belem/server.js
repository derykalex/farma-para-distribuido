
// matriz-belem/server.js
const express = require('express');
const app = express();
app.use(express.json());

// Simulando o Banco de Dados Centralizado em Belém
const usuarios = [
    { nome: 'admin_belem', senha: '123', autoridade: 'Administrador', local: 'Matriz' },
    { nome: 'joao_paragominas', senha: '456', autoridade: 'Usuário', local: 'Paragominas' },
    { nome: 'maria_ananindeua', senha: '789', autoridade: 'Usuário', local: 'Ananindeua' }
];

// Rota de Login e Verificação de Autoridade
app.post('/api/login', (req, res) => {
    const { nome, senha } = req.body;
    const user = usuarios.find(u => u.nome === nome && u.senha === senha);
    
    if (user) {
        // Transparência: O servidor devolve a autoridade para a interface Web moldar a tela
        res.json({ sucesso: true, autoridade: user.autoridade, local: user.local });
    } else {
        res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas' });
    }
});

app.listen(3000, () => console.log('Servidor Central (Matriz Belém) rodando na porta 3000'));
