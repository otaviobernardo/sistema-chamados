package br.com.sistemas.chamados.dto;

import java.time.LocalDateTime;
import java.util.List;

import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;

/** Detalhe do chamado: os mesmos dados de ChamadoResponse mais os comentários. */
public record ChamadoDetalheResponse(
    Long id,
    String titulo,
    String descricao,
    LocalDateTime dataAbertura,
    LocalDateTime dataFechamento,
    Prioridade prioridade,
    StatusChamado status,
    ClienteResponse cliente,
    CategoriaResponse categoria,
    TecnicoResponse tecnico,
    List<ComentarioResponse> comentarios
) {
    public static ChamadoDetalheResponse de(Chamado c) {
        return new ChamadoDetalheResponse(
            c.getId(),
            c.getTitulo(),
            c.getDescricao(),
            c.getDataAbertura(),
            c.getDataFechamento(),
            c.getPrioridade(),
            c.getStatus(),
            ClienteResponse.de(c.getCliente()),
            CategoriaResponse.de(c.getCategoria()),
            c.getTecnico() == null ? null : TecnicoResponse.de(c.getTecnico()),
            c.getComentarios().stream().map(ComentarioResponse::de).toList());
    }
}
