package br.com.sistemas.chamados.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.ClienteRequest;
import br.com.sistemas.chamados.dto.ClienteResponse;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.ChamadoService;
import br.com.sistemas.chamados.service.ClienteService;

@WebMvcTest(ClienteController.class)
class ClienteControllerTest {

    private static final String CLIENTE_VALIDO = """
        {"nome": "Ana Souza", "email": "ana@exemplo.com", "telefone": "47999999999"}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClienteService service;

    @MockitoBean
    private ChamadoService chamadoService;

    @Test
    void criarRetorna201ComLocation() throws Exception {
        when(service.criar(any(ClienteRequest.class)))
            .thenReturn(new ClienteResponse(1L, "Ana Souza", "ana@exemplo.com", "47999999999"));

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/clientes/1"))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.nome").value("Ana Souza"));
    }

    @Test
    void criarComDadosInvalidosRetorna400SemChamarOService() throws Exception {
        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "", "email": "email-invalido"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.erro").value("Dados inválidos"))
            .andExpect(jsonPath("$.detalhes", hasSize(2)))
            .andExpect(jsonPath("$.detalhes", hasItem("nome: Nome é obrigatório")))
            .andExpect(jsonPath("$.detalhes", hasItem("email: E-mail inválido")));

        verify(service, never()).criar(any());
    }

    @Test
    void criarComEmailDuplicadoRetorna409() throws Exception {
        when(service.criar(any(ClienteRequest.class)))
            .thenThrow(new RegraNegocioException("Já existe cliente com o e-mail ana@exemplo.com"));

        mockMvc.perform(post("/clientes").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.erro").value("Já existe cliente com o e-mail ana@exemplo.com"));
    }

    @Test
    void buscarRetorna200() throws Exception {
        when(service.buscar(1L)).thenReturn(new ClienteResponse(1L, "Ana Souza", "ana@exemplo.com", null));

        mockMvc.perform(get("/clientes/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("ana@exemplo.com"));
    }

    @Test
    void buscarIdInexistenteRetorna404() throws Exception {
        when(service.buscar(99L)).thenThrow(new RecursoNaoEncontradoException("Cliente 99 não encontrado"));

        mockMvc.perform(get("/clientes/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.erro").value("Cliente 99 não encontrado"));
    }

    @Test
    void atualizarIdInexistenteRetorna404() throws Exception {
        when(service.atualizar(eq(99L), any(ClienteRequest.class)))
            .thenThrow(new RecursoNaoEncontradoException("Cliente 99 não encontrado"));

        mockMvc.perform(put("/clientes/99").contentType(MediaType.APPLICATION_JSON).content(CLIENTE_VALIDO))
            .andExpect(status().isNotFound());
    }

    @Test
    void excluirRetorna204() throws Exception {
        mockMvc.perform(delete("/clientes/1"))
            .andExpect(status().isNoContent());

        verify(service).excluir(1L);
    }

    @Test
    void excluirClienteComChamadosRetorna409() throws Exception {
        doThrow(new RegraNegocioException("Cliente 1 possui chamados e não pode ser excluído"))
            .when(service).excluir(1L);

        mockMvc.perform(delete("/clientes/1"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.erro").value("Cliente 1 possui chamados e não pode ser excluído"));
    }

    @Test
    void chamadosDeClienteInexistenteRetorna404() throws Exception {
        when(chamadoService.listarPorCliente(eq(99L), any(Pageable.class)))
            .thenThrow(new RecursoNaoEncontradoException("Cliente 99 não encontrado"));

        mockMvc.perform(get("/clientes/99/chamados"))
            .andExpect(status().isNotFound());
    }
}
