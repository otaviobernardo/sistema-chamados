package br.com.sistemas.chamados.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import br.com.sistemas.chamados.entity.Perfil;
import br.com.sistemas.chamados.entity.Tecnico;

@DataJpaTest
class TecnicoRepositoryTest {

    @Autowired
    private TecnicoRepository repository;

    @Test
    void salvaEBuscaTecnicoComPerfil() {
        Tecnico salvo = repository.save(new Tecnico("Carlos Lima", "carlos@exemplo.com", Perfil.ADMIN));

        assertThat(salvo.getId()).isNotNull();
        assertThat(repository.findById(salvo.getId()))
            .hasValueSatisfying(t -> assertThat(t.getPerfil()).isEqualTo(Perfil.ADMIN));
    }

    @Test
    void buscaPorIdInexistenteRetornaVazio() {
        assertThat(repository.findById(99999L)).isEmpty();
    }

    @Test
    void existsByEmailDetectaEmailJaCadastrado() {
        repository.save(new Tecnico("Carlos Lima", "carlos@exemplo.com", Perfil.TECNICO));

        assertThat(repository.existsByEmail("carlos@exemplo.com")).isTrue();
        assertThat(repository.existsByEmail("maria@exemplo.com")).isFalse();
    }

    @Test
    void existsByEmailAndIdNotIgnoraOProprioTecnico() {
        Tecnico carlos = repository.save(new Tecnico("Carlos Lima", "carlos@exemplo.com", Perfil.TECNICO));
        Tecnico maria = repository.save(new Tecnico("Maria Costa", "maria@exemplo.com", Perfil.ADMIN));

        assertThat(repository.existsByEmailAndIdNot("carlos@exemplo.com", carlos.getId())).isFalse();
        assertThat(repository.existsByEmailAndIdNot("carlos@exemplo.com", maria.getId())).isTrue();
    }

    @Test
    void bancoRecusaEmailDuplicado() {
        repository.saveAndFlush(new Tecnico("Carlos Lima", "carlos@exemplo.com", Perfil.TECNICO));

        assertThatThrownBy(() -> repository.saveAndFlush(
            new Tecnico("Outro", "carlos@exemplo.com", Perfil.ADMIN)))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
}
