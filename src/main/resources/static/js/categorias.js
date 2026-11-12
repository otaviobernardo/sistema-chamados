'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const telas = {
        'categorias-lista': iniciarListaCategorias,
        'categorias-form': iniciarFormularioCategoria
    };
    const iniciar = telas[document.body.dataset.pagina];
    if (iniciar) {
        iniciar();
    }
});

async function iniciarListaCategorias() {
    const busca = document.getElementById('busca-categorias');
    const corpoTabela = document.getElementById('tabela-categorias');
    const areaTabela = document.getElementById('area-tabela-categorias');
    const contador = document.getElementById('contador-categorias');
    const vazio = document.getElementById('categorias-vazio');
    let categorias = [];

    function renderizar() {
        const termo = busca.value.trim().toLowerCase();
        const filtradas = categorias.filter(c =>
            [c.nome, c.descricao].some(valor => (valor || '').toLowerCase().includes(termo)));

        contador.textContent = termo
            ? `${filtradas.length} de ${categorias.length} categorias`
            : Ui.contar(categorias.length, 'categoria', 'categorias');

        const semResultado = filtradas.length === 0;
        areaTabela.classList.toggle('d-none', semResultado);
        vazio.classList.toggle('d-none', !semResultado);
        if (semResultado) {
            document.getElementById('categorias-vazio-mensagem').textContent = categorias.length === 0
                ? 'Nenhuma categoria cadastrada ainda.'
                : 'Nenhuma categoria encontrada para a busca.';
            document.getElementById('categorias-vazio-botao').classList.toggle('d-none', categorias.length > 0);
            return;
        }

        corpoTabela.innerHTML = filtradas.map(c => `
            <tr>
                <td>
                    <span class="fw-medium">${Ui.escapar(c.nome)}</span>
                    <span class="d-block d-sm-none small text-body-secondary">${Ui.escapar(c.descricao)}</span>
                </td>
                <td class="d-none d-sm-table-cell text-body-secondary">
                    ${c.descricao ? Ui.escapar(c.descricao) : '<span class="text-body-tertiary">—</span>'}
                </td>
                <td class="text-end text-nowrap">
                    <a class="btn btn-sm btn-outline-primary" href="/app/categorias/${c.id}/editar"
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
        const categoria = categorias.find(c => String(c.id) === botao.dataset.excluir);
        if (!categoria) {
            return;
        }
        const confirmado = await Ui.confirmar(
            `Excluir a categoria "${categoria.nome}"? Esta ação não pode ser desfeita.`);
        if (!confirmado) {
            return;
        }
        try {
            await Api.excluir(`/categorias/${categoria.id}`);
            categorias = categorias.filter(c => c.id !== categoria.id);
            renderizar();
            Ui.notificar('Categoria excluída com sucesso.');
        } catch (erro) {
            Ui.notificar(erro.message, 'danger');
        }
    });

    try {
        categorias = await Api.get('/categorias');
        renderizar();
    } catch (erro) {
        Ui.mostrarFalha(document.getElementById('conteudo-categorias'), erro);
    }
}

async function iniciarFormularioCategoria() {
    const id = document.body.dataset.id;
    const form = document.getElementById('form-categoria');
    const campos = document.getElementById('campos-categoria');
    const botaoSalvar = document.getElementById('botao-salvar');

    form.addEventListener('input', evento => evento.target.classList.remove('is-invalid'));
    const atualizarContadores = Ui.contadoresDeCaracteres(form);

    if (id) {
        try {
            const categoria = await Api.get(`/categorias/${id}`);
            form.elements.nome.value = categoria.nome;
            form.elements.descricao.value = categoria.descricao ?? '';
            atualizarContadores();
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
            descricao: form.elements.descricao.value.trim() || null
        };

        Ui.carregando(botaoSalvar, true);
        try {
            if (id) {
                await Api.put(`/categorias/${id}`, dados);
            } else {
                await Api.post('/categorias', dados);
            }
            Ui.notificarNaProximaPagina(id ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.');
            window.location.href = '/app/categorias';
        } catch (erro) {
            Ui.mostrarErros(form, erro);
            Ui.carregando(botaoSalvar, false);
        }
    });
}
