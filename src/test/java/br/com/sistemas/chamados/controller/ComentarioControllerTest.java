package br.com.sistemas.chamados.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.ComentarioRequest;
import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.exception.ChamadoFechadoException;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.service.ComentarioService;

@WebMvcTest(ComentarioController.class)
class ComentarioControllerTest {

    private static final String COMENTARIO_VALIDO = """
        {"texto": "Reiniciei a impressora", "autor": "Carlos Lima"}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ComentarioService service;

    @Test
    void criarRetorna201() throws Exception {
        when(service.criar(eq(1L), any(ComentarioRequest.class))).thenReturn(new ComentarioResponse(
            1L, "Reiniciei a impressora", "Carlos Lima", LocalDateTime.of(2026, 11, 2, 10, 0)));

        mockMvc.perform(post("/chamados/1/comentarios").contentType(MediaType.APPLICATION_JSON)
                .content(COMENTARIO_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.texto").value("Reiniciei a impressora"))
            .andExpect(jsonPath("$.autor").value("Carlos Lima"));
    }

    @Test
    void criarSemTextoEAutorRetorna400() throws Exception {
        mockMvc.perform(post("/chamados/1/comentarios").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detalhes", hasSize(2)));

        verify(service, never()).criar(any(), any());
    }

    @Test
    void criarEmChamadoInexistenteRetorna404() throws Exception {
        when(service.criar(eq(99L), any(ComentarioRequest.class)))
            .thenThrow(new RecursoNaoEncontradoException("Chamado 99 não encontrado"));

        mockMvc.perform(post("/chamados/99/comentarios").contentType(MediaType.APPLICATION_JSON)
                .content(COMENTARIO_VALIDO))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.erro").value("Chamado 99 não encontrado"));
    }

    @Test
    void criarEmChamadoFechadoRetorna409() throws Exception {
        when(service.criar(eq(1L), any(ComentarioRequest.class))).thenThrow(
            new ChamadoFechadoException("Chamado 1 está fechado e não pode receber comentários"));

        mockMvc.perform(post("/chamados/1/comentarios").contentType(MediaType.APPLICATION_JSON)
                .content(COMENTARIO_VALIDO))
            .andExpect(status().isConflict());
    }
}
