package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import br.com.sistemas.chamados.entity.Categoria;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Cliente;
import br.com.sistemas.chamados.entity.Comentario;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.entity.Tecnico;

@DataJpaTest
class ChamadoRepositoryTest {

    @Autowired
    private ChamadoRepository repository;

    @Autowired
    private ComentarioRepository comentarioRepository;

    @Autowired
    private TestEntityManager em;

    private Cliente ana;
    private Cliente joao;
    private Categoria hardware;
    private Tecnico carlos;

    @BeforeEach
    void preparar() {
        ana = em.persist(new Cliente("Ana Souza", "ana@exemplo.com", null));
        joao = em.persist(new Cliente("Joao Silva", "joao@exemplo.com", null));
        hardware = em.persist(new Categoria("Hardware", null));
        carlos = em.persist(new Tecnico("Carlos Lima", "carlos@exemplo.com", Perfil.TECNICO));
    }

    private Chamado chamado(String titulo, Prioridade prioridade, StatusChamado status,
        Cliente cliente, Tecnico tecnico) {
        return em.persist(new Chamado(titulo, "Descricao", prioridade, status,
            LocalDateTime.now(), cliente, hardware, tecnico));
    }

    @Test
    void salvaChamadoComClienteCategoriaETecnico() {
        Chamado salvo = chamado("Impressora", Prioridade.ALTA, StatusChamado.ABERTO, ana, carlos);
        em.flush();
        em.clear();

        Chamado lido = repository.findById(salvo.getId()).orElseThrow();

        assertThat(lido.getCliente().getNome()).isEqualTo("Ana Souza");
        assertThat(lido.getCategoria().getNome()).isEqualTo("Hardware");
        assertThat(lido.getTecnico().getNome()).isEqualTo("Carlos Lima");
        assertThat(lido.getStatus()).isEqualTo(StatusChamado.ABERTO);
    }

    @Test
    void buscaPorIdInexistenteRetornaVazio() {
        assertThat(repository.findById(99999L)).isEmpty();
    }

    @Test
    void existsByIndicaSeOcadastroTemChamados() {
        chamado("Impressora", Prioridade.ALTA, StatusChamado.ABERTO, ana, carlos);

        assertThat(repository.existsByClienteId(ana.getId())).isTrue();
        assertThat(repository.existsByClienteId(joao.getId())).isFalse();
        assertThat(repository.existsByCategoriaId(hardware.getId())).isTrue();
        assertThat(repository.existsByTecnicoId(carlos.getId())).isTrue();
    }

    @Test
    void filtrarPorStatusPrioridadeEClienteSozinhosOuCombinados() {
        chamado("Impressora", Prioridade.ALTA, StatusChamado.ABERTO, ana, null);
        chamado("Mouse", Prioridade.BAIXA, StatusChamado.EM_ATENDIMENTO, ana, null);
        chamado("Rede", Prioridade.ALTA, StatusChamado.ABERTO, joao, null);
        Pageable pagina = PageRequest.of(0, 10);

        assertThat(repository.filtrar(null, null, null, pagina).getTotalElements()).isEqualTo(3);
        assertThat(repository.filtrar(StatusChamado.ABERTO, null, null, pagina).getTotalElements())
            .isEqualTo(2);
        assertThat(repository.filtrar(null, Prioridade.ALTA, null, pagina).getTotalElements())
            .isEqualTo(2);
        assertThat(repository.filtrar(null, null, ana.getId(), pagina).getTotalElements())
            .isEqualTo(2);
        assertThat(repository.filtrar(StatusChamado.ABERTO, Prioridade.ALTA, joao.getId(), pagina)
            .getContent()).extracting(Chamado::getTitulo).containsExactly("Rede");
        assertThat(repository.filtrar(StatusChamado.FECHADO, null, null, pagina).getContent())
            .isEmpty();
    }

    @Test
    void filtrarPaginaEOrdena() {
        chamado("C", Prioridade.MEDIA, StatusChamado.ABERTO, ana, null);
        chamado("A", Prioridade.MEDIA, StatusChamado.ABERTO, ana, null);
        chamado("B", Prioridade.MEDIA, StatusChamado.ABERTO, ana, null);

        Page<Chamado> primeira = repository.filtrar(null, null, null,
            PageRequest.of(0, 2, Sort.by("titulo")));

        assertThat(primeira.getTotalElements()).isEqualTo(3);
        assertThat(primeira.getTotalPages()).isEqualTo(2);
        assertThat(primeira.getContent()).extracting(Chamado::getTitulo).containsExactly("A", "B");
    }

    @Test
    void comentariosVemEmOrdemEExcluirChamadoApagaSoOsDele() {
        Chamado impressora = chamado("Impressora", Prioridade.ALTA, StatusChamado.ABERTO, ana, null);
        Chamado rede = chamado("Rede", Prioridade.ALTA, StatusChamado.ABERTO, joao, null);
        LocalDateTime agora = LocalDateTime.now();
        em.persist(new Comentario("Segundo", "Ana Souza", agora.plusMinutes(1), impressora));
        em.persist(new Comentario("Primeiro", "Carlos Lima", agora, impressora));
        em.persist(new Comentario("Da rede", "Joao Silva", agora, rede));
        em.flush();
        em.clear();

        Chamado lido = repository.findById(impressora.getId()).orElseThrow();
        assertThat(lido.getComentarios()).extracting(Comentario::getTexto)
            .containsExactly("Primeiro", "Segundo");

        repository.delete(lido);
        em.flush();

        assertThat(comentarioRepository.findAll()).extracting(Comentario::getTexto)
            .containsExactly("Da rede");
    }
}
