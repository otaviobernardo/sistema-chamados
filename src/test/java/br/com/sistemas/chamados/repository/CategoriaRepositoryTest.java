package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.com.sistemas.chamados.entity.Categoria;

@DataJpaTest
class CategoriaRepositoryTest {

    @Autowired
    private CategoriaRepository repository;

    @Test
    void salvaEBuscaCategoriaPorId() {
        Categoria salva = repository.save(new Categoria("Hardware", "Equipamentos"));

        assertThat(salva.getId()).isNotNull();
        assertThat(repository.findById(salva.getId()))
            .hasValueSatisfying(c -> assertThat(c.getNome()).isEqualTo("Hardware"));
    }

    @Test
    void buscaPorIdInexistenteRetornaVazio() {
        assertThat(repository.findById(99999L)).isEmpty();
    }

    @Test
    void existsByNomeDetectaNomeJaCadastrado() {
        repository.save(new Categoria("Hardware", null));

        assertThat(repository.existsByNome("Hardware")).isTrue();
        assertThat(repository.existsByNome("Software")).isFalse();
    }

    @Test
    void existsByNomeAndIdNotIgnoraAPropriaCategoria() {
        Categoria hardware = repository.save(new Categoria("Hardware", null));
        Categoria software = repository.save(new Categoria("Software", null));

        assertThat(repository.existsByNomeAndIdNot("Hardware", hardware.getId())).isFalse();
        assertThat(repository.existsByNomeAndIdNot("Hardware", software.getId())).isTrue();
    }

    @Test
    void bancoRecusaNomeDuplicado() {
        repository.saveAndFlush(new Categoria("Hardware", null));

        assertThatThrownBy(() -> repository.saveAndFlush(new Categoria("Hardware", "Outra")))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
}
