'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const telas = {
        'clientes-lista': iniciarListaClientes,
        'clientes-form': iniciarFormularioCliente,
        'clientes-detalhe': iniciarDetalheCliente
    };
    const iniciar = telas[document.body.dataset.pagina];
    if (iniciar) {
        iniciar();
    }
});

async function excluirCliente(cliente) {
    const confirmado = await Ui.confirmar(
        `Excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`);
    if (!confirmado) {
        return false;
    }
    try {
        await Api.excluir(`/clientes/${cliente.id}`);
        return true;
    } catch (erro) {
        Ui.notificar(erro.message, 'danger');
        return false;
    }
}

async function iniciarListaClientes() {
    const busca = document.getElementById('busca-clientes');
    const corpoTabela = document.getElementById('tabela-clientes');
    const areaTabela = document.getElementById('area-tabela-clientes');
    const contador = document.getElementById('contador-clientes');
    const vazio = document.getElementById('clientes-vazio');
    let clientes = [];

    function renderizar() {
        const termo = busca.value.trim().toLowerCase();
        const filtrados = clientes.filter(c =>
            [c.nome, c.email, c.telefone].some(valor => (valor || '').toLowerCase().includes(termo)));

        contador.textContent = termo
            ? `${filtrados.length} de ${clientes.length} clientes`
            : `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`;

        const semResultado = filtrados.length === 0;
        areaTabela.classList.toggle('d-none', semResultado);
        vazio.classList.toggle('d-none', !semResultado);
        if (semResultado) {
            document.getElementById('clientes-vazio-mensagem').textContent = clientes.length === 0
                ? 'Nenhum cliente cadastrado ainda.'
                : 'Nenhum cliente encontrado para a busca.';
            document.getElementById('clientes-vazio-botao').classList.toggle('d-none', clientes.length > 0);
            return;
        }

        corpoTabela.innerHTML = filtrados.map(c => `
            <tr>
                <td>
                    <a href="/app/clientes/${c.id}" class="d-flex align-items-center gap-2 text-decoration-none text-body">
                        <span class="avatar" aria-hidden="true">${Ui.escapar(Ui.iniciais(c.nome))}</span>
                        <span>
                            <span class="fw-medium">${Ui.escapar(c.nome)}</span>
                            <span class="d-block d-sm-none small text-body-secondary">${Ui.escapar(c.email)}</span>
                        </span>
                    </a>
                </td>
                <td class="d-none d-sm-table-cell">${Ui.escapar(c.email)}</td>
                <td class="d-none d-md-table-cell">
                    ${c.telefone ? Ui.escapar(c.telefone) : '<span class="text-body-tertiary">—</span>'}
                </td>
                <td class="text-end text-nowrap">
                    <a class="btn btn-sm btn-outline-secondary" href="/app/clientes/${c.id}"
                       title="Ver detalhes" aria-label="Ver detalhes de ${Ui.escapar(c.nome)}">
                        <i class="bi bi-eye"></i>
                    </a>
                    <a class="btn btn-sm btn-outline-primary" href="/app/clientes/${c.id}/editar"
                       title="Editar" aria-label="Editar ${Ui.escapar(c.nome)}">
                        <i class="bi bi-pencil"></i>
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${c.id}"
                            title="Excluir" aria-label="Excluir ${Ui.escapar(c.nome)}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`).join('');
    }

    busca.addEventListener('input', renderizar);

    corpoTabela.addEventListener('click', async evento => {
        const botao = evento.target.closest('[data-excluir]');
        if (!botao) {
            return;
        }
        const cliente = clientes.find(c => String(c.id) === botao.dataset.excluir);
        if (cliente && await excluirCliente(cliente)) {
            clientes = clientes.filter(c => c.id !== cliente.id);
            renderizar();
            Ui.notificar('Cliente excluído com sucesso.');
        }
    });

    try {
        clientes = await Api.get('/clientes');
        renderizar();
    } catch (erro) {
        Ui.mostrarFalha(document.getElementById('conteudo-clientes'), erro);
    }
}

