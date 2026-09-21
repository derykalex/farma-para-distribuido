// frontend-web/app.js
async function fazerLogin(nome, senha) {
    const resposta = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, senha })
    });
    
    const dados = await resposta.json();
    
    if (dados.sucesso) {
        if (dados.autoridade === 'Administrador') {
            carregarInterfaceAdmin(dados.local);
        } else {
            carregarInterfaceUsuario(dados.local);
        }
    } else {
        alert("Acesso Negado!");
    }
}

function carregarInterfaceAdmin(local) {
    document.body.innerHTML = `<h1>Painel do Administrador - Matriz (${local})</h1>
                               <p>Acesso total ao banco de dados e controle de todas as 5 filiais.</p>`;
}

function carregarInterfaceUsuario(local) {
    document.body.innerHTML = `<h1>Painel do Usuário - Filial (${local})</h1>
                               <p>Acesso restrito para vendas e controle de estoque local.</p>`;
}
