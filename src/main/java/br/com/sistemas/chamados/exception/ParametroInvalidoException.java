package br.com.sistemas.chamados.exception;

/** Lançada quando um parâmetro de consulta tem valor não aceito (vira HTTP 400). */
public class ParametroInvalidoException extends RuntimeException {
    public ParametroInvalidoException(String mensagem) {
        super(mensagem);
    }
}
