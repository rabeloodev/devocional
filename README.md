# Devocional Caminhada

O site publica o arquivo `devocional-hoje.json`, gerado uma vez por dia pelo GitHub Actions usando o gerador Python e a API da Anthropic. A chave da API fica apenas nos Secrets do GitHub; ela nunca deve ser colocada no JavaScript do site.

## Ativar a geração diária

1. No GitHub, abra **Settings > Secrets and variables > Actions** e crie o secret `ANTHROPIC_API_KEY` com sua chave da Anthropic.
2. Em **Actions**, habilite os workflows do repositório. O workflow roda diariamente às 06:00 UTC (03:00 no horário de Brasília) e também pode ser iniciado manualmente.
3. Configure o GitHub Pages para publicar a branch padrão pela raiz do repositório, para que o JSON fique disponível junto ao `index.html`.

O workflow gera o devocional, atualiza o histórico e arquiva o conteúdo em `devocionais/`. Se ainda não houver publicação para o dia, a página informa que a geração pode estar em andamento; use **Verificar publicação** para consultar novamente.

## Gerar manualmente

Instale as dependências com `pip install -r requirements`, defina `ANTHROPIC_API_KEY` e execute `python "gerar devocional.py"`. Use `--forcar` para gerar novamente o devocional do dia ou `--data AAAA-MM-DD` para gerar para outra data. Para testar o site localmente, rode `python -m http.server` e abra `http://localhost:8000`.
