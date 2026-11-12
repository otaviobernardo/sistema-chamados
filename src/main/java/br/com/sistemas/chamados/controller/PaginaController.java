package br.com.sistemas.chamados.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class PaginaController {

    @GetMapping({"/", "/app"})
    public String inicio() {
        return "redirect:/app/dashboard";
    }

    @GetMapping("/app/dashboard")
    public String dashboard() {
        return "dashboard";
    }

    @GetMapping("/app/clientes")
    public String listarClientes() {
        return "clientes/lista";
    }

    @GetMapping("/app/clientes/novo")
    public String novoCliente() {
        return "clientes/form";
    }

    @GetMapping("/app/clientes/{id}")
    public String detalharCliente(@PathVariable Long id, Model model) {
        model.addAttribute("id", id);
        return "clientes/detalhe";
    }

    @GetMapping("/app/clientes/{id}/editar")
    public String editarCliente(@PathVariable Long id, Model model) {
        model.addAttribute("id", id);
        return "clientes/form";
    }

    @GetMapping("/app/categorias")
    public String listarCategorias() {
        return "categorias/lista";
    }

    @GetMapping("/app/categorias/novo")
    public String novaCategoria() {
        return "categorias/form";
    }

    @GetMapping("/app/categorias/{id}/editar")
    public String editarCategoria(@PathVariable Long id, Model model) {
        model.addAttribute("id", id);
        return "categorias/form";
    }

    @GetMapping("/app/tecnicos")
    public String listarTecnicos() {
        return "tecnicos/lista";
    }

    @GetMapping("/app/tecnicos/novo")
    public String novoTecnico() {
        return "tecnicos/form";
    }

    @GetMapping("/app/tecnicos/{id}/editar")
    public String editarTecnico(@PathVariable Long id, Model model) {
        model.addAttribute("id", id);
        return "tecnicos/form";
    }

    @GetMapping("/app/chamados")
    public String listarChamados() {
        return "chamados/lista";
    }

    @GetMapping("/app/chamados/novo")
    public String novoChamado() {
        return "chamados/form";
    }

    @GetMapping("/app/chamados/{id}")
    public String detalharChamado(@PathVariable Long id, Model model) {
        model.addAttribute("id", id);
        return "chamados/detalhe";
    }

    @GetMapping("/app/chamados/{id}/editar")
    public String editarChamado(@PathVariable Long id, Model model) {
        model.addAttribute("id", id);
        return "chamados/form";
    }
}
