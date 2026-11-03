# Sistema de Chamados

API REST da disciplina DAS - Design e Arquitetura de Sistemas (Univille), com Java 21 e Spring Boot.

## Como executar

```powershell
.\mvnw spring-boot:run
```

A API responde em `http://localhost:8080`.

## Consulta de chamados: filtros, paginação e ordenação

`GET /chamados` aceita os parâmetros abaixo. Todos são opcionais e podem ser combinados.

| Parâmetro | Valores | Exemplo |
|---|---|---|
| `status` | `ABERTO`, `EM_ATENDIMENTO`, `AGUARDANDO_CLIENTE`, `FECHADO` | `status=ABERTO` |
| `prioridade` | `BAIXA`, `MEDIA`, `ALTA`, `CRITICA` | `prioridade=ALTA` |
| `clienteId` | id de um cliente | `clienteId=1` |
| `page` | número da página, começando em 0 | `page=1` |
| `size` | itens por página (padrão: 10) | `size=5` |
| `sort` | `campo,asc` ou `campo,desc` (padrão: `dataAbertura,desc`) | `sort=titulo,asc` |

Campos aceitos em `sort`: `id`, `titulo`, `dataAbertura`, `dataFechamento`, `prioridade`, `status`, `cliente.nome` e `categoria.nome`.

A ordenação por `prioridade` e por `status` é alfabética (por exemplo: `ALTA`, `BAIXA`, `CRITICA`, `MEDIA`), não por gravidade.

### Exemplos

| Consulta | Retorna |
|---|---|
| `GET /chamados` | Todos, 10 por página, dos mais recentes para os mais antigos |
| `GET /chamados?status=ABERTO` | Só os abertos |
| `GET /chamados?prioridade=CRITICA` | Só os de prioridade crítica |
| `GET /chamados?clienteId=1` | Só os do cliente 1 |
| `GET /chamados?status=ABERTO&prioridade=ALTA` | Abertos e de prioridade alta |
| `GET /chamados?status=EM_ATENDIMENTO&prioridade=ALTA&clienteId=2` | Os três filtros ao mesmo tempo |
| `GET /chamados?page=1&size=5` | A segunda página, com 5 por página |
| `GET /chamados?status=ABERTO&sort=titulo,asc` | Abertos, em ordem alfabética de título |
| `GET /chamados?sort=cliente.nome,asc&sort=dataAbertura,desc` | Por nome do cliente e, dentro de cada cliente, dos mais recentes para os mais antigos |
| `GET /clientes/1/chamados` | Chamados do cliente 1 (aceita `page`, `size` e `sort`) |

Exemplo pelo terminal:

```bash
curl -i "http://localhost:8080/chamados?status=ABERTO&prioridade=ALTA&page=0&size=5"
```

### Formato da resposta

```json
{
  "conteudo": [
    { "id": 12, "titulo": "Impressora parada", "status": "ABERTO", "prioridade": "ALTA" }
  ],
  "pagina": 0,
  "tamanho": 10,
  "totalElementos": 12,
  "totalPaginas": 2
}
```

Cada item de `conteudo` tem o mesmo formato de `GET /chamados/{id}`; o exemplo acima mostra só alguns campos.

### Erros

| Situação | Status |
|---|---|
| `status` ou `prioridade` com valor inexistente | 400 |
| `sort` com campo fora da lista aceita | 400 |
| `GET /clientes/{id}/chamados` com cliente inexistente | 404 |
| `GET /chamados?clienteId=` com cliente inexistente | 200, com `conteudo` vazio |