async function iniciarFormularioCliente() {
    const id = document.body.dataset.id;
    const form = document.getElementById('form-cliente');
    const campos = document.getElementById('campos-cliente');
    const botaoSalvar = document.getElementById('botao-salvar');

    form.addEventListener('input', evento => evento.target.classList.remove('is-invalid'));

    if (id) {
        try {
            const cliente = await Api.get(`/clientes/${id}`);
            form.elements.nome.value = cliente.nome;
            form.elements.email.value = cliente.email;
            form.elements.telefone.value = cliente.telefone ?? '';
            campos.disabled = false;
        } catch (erro) {
            Ui.mostrarFalha(document.getElementById('conteudo-formulario'), erro);
            return;
        }
    }
    form.elements.nome.focus();

    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        Ui.limparErros(form);
        const dados = {
            nome: form.elements.nome.value.trim(),
            email: form.elements.email.value.trim(),
            telefone: form.elements.telefone.value.trim() || null
        };

        Ui.carregando(botaoSalvar, true);
        try {
            const salvo = id
                ? await Api.put(`/clientes/${id}`, dados)
                : await Api.post('/clientes', dados);
            Ui.notificarNaProximaPagina(id ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
            window.location.href = `/app/clientes/${salvo.id}`;
        } catch (erro) {
            Ui.mostrarErros(form, erro);
            Ui.carregando(botaoSalvar, false);
        }
    });
}

async function iniciarDetalheCliente() {
    const id = document.body.dataset.id;

    let cliente;
    try {
        cliente = await Api.get(`/clientes/${id}`);
    } catch (erro) {
        Ui.mostrarFalha(document.getElementById('conteudo-cliente'), erro);
        return;
    }

    document.title = `${cliente.nome} · Sistema de Chamados`;
    document.getElementById('cliente-nome').textContent = cliente.nome;
    document.getElementById('cliente-avatar').textContent = Ui.iniciais(cliente.nome);
    const email = document.getElementById('cliente-email');
    email.textContent = cliente.email;
    email.href = `mailto:${cliente.email}`;
    document.getElementById('cliente-telefone').textContent = cliente.telefone || 'Sem telefone';

    document.getElementById('botao-excluir').addEventListener('click', async () => {
        if (await excluirCliente(cliente)) {
            Ui.notificarNaProximaPagina('Cliente excluído com sucesso.');
            window.location.href = '/app/clientes';
        }
    });

    const corpoTabela = document.getElementById('tabela-chamados');
    const areaTabela = document.getElementById('area-chamados');
    const vazio = document.getElementById('chamados-vazio');
    const rodape = document.getElementById('paginacao-chamados');
    const total = document.getElementById('total-chamados');

    async function carregarChamados(numeroPagina) {
        try {
            const pagina = await Api.get(`/clientes/${id}/chamados?page=${numeroPagina}&size=5`);
            const semChamados = pagina.totalElementos === 0;
            total.textContent = `${pagina.totalElementos} no total`;
            areaTabela.classList.toggle('d-none', semChamados);
            vazio.classList.toggle('d-none', !semChamados);
            rodape.classList.toggle('d-none', semChamados);

            corpoTabela.innerHTML = pagina.conteudo.map(ch => `
                <tr>
                    <td class="text-body-secondary">${ch.id}</td>
                    <td><a class="fw-medium text-decoration-none" href="/app/chamados/${ch.id}">${Ui.escapar(ch.titulo)}</a></td>
                    <td class="d-none d-md-table-cell">${Ui.escapar(ch.categoria.nome)}</td>
                    <td>${Ui.badgePrioridade(ch.prioridade)}</td>
                    <td>${Ui.badgeStatus(ch.status)}</td>
                    <td class="d-none d-lg-table-cell text-nowrap">${Ui.formatarData(ch.dataAbertura)}</td>
                </tr>`).join('');
            Ui.paginacao(rodape, pagina, carregarChamados);
        } catch (erro) {
            Ui.mostrarFalha(areaTabela, erro);
        }
    }

    carregarChamados(0);
}
