'use strict';

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.pagina === 'dashboard') {
        iniciarDashboard();
    }
});

const ICONES_STATUS = {
    ABERTO: 'bi-envelope-open',
    EM_ATENDIMENTO: 'bi-tools',
    AGUARDANDO_CLIENTE: 'bi-hourglass-split',
    FECHADO: 'bi-check2-circle'
};

async function contarChamados(filtros = {}) {
    const parametros = new URLSearchParams({ ...filtros, size: 1 });
    const pagina = await Api.get(`/chamados?${parametros}`);
    return pagina.totalElementos;
}

async function iniciarDashboard() {
    const status = Object.keys(Ui.STATUS);
    const prioridades = Object.keys(Ui.PRIORIDADE);

    let total;
    let porStatus;
    let porPrioridade;
    let recentes;
    let cadastros;
    try {
        [total, porStatus, porPrioridade, recentes, cadastros] = await Promise.all([
            contarChamados(),
            Promise.all(status.map(s => contarChamados({ status: s }))),
            Promise.all(prioridades.map(p => contarChamados({ prioridade: p }))),
            Api.get('/chamados?size=5&sort=dataAbertura,desc'),
            Promise.all(['/clientes', '/categorias', '/tecnicos'].map(url => Api.get(url)))
        ]);
    } catch (erro) {
        Ui.mostrarFalha(document.getElementById('conteudo-dashboard'), erro);
        return;
    }

    document.getElementById('resumo-total').textContent =
        `Visão geral dos chamados · ${Ui.contar(total, 'chamado', 'chamados')} no total`;

    document.getElementById('cartoes-status').innerHTML = status.map((s, i) => {
        const { rotulo, cor } = Ui.STATUS[s];
        return `
            <div class="col-6 col-lg-3">
                <a class="card indicador" href="/app/chamados?status=${s}" title="Ver chamados com status ${rotulo}">
                    <div class="card-body d-flex align-items-center gap-3">
                        <span class="icone bg-${cor}-subtle text-${cor}-emphasis" aria-hidden="true">
                            <i class="bi ${ICONES_STATUS[s]}"></i>
                        </span>
                        <div>
                            <div class="valor">${porStatus[i]}</div>
                            <div class="rotulo">${rotulo}</div>
                        </div>
                    </div>
                </a>
            </div>`;
    }).join('');

    const barras = document.getElementById('barras-prioridade');
    if (total === 0) {
        barras.innerHTML = '<p class="text-body-secondary text-center mb-0">Ainda não há chamados para mostrar.</p>';
    } else {
        barras.innerHTML = prioridades.map((p, i) => {
            const { rotulo, cor } = Ui.PRIORIDADE[p];
            const quantidade = porPrioridade[i];
            const percentual = Math.round((quantidade / total) * 100);
            return `
                <a class="text-reset text-decoration-none" href="/app/chamados?prioridade=${p}"
                   title="${rotulo}: ${Ui.contar(quantidade, 'chamado', 'chamados')} (${percentual}%)">
                    <div class="d-flex justify-content-between small mb-1">
                        <span class="fw-medium">${rotulo}</span>
                        <span class="text-body-secondary">${quantidade} · ${percentual}%</span>
                    </div>
                    <div class="barra-trilho" role="progressbar" aria-label="${rotulo}"
                         aria-valuenow="${percentual}" aria-valuemin="0" aria-valuemax="100">
                        <div class="barra-preenchimento bg-${cor}" style="width: ${percentual}%"></div>
                    </div>
                </a>`;
        }).join('');
    }

    const semRecentes = recentes.conteudo.length === 0;
    document.getElementById('area-recentes').classList.toggle('d-none', semRecentes);
    document.getElementById('recentes-vazio').classList.toggle('d-none', !semRecentes);
    document.getElementById('tabela-recentes').innerHTML = recentes.conteudo.map(ch => `
        <tr>
            <td>
                <a class="fw-medium text-decoration-none" href="/app/chamados/${ch.id}">${Ui.escapar(ch.titulo)}</a>
                <span class="d-block d-md-none small text-body-secondary">${Ui.escapar(ch.cliente.nome)}</span>
            </td>
            <td class="d-none d-md-table-cell">${Ui.escapar(ch.cliente.nome)}</td>
            <td>${Ui.badgeStatus(ch.status)}</td>
            <td class="d-none d-sm-table-cell text-nowrap">${Ui.formatarData(ch.dataAbertura)}</td>
        </tr>`).join('');

    const [clientes, categorias, tecnicos] = cadastros;
    const itens = [
        { url: '/app/clientes', icone: 'bi-people', valor: clientes.length, rotulo: 'Clientes' },
        { url: '/app/categorias', icone: 'bi-tags', valor: categorias.length, rotulo: 'Categorias' },
        { url: '/app/tecnicos', icone: 'bi-person-gear', valor: tecnicos.length, rotulo: 'Técnicos' }
    ];
    document.getElementById('cartoes-cadastros').innerHTML = itens.map(item => `
        <div class="col-12 col-sm-4">
            <a class="card indicador" href="${item.url}">
                <div class="card-body d-flex align-items-center gap-3">
                    <span class="icone bg-primary-subtle text-primary-emphasis" aria-hidden="true">
                        <i class="bi ${item.icone}"></i>
                    </span>
                    <div>
                        <div class="valor">${item.valor}</div>
                        <div class="rotulo">${item.rotulo}</div>
                    </div>
                </div>
            </a>
        </div>`).join('');
}
