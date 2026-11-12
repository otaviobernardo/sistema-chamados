'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const telas = {
        'tecnicos-lista': iniciarListaTecnicos,
        'tecnicos-form': iniciarFormularioTecnico
    };
    const iniciar = telas[document.body.dataset.pagina];
    if (iniciar) {
        iniciar();
    }
});

async function iniciarListaTecnicos() {
    const busca = document.getElementById('busca-tecnicos');
    const corpoTabela = document.getElementById('tabela-tecnicos');
    const areaTabela = document.getElementById('area-tabela-tecnicos');
    const contador = document.getElementById('contador-tecnicos');
    const vazio = document.getElementById('tecnicos-vazio');
    let tecnicos = [];

    function renderizar() {
        const termo = busca.value.trim().toLowerCase();
        const filtrados = tecnicos.filter(t =>
            [t.nome, t.email].some(valor => (valor || '').toLowerCase().includes(termo)));

        contador.textContent = termo
            ? `${filtrados.length} de ${tecnicos.length} técnicos`
            : Ui.contar(tecnicos.length, 'técnico', 'técnicos');

        const semResultado = filtrados.length === 0;
        areaTabela.classList.toggle('d-none', semResultado);
        vazio.classList.toggle('d-none', !semResultado);
        if (semResultado) {
            document.getElementById('tecnicos-vazio-mensagem').textContent = tecnicos.length === 0
                ? 'Nenhum técnico cadastrado ainda.'
                : 'Nenhum técnico encontrado para a busca.';
            document.getElementById('tecnicos-vazio-botao').classList.toggle('d-none', tecnicos.length > 0);
            return;
        }

        corpoTabela.innerHTML = filtrados.map(t => `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span class="avatar" aria-hidden="true">${Ui.escapar(Ui.iniciais(t.nome))}</span>
                        <span>
                            <span class="fw-medium">${Ui.escapar(t.nome)}</span>
                            <span class="d-block d-sm-none small text-body-secondary">${Ui.escapar(t.email)}</span>
                            <span class="d-block d-md-none mt-1">${Ui.badgePerfil(t.perfil)}</span>
                        </span>
                    </div>
                </td>
                <td class="d-none d-sm-table-cell">${Ui.escapar(t.email)}</td>
                <td class="d-none d-md-table-cell">${Ui.badgePerfil(t.perfil)}</td>
                <td class="text-end text-nowrap">
                    <a class="btn btn-sm btn-outline-primary" href="/app/tecnicos/${t.id}/editar"
                       title="Editar" aria-label="Editar ${Ui.escapar(t.nome)}">
                        <i class="bi bi-pencil"></i>
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${t.id}"
                            title="Excluir" aria-label="Excluir ${Ui.escapar(t.nome)}">
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
        const tecnico = tecnicos.find(t => String(t.id) === botao.dataset.excluir);
        if (!tecnico) {
            return;
        }
        const confirmado = await Ui.confirmar(
            `Excluir o técnico "${tecnico.nome}"? Esta ação não pode ser desfeita.`);
        if (!confirmado) {
            return;
        }
        try {
            await Api.excluir(`/tecnicos/${tecnico.id}`);
            tecnicos = tecnicos.filter(t => t.id !== tecnico.id);
            renderizar();
            Ui.notificar('Técnico excluído com sucesso.');
        } catch (erro) {
            Ui.notificar(erro.message, 'danger');
        }
    });

    try {
        tecnicos = await Api.get('/tecnicos');
        renderizar();
    } catch (erro) {
        Ui.mostrarFalha(document.getElementById('conteudo-tecnicos'), erro);
    }
}

async function iniciarFormularioTecnico() {
    const id = document.body.dataset.id;
    const form = document.getElementById('form-tecnico');
    const campos = document.getElementById('campos-tecnico');
    const botaoSalvar = document.getElementById('botao-salvar');

    form.addEventListener('input', evento => evento.target.classList.remove('is-invalid'));
    form.addEventListener('change', evento => evento.target.classList.remove('is-invalid'));

    if (id) {
        try {
            const tecnico = await Api.get(`/tecnicos/${id}`);
            form.elements.nome.value = tecnico.nome;
            form.elements.email.value = tecnico.email;
            form.elements.perfil.value = tecnico.perfil;
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
            perfil: form.elements.perfil.value || null
        };

        Ui.carregando(botaoSalvar, true);
        try {
            if (id) {
                await Api.put(`/tecnicos/${id}`, dados);
            } else {
                await Api.post('/tecnicos', dados);
            }
            Ui.notificarNaProximaPagina(id ? 'Técnico atualizado com sucesso.' : 'Técnico cadastrado com sucesso.');
            window.location.href = '/app/tecnicos';
        } catch (erro) {
            Ui.mostrarErros(form, erro);
            Ui.carregando(botaoSalvar, false);
        }
    });
}
