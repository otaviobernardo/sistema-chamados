package br.com.sistemas.chamados.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import br.com.sistemas.chamados.dto.TecnicoRequest;
import br.com.sistemas.chamados.dto.TecnicoResponse;
import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.exception.RegraNegocioException;
import br.com.sistemas.chamados.service.TecnicoService;

@WebMvcTest(TecnicoController.class)
class TecnicoControllerTest {

    private static final String TECNICO_VALIDO = """
        {"nome": "Carlos Lima", "email": "carlos@exemplo.com", "perfil": "TECNICO"}
        """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TecnicoService service;

    @Test
    void criarRetorna201ComLocation() throws Exception {
        when(service.criar(any(TecnicoRequest.class)))
            .thenReturn(new TecnicoResponse(1L, "Carlos Lima", "carlos@exemplo.com", Perfil.TECNICO));

        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON).content(TECNICO_VALIDO))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/tecnicos/1"))
            .andExpect(jsonPath("$.perfil").value("TECNICO"));
    }

    @Test
    void criarSemCamposRetorna400ComTodosOsErros() throws Exception {
        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detalhes", hasSize(3)))
            .andExpect(jsonPath("$.detalhes", hasItem("perfil: Perfil é obrigatório")));

        verify(service, never()).criar(any());
    }

    @Test
    void criarComPerfilInexistenteRetorna400() throws Exception {
        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nome": "Carlos Lima", "email": "carlos@exemplo.com", "perfil": "GERENTE"}
                    """))
            .andExpect(status().isBadRequest());

        verify(service, never()).criar(any());
    }

    @Test
    void criarComEmailDuplicadoRetorna409() throws Exception {
        when(service.criar(any(TecnicoRequest.class)))
            .thenThrow(new RegraNegocioException("Já existe técnico com o e-mail carlos@exemplo.com"));

        mockMvc.perform(post("/tecnicos").contentType(MediaType.APPLICATION_JSON).content(TECNICO_VALIDO))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.erro").value("Já existe técnico com o e-mail carlos@exemplo.com"));
    }

    @Test
    void buscarIdInexistenteRetorna404() throws Exception {
        when(service.buscar(99L)).thenThrow(new RecursoNaoEncontradoException("Técnico 99 não encontrado"));

        mockMvc.perform(get("/tecnicos/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.erro").value("Técnico 99 não encontrado"));
    }

    @Test
    void excluirTecnicoComChamadosRetorna409() throws Exception {
        doThrow(new RegraNegocioException("Técnico 1 possui chamados e não pode ser excluído"))
            .when(service).excluir(1L);

        mockMvc.perform(delete("/tecnicos/1"))
            .andExpect(status().isConflict());
    }
}
