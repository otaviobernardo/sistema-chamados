package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.com.sistemas.chamados.entity.Cliente;

@DataJpaTest
class ClienteRepositoryTest {

    @Autowired
    private ClienteRepository repository;

    @Test
    void salvaEBuscaClientePorId() {
        Cliente salvo = repository.save(new Cliente("Ana Souza", "ana@exemplo.com", "47999999999"));

        assertThat(salvo.getId()).isNotNull();
        assertThat(repository.findById(salvo.getId()))
            .hasValueSatisfying(c -> assertThat(c.getEmail()).isEqualTo("ana@exemplo.com"));
    }

    @Test
    void buscaPorIdInexistenteRetornaVazio() {
        assertThat(repository.findById(99999L)).isEmpty();
    }

    @Test
    void existsByEmailDetectaEmailJaCadastrado() {
        repository.save(new Cliente("Ana Souza", "ana@exemplo.com", null));

        assertThat(repository.existsByEmail("ana@exemplo.com")).isTrue();
        assertThat(repository.existsByEmail("outro@exemplo.com")).isFalse();
    }

    @Test
    void existsByEmailAndIdNotIgnoraOProprioCliente() {
        Cliente ana = repository.save(new Cliente("Ana Souza", "ana@exemplo.com", null));
        Cliente joao = repository.save(new Cliente("Joao Silva", "joao@exemplo.com", null));

        assertThat(repository.existsByEmailAndIdNot("ana@exemplo.com", ana.getId())).isFalse();
        assertThat(repository.existsByEmailAndIdNot("ana@exemplo.com", joao.getId())).isTrue();
    }

    @Test
    void bancoRecusaEmailDuplicado() {
        repository.saveAndFlush(new Cliente("Ana Souza", "ana@exemplo.com", null));

        assertThatThrownBy(() -> repository.saveAndFlush(new Cliente("Outra", "ana@exemplo.com", null)))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void bancoRecusaNomeNulo() {
        assertThatThrownBy(() -> repository.saveAndFlush(new Cliente(null, "ana@exemplo.com", null)))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
}
