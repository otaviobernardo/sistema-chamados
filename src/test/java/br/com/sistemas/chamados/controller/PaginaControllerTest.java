package br.com.sistemas.chamados.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PaginaController.class)
class PaginaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void raizRedirecionaParaDashboard() throws Exception {
        mockMvc.perform(get("/"))
            .andExpect(status().is3xxRedirection())
            .andExpect(redirectedUrl("/app/dashboard"));
    }

    @Test
    void dashboardRenderizaComMenuDestacado() throws Exception {
        mockMvc.perform(get("/app/dashboard"))
            .andExpect(status().isOk())
            .andExpect(view().name("dashboard"))
            .andExpect(content().string(containsString("<title>Dashboard · Sistema de Chamados</title>")))
            .andExpect(content().string(containsString("class=\"nav-link active\" href=\"/app/dashboard\"")))
            .andExpect(content().string(containsString("/js/dashboard.js")));
    }

    @Test
    void listaDeClientesRenderizaTemplateComLayout() throws Exception {
        mockMvc.perform(get("/app/clientes"))
            .andExpect(status().isOk())
            .andExpect(view().name("clientes/lista"))
            .andExpect(content().string(containsString("<title>Clientes · Sistema de Chamados</title>")))
            .andExpect(content().string(containsString("id=\"tabela-clientes\"")))
            .andExpect(content().string(containsString("/js/clientes.js")));
    }

    @Test
    void novoClienteRenderizaFormularioSemId() throws Exception {
        mockMvc.perform(get("/app/clientes/novo"))
            .andExpect(status().isOk())
            .andExpect(view().name("clientes/form"))
            .andExpect(model().attributeDoesNotExist("id"))
            .andExpect(content().string(containsString("Novo cliente")))
            .andExpect(content().string(not(containsString("data-id="))));
    }

    @Test
    void editarClienteRenderizaFormularioComId() throws Exception {
        mockMvc.perform(get("/app/clientes/7/editar"))
            .andExpect(status().isOk())
            .andExpect(view().name("clientes/form"))
            .andExpect(model().attribute("id", 7L))
            .andExpect(content().string(containsString("data-id=\"7\"")))
            .andExpect(content().string(containsString("Editar cliente")));
    }

    @Test
    void detalheDoClienteRecebeId() throws Exception {
        mockMvc.perform(get("/app/clientes/7"))
            .andExpect(status().isOk())
            .andExpect(view().name("clientes/detalhe"))
            .andExpect(model().attribute("id", 7L))
            .andExpect(content().string(containsString("data-id=\"7\"")))
            .andExpect(content().string(containsString("href=\"/app/clientes/7/editar\"")))
            .andExpect(content().string(containsString("href=\"/app/chamados/novo?clienteId=7\"")));
    }

    @Test
    void listaDeCategoriasRenderizaTemplate() throws Exception {
        mockMvc.perform(get("/app/categorias"))
            .andExpect(status().isOk())
            .andExpect(view().name("categorias/lista"))
            .andExpect(content().string(containsString("id=\"tabela-categorias\"")))
            .andExpect(content().string(containsString("class=\"nav-link active\" href=\"/app/categorias\"")));
    }

    @Test
    void novaCategoriaRenderizaFormularioSemId() throws Exception {
        mockMvc.perform(get("/app/categorias/novo"))
            .andExpect(status().isOk())
            .andExpect(view().name("categorias/form"))
            .andExpect(model().attributeDoesNotExist("id"))
            .andExpect(content().string(containsString("Nova categoria")));
    }

    @Test
    void editarCategoriaRenderizaFormularioComId() throws Exception {
        mockMvc.perform(get("/app/categorias/3/editar"))
            .andExpect(status().isOk())
            .andExpect(view().name("categorias/form"))
            .andExpect(model().attribute("id", 3L))
            .andExpect(content().string(containsString("data-id=\"3\"")))
            .andExpect(content().string(containsString("Editar categoria")));
    }

    @Test
    void listaDeTecnicosRenderizaTemplate() throws Exception {
        mockMvc.perform(get("/app/tecnicos"))
            .andExpect(status().isOk())
            .andExpect(view().name("tecnicos/lista"))
            .andExpect(content().string(containsString("id=\"tabela-tecnicos\"")))
            .andExpect(content().string(containsString("/js/tecnicos.js")));
    }

    @Test
    void novoTecnicoRenderizaFormularioComPerfis() throws Exception {
        mockMvc.perform(get("/app/tecnicos/novo"))
            .andExpect(status().isOk())
            .andExpect(view().name("tecnicos/form"))
            .andExpect(model().attributeDoesNotExist("id"))
            .andExpect(content().string(containsString("value=\"ADMIN\"")))
            .andExpect(content().string(containsString("value=\"TECNICO\"")));
    }

    @Test
    void editarTecnicoRenderizaFormularioComId() throws Exception {
        mockMvc.perform(get("/app/tecnicos/4/editar"))
            .andExpect(status().isOk())
            .andExpect(view().name("tecnicos/form"))
            .andExpect(model().attribute("id", 4L))
            .andExpect(content().string(containsString("Editar técnico")));
    }

    @Test
    void listaDeChamadosRenderizaFiltros() throws Exception {
        mockMvc.perform(get("/app/chamados"))
            .andExpect(status().isOk())
            .andExpect(view().name("chamados/lista"))
            .andExpect(content().string(containsString("id=\"filtro-status\"")))
            .andExpect(content().string(containsString("id=\"filtro-prioridade\"")))
            .andExpect(content().string(containsString("id=\"filtro-cliente\"")));
    }

    @Test
    void novoChamadoTemCampoDeTecnico() throws Exception {
        mockMvc.perform(get("/app/chamados/novo"))
            .andExpect(status().isOk())
            .andExpect(view().name("chamados/form"))
            .andExpect(model().attributeDoesNotExist("id"))
            .andExpect(content().string(containsString("Novo chamado")))
            .andExpect(content().string(containsString("name=\"tecnicoId\"")));
    }

    @Test
    void editarChamadoNaoTemCampoDeTecnico() throws Exception {
        mockMvc.perform(get("/app/chamados/5/editar"))
            .andExpect(status().isOk())
            .andExpect(view().name("chamados/form"))
            .andExpect(model().attribute("id", 5L))
            .andExpect(content().string(containsString("Editar chamado")))
            .andExpect(content().string(not(containsString("name=\"tecnicoId\""))));
    }

    @Test
    void detalheDoChamadoRecebeId() throws Exception {
        mockMvc.perform(get("/app/chamados/5"))
            .andExpect(status().isOk())
            .andExpect(view().name("chamados/detalhe"))
            .andExpect(model().attribute("id", 5L))
            .andExpect(content().string(containsString("data-id=\"5\"")))
            .andExpect(content().string(containsString("id=\"form-comentario\"")))
            .andExpect(content().string(containsString("href=\"/app/chamados/5/editar\"")));
    }
}
