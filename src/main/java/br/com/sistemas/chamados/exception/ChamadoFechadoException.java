package br.com.sistemas.chamados.exception;

/** Lançada quando se tenta alterar um chamado fechado (vira HTTP 409). */
public class ChamadoFechadoException extends RuntimeException {
    public ChamadoFechadoException(String mensagem) {
        super(mensagem);
    }
}
