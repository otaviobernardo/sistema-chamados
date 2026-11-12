'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const telas = {
        'chamados-lista': iniciarListaChamados,
        'chamados-form': iniciarFormularioChamado,
        'chamados-detalhe': iniciarDetalheChamado
    };
    const iniciar = telas[document.body.dataset.pagina];
    if (iniciar) {
        iniciar();
    }
});

const TAMANHO_PAGINA_CHAMADOS = 10;
const ORDEM_PADRAO_CHAMADOS = 'dataAbertura,desc';

async function iniciarListaChamados() {
    const filtros = document.getElementById('filtros-chamados');
    const filtroStatus = document.getElementById('filtro-status');
    const filtroPrioridade = document.getElementById('filtro-prioridade');
    const filtroCliente = document.getElementById('filtro-cliente');
    const filtroOrdem = document.getElementById('filtro-ordem');
    const botaoLimpar = document.getElementById('limpar-filtros');
    const corpoTabela = document.getElementById('tabela-chamados');
    const areaTabela = document.getElementById('area-tabela-chamados');
    const contador = document.getElementById('contador-chamados');
    const vazio = document.getElementById('chamados-vazio');
    const rodape = document.getElementById('paginacao-chamados');

    const daUrl = new URLSearchParams(window.location.search);
    filtroStatus.value = daUrl.get('status') || '';
    filtroPrioridade.value = daUrl.get('prioridade') || '';
    filtroOrdem.value = daUrl.get('sort') || ORDEM_PADRAO_CHAMADOS;
    if (!filtroOrdem.value) {
        filtroOrdem.value = ORDEM_PADRAO_CHAMADOS;
    }

    try {
        const clientes = await Api.get('/clientes');
        Ui.preencherSelect(filtroCliente, clientes, { vazio: 'Todos', valor: daUrl.get('clienteId') });
    } catch (erro) {
        Ui.notificar(erro.message, 'danger');
    }

    const temFiltro = () => Boolean(filtroStatus.value || filtroPrioridade.value || filtroCliente.value);

    function atualizarUrl(numeroPagina) {
        const naTela = new URLSearchParams();
        if (filtroStatus.value) naTela.set('status', filtroStatus.value);
        if (filtroPrioridade.value) naTela.set('prioridade', filtroPrioridade.value);
        if (filtroCliente.value) naTela.set('clienteId', filtroCliente.value);
        if (filtroOrdem.value !== ORDEM_PADRAO_CHAMADOS) naTela.set('sort', filtroOrdem.value);
        if (numeroPagina > 0) naTela.set('page', numeroPagina);
        const consulta = naTela.toString();
        history.replaceState(null, '', '/app/chamados' + (consulta ? `?${consulta}` : ''));
    }

    async function carregar(numeroPagina) {
        const parametros = new URLSearchParams({
            page: numeroPagina,
            size: TAMANHO_PAGINA_CHAMADOS,
            sort: filtroOrdem.value
        });
        if (filtroStatus.value) parametros.set('status', filtroStatus.value);
        if (filtroPrioridade.value) parametros.set('prioridade', filtroPrioridade.value);
        if (filtroCliente.value) parametros.set('clienteId', filtroCliente.value);
        botaoLimpar.classList.toggle('d-none', !temFiltro());

        let pagina;
        try {
            pagina = await Api.get(`/chamados?${parametros}`);
        } catch (erro) {
            Ui.mostrarFalha(areaTabela, erro);
            return;
        }
        if (pagina.conteudo.length === 0 && pagina.totalPaginas > 0) {
            carregar(pagina.totalPaginas - 1);
            return;
        }
        atualizarUrl(pagina.pagina);

        contador.textContent = Ui.contar(pagina.totalElementos, 'chamado', 'chamados');
        const semChamados = pagina.totalElementos === 0;
        areaTabela.classList.toggle('d-none', semChamados);
        rodape.classList.toggle('d-none', semChamados);
        vazio.classList.toggle('d-none', !semChamados);
        if (semChamados) {
            document.getElementById('chamados-vazio-mensagem').textContent = temFiltro()
                ? 'Nenhum chamado encontrado com esses filtros.'
                : 'Nenhum chamado aberto ainda.';
            document.getElementById('chamados-vazio-botao').classList.toggle('d-none', temFiltro());
            return;
        }

        corpoTabela.innerHTML = pagina.conteudo.map(ch => `
            <tr>
                <td class="text-body-secondary">${ch.id}</td>
                <td>
                    <a class="fw-medium text-decoration-none" href="/app/chamados/${ch.id}">${Ui.escapar(ch.titulo)}</a>
                    <span class="d-block d-md-none small text-body-secondary">${Ui.escapar(ch.cliente.nome)}</span>
                    <span class="d-inline-block d-sm-none mt-1">${Ui.badgePrioridade(ch.prioridade)}</span>
                </td>
                <td class="d-none d-md-table-cell">${Ui.escapar(ch.cliente.nome)}</td>
                <td class="d-none d-xl-table-cell">${Ui.escapar(ch.categoria.nome)}</td>
                <td class="d-none d-lg-table-cell">
                    ${ch.tecnico ? Ui.escapar(ch.tecnico.nome) : '<span class="text-body-tertiary">Não atribuído</span>'}
                </td>
                <td class="d-none d-sm-table-cell">${Ui.badgePrioridade(ch.prioridade)}</td>
                <td>${Ui.badgeStatus(ch.status)}</td>
                <td class="d-none d-lg-table-cell text-nowrap">${Ui.formatarData(ch.dataAbertura)}</td>
            </tr>`).join('');
        Ui.paginacao(rodape, pagina, carregar);
    }

    filtros.addEventListener('change', () => carregar(0));
    filtros.addEventListener('submit', evento => evento.preventDefault());
    botaoLimpar.addEventListener('click', () => {
        filtroStatus.value = '';
        filtroPrioridade.value = '';
        filtroCliente.value = '';
        carregar(0);
    });

    carregar(Number(daUrl.get('page')) || 0);
}

