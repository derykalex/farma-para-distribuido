const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = 'farma-rede-master-key-2026';
const DB_PATH = path.join(__dirname, 'database.json');

// Inicializa o banco de dados se não existir
function lerDatabase() {
    if (!fs.existsSync(DB_PATH)) {
        const dadosIniciais = {
            usuarios: [
                { id: 1, nome: 'Admin Master', usuario: 'admin', senha: '123', cargo: 'admin', filial: 'todas' },
                { id: 2, nome: 'Carlos Gerente Regional', usuario: 'gerente_reg', senha: '123', cargo: 'gerente_regional', regiao: 'para_sul' },
                { id: 3, nome: 'Ana Gerente Paragominas', usuario: 'gerente_pgm', senha: '123', cargo: 'gerente_local', filial: 'paragominas' },
                { id: 4, nome: 'Marcos Estoquista', usuario: 'estoque_pgm', senha: '123', cargo: 'estoque', filial: 'paragominas' },
                { id: 5, nome: 'Julia Caixa', usuario: 'caixa_pgm', senha: '123', cargo: 'caixa', filial: 'paragominas' }
            ],
            produtos: [
                { id: 1, nome: 'Dipirona Sódica 500mg', preco: 12.50, estoque: 250, filial: 'paragominas', lote: 'L-2026-01' },
                { id: 2, nome: 'Amoxicilina 500mg', preco: 35.00, estoque: 90, filial: 'paragominas', lote: 'L-2026-02' },
                { id: 3, nome: 'Paracetamol 750mg', preco: 15.00, estoque: 180, filial: 'ananindeua', lote: 'L-2026-03' },
                { id: 4, nome: 'Ibuprofeno 600mg', preco: 22.00, estoque: 110, filial: 'belem-matriz', lote: 'L-2026-04' }
            ]
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(dadosIniciais, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function salvarDatabase(dados) {
    fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2));
}

// Rota de Login
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    const db = lerDatabase();
    
    const user = db.usuarios.find(u => u.usuario === usuario && u.senha === senha);
    if (!user) {
        return res.status(401).json({ sucesso: false, erro: 'Usuário ou senha incorretos!' });
    }

    const token = jwt.sign({ 
        id: user.id, 
        nome: user.nome, 
        cargo: user.cargo, 
        filial: user.filial 
    }, SECRET_KEY, { expiresIn: '12h' });

    res.json({ 
        sucesso: true, 
        token, 
        usuario: { nome: user.nome, cargo: user.cargo, filial: user.filial } 
    });
});

// Middleware de verificação de token e cargos
function verificarPermissao(cargosPermitidos) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ erro: 'Acesso negado. Token não encontrado.' });

        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) return res.status(403).json({ erro: 'Sessão expirada ou token inválido.' });

            // Admin tem acesso total a tudo
            if (decoded.cargo === 'admin') {
                req.user = decoded;
                return next();
            }

            if (!cargosPermitidos.includes(decoded.cargo)) {
                return res.status(403).json({ erro: 'Você não tem permissão para realizar esta operação.' });
            }

            req.user = decoded;
            next();
        });
    };
}

// Listar Funcionários (Exclusivo para Admin ou Gerentes Locais/Regionais autorizados)
app.get('/api/funcionarios', verificarPermissao(['admin', 'gerente_regional', 'gerente_local']), (req, res) => {
    const db = lerDatabase();
    let funcionarios = db.usuarios;
    if (req.user.cargo === 'gerente_local') {
        funcionarios = funcionarios.filter(f => f.filial === req.user.filial);
    }
    res.json(funcionarios);
});

// Adicionar Funcionário (Exclusivo para o Admin)
app.post('/api/funcionarios', verificarPermissao(['admin']), (req, res) => {
    const { nome, usuario, senha, cargo, filial } = req.body;
    const db = lerDatabase();

    if (db.usuarios.some(u => u.usuario === usuario)) {
        return res.status(400).json({ sucesso: false, erro: 'Este nome de usuário já existe no sistema.' });
    }

    const novoFuncionario = {
        id: db.usuarios.length + 1,
        nome,
        usuario,
        senha,
        cargo,
        filial: filial || 'paragominas'
    };

    db.usuarios.push(novoFuncionario);
    salvarDatabase(db);

    res.json({ sucesso: true, mensagem: 'Funcionário cadastrado com sucesso!', funcionario: novoFuncionario });
});

// Listar Produtos / Estoque (Filtra de acordo com a filial do usuário, exceto Admin)
app.get('/api/produtos', verificarPermissao(['admin', 'gerente_regional', 'gerente_local', 'estoque', 'caixa']), (req, res) => {
    const db = lerDatabase();
    let produtos = db.produtos;

    if (req.user.cargo === 'gerente_local' || req.user.cargo === 'estoque' || req.user.cargo === 'caixa') {
        produtos = produtos.filter(p => p.filial === req.user.filial);
    }

    res.json(produtos);
});

// Registrar Venda (Caixa ou Gerente)
app.post('/api/vendas', verificarPermissao(['admin', 'caixa', 'gerente_local']), (req, res) => {
    const { produtoId, quantidade } = req.body;
    const db = lerDatabase();

    const produto = db.produtos.find(p => p.id === Number(produtoId));
    if (!produto) return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado.' });

    if (req.user.cargo !== 'admin' && produto.filial !== req.user.filial) {
        return res.status(403).json({ sucesso: false, erro: 'Você só pode vender produtos da sua própria filial.' });
    }

    if (produto.estoque < quantidade) {
        return res.status(400).json({ sucesso: false, erro: 'Estoque insuficiente para esta venda.' });
    }

    produto.estoque -= Number(quantidade);
    salvarDatabase(db);

    res.json({ sucesso: true, mensagem: 'Venda realizada com sucesso!', estoqueAtual: produto.estoque });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor da Rede de Farmácias rodando na porta ${PORT}`);
});