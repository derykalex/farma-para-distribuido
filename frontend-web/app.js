const API_URL = 'http://localhost:3000/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const dados = await resposta.json();

        if (dados.sucesso) {
            localStorage.setItem('token', dados.token);
            localStorage.setItem('usuario', JSON.stringify(dados.usuario));
            entrarNoSistema(dados.usuario);
        } else {
            document.getElementById('login-erro').innerText = dados.erro;
        }
    } catch (err) {
        document.getElementById('login-erro').innerText = 'Erro de conexão com o servidor.';
    }
});

function entrarNoSistema(usuario) {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    document.getElementById('info-usuario-nome').innerText = `${usuario.nome} (${usuario.filial.toUpperCase()})`;
    document.getElementById('badge-cargo').innerText = usuario.cargo.toUpperCase();

    // Controle de Exibição de Menus por Nível de Acesso
    if (usuario.cargo === 'admin' || usuario.cargo === 'gerente_regional' || usuario.cargo === 'gerente_local') {
        document.getElementById('menu-funcionarios').classList.remove('hidden');
    }
    if (usuario.cargo === 'admin' || usuario.cargo === 'gerente_regional') {
        document.getElementById('menu-relatorios').classList.remove('hidden');
    }

    carregarEstoque();
    carregarProdutosSelect();
    if (usuario.cargo === 'admin' || usuario.cargo === 'gerente_local') {
        carregarFuncionarios();
    }
}

async function carregarEstoque() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/produtos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const produtos = await res.json();

        let html = `<table><tr><th>Filial</th><th>Produto</th><th>Lote</th><th>Preço</th><th>Estoque</th></tr>`;
        produtos.forEach(p => {
            html += `<tr>
                <td><b>${p.filial.toUpperCase()}</b></td>
                <td>${p.nome}</td>
                <td>${p.lote}</td>
                <td>R$ ${p.preco.toFixed(2)}</td>
                <td>${p.estoque} un</td>
            </tr>`;
        });
        html += `</table>`;
        document.getElementById('tabela-estoque-container').innerHTML = html;
    } catch (err) {
        document.getElementById('tabela-estoque-container').innerText = 'Erro ao carregar estoque.';
    }
}

async function carregarProdutosSelect() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/produtos`, { headers: { 'Authorization': `Bearer ${token}` } });
    const produtos = await res.json();
    const select = document.getElementById('select-produto');
    select.innerHTML = '';
    produtos.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nome} (${p.filial}) - R$ ${p.preco.toFixed(2)}</option>`;
    });
}

async function efetivarVenda() {
    const token = localStorage.getItem('token');
    const produtoId = document.getElementById('select-produto').value;
    const quantidade = document.getElementById('qtd-venda').value;

    const res = await fetch(`${API_URL}/vendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ produtoId, quantidade })
    });
    const dados = await res.json();
    if (dados.sucesso) {
        alert(dados.mensagem);
        carregarEstoque();
    } else {
        alert(dados.erro);
    }
}

async function cadastrarFuncionario(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const novoFunc = {
        nome: document.getElementById('novo-nome').value,
        usuario: document.getElementById('novo-usuario').value,
        senha: document.getElementById('novo-senha').value,
        cargo: document.getElementById('novo-cargo').value,
        filial: document.getElementById('nova-filial').value
    };

    const res = await fetch(`${API_URL}/funcionarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(novoFunc)
    });
    const dados = await res.json();
    if (dados.sucesso) {
        alert(dados.mensagem);
        document.getElementById('form-novo-func').reset();
        carregarFuncionarios();
    } else {
        alert(dados.erro);
    }
}

async function carregarFuncionarios() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/funcionarios`, { headers: { 'Authorization': `Bearer ${token}` } });
    const funcionarios = await res.json();

    let html = `<h4>Funcionários da Rede Cadastrados:</h4><table><tr><th>Nome</th><th>Usuário</th><th>Cargo</th><th>Filial</th></tr>`;
    funcionarios.forEach(f => {
        html += `<tr><td>${f.nome}</td><td>${f.usuario}</td><td>${f.cargo}</td><td>${f.filial}</td></tr>`;
    });
    html += `</table>`;
    const container = document.getElementById('lista-funcionarios-container');
    if (container) container.innerHTML = html;
}

function mudarAba(aba) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));

    document.getElementById(`aba-${aba}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}

function logout() {
    localStorage.clear();
    location.reload();
}

window.onload = () => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
        entrarNoSistema(JSON.parse(usuarioSalvo));
    }
};cd matriz-belem