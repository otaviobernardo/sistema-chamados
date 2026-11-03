package br.com.sistemas.chamados.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.sistemas.chamados.dto.ComentarioRequest;
import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Comentario;
import br.com.sistemas.chamados.entity.StatusChamado;
import br.com.sistemas.chamados.exception.ChamadoFechadoException;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import br.com.sistemas.chamados.repository.ComentarioRepository;

@Service
public class ComentarioService {

    private final ComentarioRepository repository;
    private final ChamadoRepository chamadoRepository;

    public ComentarioService(ComentarioRepository repository, ChamadoRepository chamadoRepository) {
        this.repository = repository;
        this.chamadoRepository = chamadoRepository;
    }

    @Transactional
    public ComentarioResponse criar(Long chamadoId, ComentarioRequest dto) {
        Chamado chamado = chamadoRepository.findById(chamadoId)
            .orElseThrow(() -> new RecursoNaoEncontradoException(
                "Chamado " + chamadoId + " não encontrado"));
        if (chamado.getStatus() == StatusChamado.FECHADO) {
            throw new ChamadoFechadoException(
                "Chamado " + chamadoId + " está fechado e não pode receber comentários");
        }
        Comentario salvo = repository.save(
            new Comentario(dto.texto(), dto.autor(), LocalDateTime.now(), chamado));
        return ComentarioResponse.de(salvo);
    }
}