async function iniciarFormularioChamado() {
    const id = document.body.dataset.id;
    const form = document.getElementById('form-chamado');
    const campos = document.getElementById('campos-chamado');
    const botaoSalvar = document.getElementById('botao-salvar');
    const aviso = document.getElementById('aviso-cadastros');
    const conteudo = document.getElementById('conteudo-formulario');
    const campoTecnico = form.elements.namedItem('tecnicoId');

    form.addEventListener('input', evento => evento.target.classList.remove('is-invalid'));
    form.addEventListener('change', evento => evento.target.classList.remove('is-invalid'));
    const atualizarContadores = Ui.contadoresDeCaracteres(form);

    let clientes;
    let categorias;
    let tecnicos;
    let chamado;
    try {
        [clientes, categorias, tecnicos, chamado] = await Promise.all([
            Api.get('/clientes'),
            Api.get('/categorias'),
            campoTecnico ? Api.get('/tecnicos') : [],
            id ? Api.get(`/chamados/${id}`) : null
        ]);
    } catch (erro) {
        Ui.mostrarFalha(conteudo, erro);
        return;
    }

    if (chamado && chamado.status === 'FECHADO') {
        conteudo.innerHTML = `
            <div class="card-body p-4">
                <div class="alert alert-secondary d-flex gap-3 align-items-center mb-0" role="status">
                    <i class="bi bi-lock-fill fs-4"></i>
                    <div>
                        Este chamado está fechado e não pode mais ser editado.
                        <a href="/app/chamados/${chamado.id}">Voltar ao chamado</a>
                    </div>
                </div>
            </div>`;
        return;
    }

    const clienteDaUrl = new URLSearchParams(window.location.search).get('clienteId');
    Ui.preencherSelect(form.elements.clienteId, clientes, {
        vazio: 'Selecione...',
        rotulo: c => `${c.nome} (${c.email})`,
        valor: chamado ? chamado.cliente.id : clienteDaUrl
    });
    Ui.preencherSelect(form.elements.categoriaId, categorias, {
        vazio: 'Selecione...',
        valor: chamado && chamado.categoria.id
    });
    if (campoTecnico) {
        Ui.preencherSelect(campoTecnico, tecnicos, { vazio: 'Sem técnico por enquanto' });
    }
    if (chamado) {
        form.elements.titulo.value = chamado.titulo;
        form.elements.descricao.value = chamado.descricao;
        form.elements.prioridade.value = chamado.prioridade;
        atualizarContadores();
    }

    const faltando = [];
    if (clientes.length === 0) {
        faltando.push('<a href="/app/clientes/novo">cadastre um cliente</a>');
    }
    if (categorias.length === 0) {
        faltando.push('<a href="/app/categorias/novo">cadastre uma categoria</a>');
    }
    if (faltando.length > 0) {
        aviso.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>Para abrir um chamado, primeiro ${faltando.join(' e ')}.`;
        aviso.classList.remove('d-none');
        return;
    }

    campos.disabled = false;
    form.elements.titulo.focus();

    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        Ui.limparErros(form);
        const dados = {
            titulo: form.elements.titulo.value.trim(),
            descricao: form.elements.descricao.value.trim(),
            prioridade: form.elements.prioridade.value || null,
            clienteId: Ui.idSelecionado(form.elements.clienteId),
            categoriaId: Ui.idSelecionado(form.elements.categoriaId),
            tecnicoId: campoTecnico ? Ui.idSelecionado(campoTecnico) : null
        };

        Ui.carregando(botaoSalvar, true);
        try {
            const salvo = id
                ? await Api.put(`/chamados/${id}`, dados)
                : await Api.post('/chamados', dados);
            Ui.notificarNaProximaPagina(id ? 'Chamado atualizado com sucesso.' : `Chamado #${salvo.id} aberto com sucesso.`);
            window.location.href = `/app/chamados/${salvo.id}`;
        } catch (erro) {
            Ui.mostrarErros(form, erro);
            Ui.carregando(botaoSalvar, false);
        }
    });
}

