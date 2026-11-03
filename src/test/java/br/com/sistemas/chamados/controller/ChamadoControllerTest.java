package br.com.sistemas.chamados.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.AlterarStatusRequest;
import br.com.sistemas.chamados.dto.AtribuirTecnicoRequest;
import br.com.sistemas.chamados.dto.CategoriaResponse;
import br.com.sistemas.chamados.dto.ChamadoDetalheResponse;
import br.com.sistemas.chamados.dto.ChamadoRequest;
import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.dto.ClienteResponse;
import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.dto.PaginaResponse;
import br.com.sistemas.chamados.dto.TecnicoResponse;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.exception.ChamadoFechadoException;
import br.com.sistemas.chamados.exception.ParametroInvalidoException;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.service.ChamadoService;

@WebMvcTest(ChamadoController.class)
class ChamadoControllerTest {

    private static final String CHAMADO_VALIDO = """
        {"titulo": "Impressora parada", "descricao": "Nao imprime", "prioridade": "ALTA",
         "clienteId": 1, "categoriaId": 1}
        """;

    private static final LocalDateTime ABERTURA = LocalDateTime.of(2026, 11, 2, 10, 0);
    private static final ClienteResponse ANA = new ClienteResponse(1L, "Ana Souza", "ana@exemplo.com", null);
    private static final CategoriaResponse HARDWARE = new CategoriaResponse(1L, "Hardware", null);
    private static final TecnicoResponse CARLOS =
        new TecnicoResponse(1L, "Carlos Lima", "carlos@exemplo.com", Perfil.TECNICO);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChamadoService service;

    private static ChamadoResponse chamado(StatusChamado status, TecnicoResponse tecnico) {
        return new ChamadoResponse(1L, "Impressora parada", "Nao imprime", ABERTURA, null,
            Prioridade.ALTA, status, ANA, HARDWARE, tecnico);
    }

    @Test
    void criarRetorna201ComStatusAberto() throws Exception {
        when(service.criar(any(ChamadoRequest.class))).thenReturn(chamado(StatusChamado.ABERTO, null));

        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content(CHAMADO_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/chamados/1"))
            .andExpect(jsonPath("$.status").value("ABERTO"))
            .andExpect(jsonPath("$.cliente.nome").value("Ana Souza"));
    }

    @Test
    void criarSemCamposObrigatoriosRetorna400() throws Exception {
        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value("Dados inválidos"))
            .andExpect(jsonPath("$.detalhes", hasSize(5)));

        verify(service, never()).criar(any());
    }

    @Test
    void criarComClienteInexistenteRetorna404() throws Exception {
        when(service.criar(any(ChamadoRequest.class)))
            .thenThrow(new RecursoNaoEncontradoException("Cliente 1 não encontrado"));

        mockMvc.perform(post("/chamados").contentType(MediaType.APPLICATION_JSON).content(CHAMADO_VALIDO))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.erro").value("Cliente 1 não encontrado"));
    }

    @Test
    void buscarTrazOsComentarios() throws Exception {
        when(service.buscar(1L)).thenReturn(new ChamadoDetalheResponse(1L, "Impressora parada",
            "Nao imprime", ABERTURA, null, Prioridade.ALTA, StatusChamado.ABERTO, ANA, HARDWARE, null,
            List.of(new ComentarioResponse(1L, "Reiniciei a impressora", "Carlos Lima", ABERTURA))));

        mockMvc.perform(get("/chamados/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.comentarios", hasSize(1)))
            .andExpect(jsonPath("$.comentarios[0].autor").value("Carlos Lima"));
    }

    @Test
    void buscarIdInexistenteRetorna404() throws Exception {
        when(service.buscar(99L)).thenThrow(new RecursoNaoEncontradoException("Chamado 99 não encontrado"));

        mockMvc.perform(get("/chamados/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.erro").value("Chamado 99 não encontrado"));
    }

    @Test
    void listarRepassaFiltrosEUsaPaginacaoPadrao() throws Exception {
        when(service.listar(any(), any(), any(), any(Pageable.class)))
            .thenReturn(new PaginaResponse<>(List.of(chamado(StatusChamado.ABERTO, null)), 0, 10, 1, 1));

        mockMvc.perform(get("/chamados").param("status", "ABERTO").param("prioridade", "ALTA")
                .param("clienteId", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElementos").value(1))
            .andExpect(jsonPath("$.conteudo[0].id").value(1));

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(service).listar(eq(StatusChamado.ABERTO), eq(Prioridade.ALTA), eq(1L), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(10);
        assertThat(pageable.getValue().getSort().getOrderFor("dataAbertura").getDirection())
            .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void listarComStatusInexistenteRetorna400() throws Exception {
        mockMvc.perform(get("/chamados").param("status", "RESOLVIDO"))
            .andExpect(status().isBadRequest());

        verify(service, never()).listar(any(), any(), any(), any());
    }

    @Test
    void listarComOrdenacaoInvalidaRetorna400() throws Exception {
        when(service.listar(any(), any(), any(), any(Pageable.class)))
            .thenThrow(new ParametroInvalidoException("Não é possível ordenar por 'xyz'"));

        mockMvc.perform(get("/chamados").param("sort", "xyz"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value("Não é possível ordenar por 'xyz'"));
    }

    @Test
    void atribuirRetorna200() throws Exception {
        when(service.atribuir(eq(1L), any(AtribuirTecnicoRequest.class)))
            .thenReturn(chamado(StatusChamado.ABERTO, CARLOS));

        mockMvc.perform(patch("/chamados/1/atribuir").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"tecnicoId": 1}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tecnico.nome").value("Carlos Lima"));
    }

    @Test
    void alterarStatusSemStatusRetorna400() throws Exception {
        mockMvc.perform(patch("/chamados/1/status").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detalhes[0]").value("status: Status é obrigatório"));

        verify(service, never()).alterarStatus(any(), any());
    }

    @Test
    void alterarStatusDeChamadoFechadoRetorna409() throws Exception {
        when(service.alterarStatus(eq(1L), any(AlterarStatusRequest.class)))
            .thenThrow(new ChamadoFechadoException("Chamado 1 está fechado e não pode ser alterado"));

        mockMvc.perform(patch("/chamados/1/status").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status": "ABERTO"}
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.erro").value("Chamado 1 está fechado e não pode ser alterado"));
    }
}
