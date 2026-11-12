'use strict';

class ErroApi extends Error {
    constructor(mensagem, status, detalhes) {
        super(mensagem);
        this.status = status;
        this.detalhes = detalhes || [];
    }
}

const Api = {
    async requisitar(metodo, url, corpo) {
        const opcoes = { method: metodo, headers: { Accept: 'application/json' } };
        if (corpo !== undefined) {
            opcoes.headers['Content-Type'] = 'application/json';
            opcoes.body = JSON.stringify(corpo);
        }

        let resposta;
        try {
            resposta = await fetch(url, opcoes);
        } catch (e) {
            throw new ErroApi('Não foi possível conectar ao servidor. Verifique se a aplicação está rodando.');
        }

        if (resposta.status === 204) {
            return null;
        }
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new ErroApi(dados.erro || `Erro ${resposta.status}`, resposta.status, dados.detalhes);
        }
        return dados;
    },

    get(url) {
        return this.requisitar('GET', url);
    },

    post(url, corpo) {
        return this.requisitar('POST', url, corpo);
    },

    put(url, corpo) {
        return this.requisitar('PUT', url, corpo);
    },

    patch(url, corpo) {
        return this.requisitar('PATCH', url, corpo);
    },

    excluir(url) {
        return this.requisitar('DELETE', url);
    }
};