async function iniciarDetalheChamado() {
    const id = document.body.dataset.id;

    let chamado;
    let tecnicos;
    try {
        [chamado, tecnicos] = await Promise.all([Api.get(`/chamados/${id}`), Api.get('/tecnicos')]);
    } catch (erro) {
        Ui.mostrarFalha(document.getElementById('conteudo-chamado'), erro);
        return;
    }

    const formStatus = document.getElementById('form-status');
    const selectStatus = document.getElementById('novo-status');
    const botaoStatus = document.getElementById('botao-status');
    const formTecnico = document.getElementById('form-tecnico');
    const selectTecnico = document.getElementById('novo-tecnico');
    const botaoTecnico = document.getElementById('botao-tecnico');
    const formComentario = document.getElementById('form-comentario');
    const botaoComentar = document.getElementById('botao-comentar');

    function atualizarBotoes() {
        botaoStatus.disabled = selectStatus.value === chamado.status;
        const tecnicoAtual = chamado.tecnico ? String(chamado.tecnico.id) : '';
        botaoTecnico.disabled = tecnicos.length === 0 || selectTecnico.value === '' || selectTecnico.value === tecnicoAtual;
    }

    function renderizar() {
        const fechado = chamado.status === 'FECHADO';
        document.title = `#${chamado.id} ${chamado.titulo} · Sistema de Chamados`;
        document.getElementById('chamado-titulo').textContent = chamado.titulo;
        document.getElementById('chamado-badges').innerHTML = `
            <span class="text-body-secondary fw-medium">#${chamado.id}</span>
            ${Ui.badgeStatus(chamado.status)}
            ${Ui.badgePrioridade(chamado.prioridade)}`;
        document.getElementById('chamado-resumo').innerHTML =
            `Aberto por <strong>${Ui.escapar(chamado.cliente.nome)}</strong> em ${Ui.formatarData(chamado.dataAbertura)}`;
        document.getElementById('chamado-descricao').textContent = chamado.descricao;

        document.getElementById('info-cliente').innerHTML = `
            <a class="text-decoration-none" href="/app/clientes/${chamado.cliente.id}">${Ui.escapar(chamado.cliente.nome)}</a>
            <div class="small text-body-secondary">${Ui.escapar(chamado.cliente.email)}</div>`;
        document.getElementById('info-categoria').textContent = chamado.categoria.nome;
        document.getElementById('info-tecnico').innerHTML = chamado.tecnico
            ? `${Ui.escapar(chamado.tecnico.nome)}<div class="small text-body-secondary">${Ui.escapar(chamado.tecnico.email)}</div>`
            : '<span class="text-body-tertiary">Não atribuído</span>';
        document.getElementById('info-abertura').textContent = Ui.formatarData(chamado.dataAbertura);
        document.getElementById('info-fechamento').textContent = Ui.formatarData(chamado.dataFechamento);

        document.getElementById('botao-editar').classList.toggle('d-none', fechado);
        document.getElementById('area-atendimento').classList.toggle('d-none', fechado);
        document.getElementById('area-novo-comentario').classList.toggle('d-none', fechado);
        document.getElementById('aviso-fechado').classList.toggle('d-none', !fechado);
        document.getElementById('aviso-fechado-texto').textContent =
            `Chamado fechado em ${Ui.formatarData(chamado.dataFechamento)}. Ele não pode mais ser alterado nem receber comentários.`;

        selectStatus.value = chamado.status;
        Ui.preencherSelect(selectTecnico, tecnicos, {
            vazio: 'Selecione um técnico',
            valor: chamado.tecnico && chamado.tecnico.id
        });
        selectTecnico.disabled = tecnicos.length === 0;
        document.getElementById('sem-tecnicos').classList.toggle('d-none', tecnicos.length > 0);
        atualizarBotoes();
        renderizarComentarios();
    }

    function renderizarComentarios() {
        const comentarios = chamado.comentarios;
        document.getElementById('total-comentarios').textContent = comentarios.length;
        document.getElementById('comentarios-vazio').classList.toggle('d-none', comentarios.length > 0);
        document.getElementById('lista-comentarios').innerHTML = comentarios.map(c => `
            <div class="comentario d-flex gap-3 px-4 py-3">
                <span class="avatar" aria-hidden="true">${Ui.escapar(Ui.iniciais(c.autor))}</span>
                <div class="flex-grow-1">
                    <div class="d-flex flex-wrap justify-content-between column-gap-2">
                        <span class="fw-medium">${Ui.escapar(c.autor)}</span>
                        <small class="text-body-secondary">${Ui.formatarData(c.data)}</small>
                    </div>
                    <div class="texto-livre mt-1">${Ui.escapar(c.texto)}</div>
                </div>
            </div>`).join('');
    }

    function aplicar(resposta) {
        chamado = { ...resposta, comentarios: chamado.comentarios };
        renderizar();
    }

    selectStatus.addEventListener('change', atualizarBotoes);
    selectTecnico.addEventListener('change', atualizarBotoes);

    formStatus.addEventListener('submit', async evento => {
        evento.preventDefault();
        const novoStatus = selectStatus.value;
        if (novoStatus === 'FECHADO') {
            const confirmado = await Ui.confirmar(
                'Fechar o chamado? Depois de fechado, ele não poderá mais ser alterado nem receber comentários.',
                { titulo: 'Fechar chamado', botao: 'Fechar chamado', cor: 'primary' });
            if (!confirmado) {
                return;
            }
        }
        Ui.carregando(botaoStatus, true, 'Alterando...');
        try {
            aplicar(await Api.patch(`/chamados/${id}/status`, { status: novoStatus }));
            Ui.notificar(`Status alterado para "${Ui.STATUS[novoStatus].rotulo}".`);
        } catch (erro) {
            Ui.notificar(erro.message, 'danger');
        }
        Ui.carregando(botaoStatus, false);
        atualizarBotoes();
    });

    formTecnico.addEventListener('submit', async evento => {
        evento.preventDefault();
        const tecnicoId = Ui.idSelecionado(selectTecnico);
        Ui.carregando(botaoTecnico, true, 'Atribuindo...');
        try {
            aplicar(await Api.patch(`/chamados/${id}/atribuir`, { tecnicoId }));
            Ui.notificar(`Chamado atribuído a ${chamado.tecnico.nome}.`);
        } catch (erro) {
            Ui.notificar(erro.message, 'danger');
        }
        Ui.carregando(botaoTecnico, false);
        atualizarBotoes();
    });

    formComentario.elements.autor.value = localStorage.getItem('autorComentario') || '';
    formComentario.addEventListener('input', evento => evento.target.classList.remove('is-invalid'));
    const atualizarContador = Ui.contadoresDeCaracteres(formComentario);

    formComentario.addEventListener('submit', async evento => {
        evento.preventDefault();
        Ui.limparErros(formComentario);
        const dados = {
            autor: formComentario.elements.autor.value.trim(),
            texto: formComentario.elements.texto.value.trim()
        };
        Ui.carregando(botaoComentar, true, 'Enviando...');
        try {
            const comentario = await Api.post(`/chamados/${id}/comentarios`, dados);
            chamado.comentarios.push(comentario);
            renderizarComentarios();
            formComentario.elements.texto.value = '';
            atualizarContador();
            localStorage.setItem('autorComentario', dados.autor);
            Ui.notificar('Comentário adicionado.');
        } catch (erro) {
            Ui.mostrarErros(formComentario, erro);
        }
        Ui.carregando(botaoComentar, false);
    });

    document.getElementById('botao-excluir').addEventListener('click', async () => {
        const confirmado = await Ui.confirmar(
            `Excluir o chamado #${chamado.id} "${chamado.titulo}"? Os comentários dele também serão excluídos.`);
        if (!confirmado) {
            return;
        }
        try {
            await Api.excluir(`/chamados/${id}`);
            Ui.notificarNaProximaPagina('Chamado excluído com sucesso.');
            window.location.href = '/app/chamados';
        } catch (erro) {
            Ui.notificar(erro.message, 'danger');
        }
    });

    renderizar();
}
