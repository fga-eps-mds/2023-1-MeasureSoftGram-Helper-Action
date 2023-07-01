# Automatize a coleta de métricas e a geração de releases

Usando esta Github Action, é possível executar de forma automática a coleta de métricas de acordo com os padrões estabelecidos pela disciplina. Fora isso, também é possível gerar novas releases a partir do uso de tags nos pull requests.

### Uso da coleta de métricas

Para usar a coleta de métricas, você pode seguir este exemplo:

```yaml
name: Export de métricas

on:
  pull_request:
    branches: [main, develop]
    types: [closed]
  push:
    branches: [main, develop]
    tags:
      - "v*"

jobs:
  release:
    runs-on: "ubuntu-latest"
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Msgram Helper Action
        uses: fga-eps-mds/2023-1-MeasureSoftGram-Helper-Action@v0.1.4-alpha
        id: msgram
        with:
          githubToken: ${{ secrets.API_TOKEN_DOC }}
          metricsRepo: "2023-1-MeasureSoftGram-doc"
```

Neste caso, a coleta de métricas será executada sempre que pull request for fechado e mergado com a branch main ou develop. Além disso, a coleta também será executada sempre que uma tag for criada manualmente na branch main ou develop. E quando houver um push na branch main ou develop, a coleta também será executada.

### Uso da geração de releases

Cria uma nova release a partir de uma tag. A release é criada apenas quando um pull request for mergado.

Para usar a geração de releases automática é necessário que a tag criada siga o padrão do Semantic Versioning (https://semver.org). A tag deve seguir o padrão `vX.Y.Z`, onde X, Y e Z são números inteiros positivos, que geralmente correspondem a versão major, minor e patch, respectivamente.

Para usar a geração de releases é necessário adicionar uma das seguintes tags no pull request:

- `MINOR_RELEASE`: para quando a versão major deve ser incrementada
- `MAJOR_RELEASE`: para quando a versão minor deve ser incrementada
- `PATCH_RELEASE`: para quando a versão patch deve ser incrementada

Exemplo:

![image](./static/label.png)

### Inputs

| Nome | Descrição | Obrigatório | Padrão |
| --- | --- | --- | --- |
| `metricsRepo` | Repositório onde as métricas serão armazenadas | Sim | N/A |
| `githubToken` | Token de autenticação do github | Sim | N/A |