const Ui = {
    STATUS: {
        ABERTO: { rotulo: 'Aberto', cor: 'primary' },
        EM_ATENDIMENTO: { rotulo: 'Em atendimento', cor: 'warning' },
        AGUARDANDO_CLIENTE: { rotulo: 'Aguardando cliente', cor: 'info' },
        FECHADO: { rotulo: 'Fechado', cor: 'secondary' }
    },

    PRIORIDADE: {
        BAIXA: { rotulo: 'Baixa', cor: 'success' },
        MEDIA: { rotulo: 'Média', cor: 'info' },
        ALTA: { rotulo: 'Alta', cor: 'warning' },
        CRITICA: { rotulo: 'Crítica', cor: 'danger' }
    },

    PERFIL: {
        ADMIN: { rotulo: 'Administrador', cor: 'primary' },
        TECNICO: { rotulo: 'Técnico', cor: 'secondary' }
    },

    escapar(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    },

    formatarData(iso) {
        if (!iso) {
            return '—';
        }
        const data = new Date(iso);
        if (Number.isNaN(data.getTime())) {
            return iso;
        }
        return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    },

    iniciais(nome) {
        const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
        if (partes.length === 0) {
            return '?';
        }
        const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
        return (partes[0][0] + ultima).toUpperCase();
    },

    badge(mapa, valor) {
        const item = mapa[valor] || { rotulo: valor, cor: 'secondary' };
        return `<span class="badge rounded-pill text-bg-${item.cor}">${Ui.escapar(item.rotulo)}</span>`;
    },

    badgeStatus(status) {
        return Ui.badge(Ui.STATUS, status);
    },

    badgePrioridade(prioridade) {
        return Ui.badge(Ui.PRIORIDADE, prioridade);
    },

    badgePerfil(perfil) {
        return Ui.badge(Ui.PERFIL, perfil);
    },

    contar(quantidade, singular, plural) {
        return `${quantidade} ${quantidade === 1 ? singular : plural}`;
    },

    preencherSelect(select, itens, { rotulo = item => item.nome, vazio, valor } = {}) {
        select.innerHTML = '';
        if (vazio !== undefined) {
            select.add(new Option(vazio, ''));
        }
        itens.forEach(item => select.add(new Option(rotulo(item), item.id)));
        if (valor !== undefined && valor !== null) {
            select.value = String(valor);
        }
    },

    idSelecionado(select) {
        return select.value === '' ? null : Number(select.value);
    },

    notificar(mensagem, tipo = 'success') {
        const area = document.getElementById('area-notificacoes');
        if (!area) {
            return;
        }
        const icone = tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
        const elemento = document.createElement('div');
        elemento.className = `toast align-items-center text-bg-${tipo} border-0`;
        elemento.setAttribute('role', tipo === 'danger' ? 'alert' : 'status');
        elemento.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><i class="bi ${icone} me-2"></i>${Ui.escapar(mensagem)}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>`;
        area.appendChild(elemento);
        elemento.addEventListener('hidden.bs.toast', () => elemento.remove());
        new bootstrap.Toast(elemento, { delay: 4000 }).show();
    },

    notificarNaProximaPagina(mensagem, tipo = 'success') {
        sessionStorage.setItem('notificacao', JSON.stringify({ mensagem, tipo }));
    },

    exibirNotificacaoGuardada() {
        const guardada = sessionStorage.getItem('notificacao');
        if (guardada) {
            sessionStorage.removeItem('notificacao');
            const { mensagem, tipo } = JSON.parse(guardada);
            Ui.notificar(mensagem, tipo);
        }
    },

    confirmar(mensagem, { titulo = 'Confirmar exclusão', botao = 'Excluir', cor = 'danger' } = {}) {
        const modalElemento = document.getElementById('modal-confirmacao');
        const botaoOk = document.getElementById('modal-confirmacao-ok');
        document.getElementById('modal-confirmacao-titulo').textContent = titulo;
        document.getElementById('modal-confirmacao-mensagem').textContent = mensagem;
        botaoOk.textContent = botao;
        botaoOk.className = `btn btn-${cor}`;
        const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);

        return new Promise(resolve => {
            let confirmado = false;
            const aoConfirmar = () => {
                confirmado = true;
                modal.hide();
            };
            botaoOk.addEventListener('click', aoConfirmar, { once: true });
            modalElemento.addEventListener('hidden.bs.modal', () => {
                botaoOk.removeEventListener('click', aoConfirmar);
                resolve(confirmado);
            }, { once: true });
            modal.show();
        });
    },

    mostrarFalha(container, erro) {
        const titulo = erro.status === 404 ? 'Registro não encontrado' : 'Não foi possível carregar os dados';
        container.innerHTML = `
            <div class="alert alert-danger d-flex gap-3 align-items-start" role="alert">
                <i class="bi bi-exclamation-octagon-fill fs-4"></i>
                <div><strong>${titulo}</strong><div>${Ui.escapar(erro.message)}</div></div>
            </div>`;
    },

    limparErros(form) {
        form.querySelectorAll('.is-invalid').forEach(campo => campo.classList.remove('is-invalid'));
        const alerta = form.querySelector('.alerta-formulario');
        if (alerta) {
            alerta.classList.add('d-none');
            alerta.textContent = '';
        }
    },

    mostrarErros(form, erro) {
        Ui.limparErros(form);
        let marcouCampo = false;
        erro.detalhes.forEach(detalhe => {
            const separador = detalhe.indexOf(': ');
            if (separador < 0) {
                return;
            }
            const nomeCampo = detalhe.slice(0, separador);
            const campo = form.elements.namedItem(nomeCampo);
            const feedback = form.querySelector(`[data-erro-de="${nomeCampo}"]`);
            if (campo && feedback) {
                campo.classList.add('is-invalid');
                feedback.textContent = detalhe.slice(separador + 2);
                marcouCampo = true;
            }
        });

        const alerta = form.querySelector('.alerta-formulario');
        if (!marcouCampo && alerta) {
            alerta.textContent = erro.message;
            alerta.classList.remove('d-none');
        }
    },

    contadoresDeCaracteres(form) {
        const atualizar = () => form.querySelectorAll('[data-contador-de]').forEach(contador => {
            const campo = form.elements.namedItem(contador.dataset.contadorDe);
            contador.textContent = `${campo.value.length}/${campo.maxLength}`;
        });
        form.addEventListener('input', atualizar);
        atualizar();
        return atualizar;
    },

    carregando(botao, ativo, texto = 'Salvando...') {
        if (ativo) {
            botao.dataset.conteudoOriginal = botao.innerHTML;
            botao.disabled = true;
            botao.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${texto}`;
        } else {
            botao.disabled = false;
            if (botao.dataset.conteudoOriginal) {
                botao.innerHTML = botao.dataset.conteudoOriginal;
            }
        }
    },

    paginacao(container, pagina, aoMudar) {
        container.innerHTML = '';
        if (pagina.totalElementos === 0) {
            return;
        }

        const inicio = pagina.pagina * pagina.tamanho + 1;
        const fim = inicio + pagina.conteudo.length - 1;
        const resumo = document.createElement('small');
        resumo.className = 'text-body-secondary';
        resumo.textContent = `Mostrando ${inicio}–${fim} de ${pagina.totalElementos}`;
        container.appendChild(resumo);

        if (pagina.totalPaginas <= 1) {
            return;
        }

        const lista = document.createElement('ul');
        lista.className = 'pagination pagination-sm mb-0';
        const adicionar = (rotulo, destino, desabilitado, ativo, descricao) => {
            const item = document.createElement('li');
            item.className = 'page-item' + (desabilitado ? ' disabled' : '') + (ativo ? ' active' : '');
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'page-link';
            botao.textContent = rotulo;
            if (descricao) {
                botao.setAttribute('aria-label', descricao);
            }
            if (ativo) {
                botao.setAttribute('aria-current', 'page');
            }
            if (!desabilitado && !ativo) {
                botao.addEventListener('click', () => aoMudar(destino));
            }
            item.appendChild(botao);
            lista.appendChild(item);
        };

        const atual = pagina.pagina;
        const ultima = pagina.totalPaginas - 1;
        adicionar('«', atual - 1, atual === 0, false, 'Página anterior');
        for (let i = Math.max(0, atual - 2); i <= Math.min(ultima, atual + 2); i++) {
            adicionar(String(i + 1), i, false, i === atual);
        }
        adicionar('»', atual + 1, atual >= ultima, false, 'Próxima página');

        const navegacao = document.createElement('nav');
        navegacao.setAttribute('aria-label', 'Paginação');
        navegacao.appendChild(lista);
        container.appendChild(navegacao);
    }
};

document.addEventListener('DOMContentLoaded', Ui.exibirNotificacaoGuardada);
