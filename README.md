# Devocional Caminhada

O site lê `devocional-hoje.json`, publicado diariamente pelo GitHub Actions a partir do gerador Python.

## Ativar a geração diária

1. No GitHub, abra **Settings > Secrets and variables > Actions** e crie o segredo `ANTHROPIC_API_KEY` com sua chave da Anthropic.
2. Em **Actions**, habilite os workflows do repositório. O workflow roda diariamente às 06:00 UTC (03:00 no horário de Brasília) e também pode ser iniciado manualmente.
3. Configure o GitHub Pages para publicar a branch `main` pela raiz do repositório, para que o JSON gerado fique disponível junto ao `index.html`.

O workflow grava o devocional do dia, o histórico e o arquivo arquivado no repositório. Para testar o site localmente, rode `python -m http.server`; a publicação local aparece após o workflow gerar os arquivos e você atualizar o repositório.

## Gerar manualmente

Instale as dependências com `pip install -r requirements`, defina `ANTHROPIC_API_KEY` e rode `python "gerar devocional.py"`. Use `--forcar` para gerar novamente o devocional da data atual.
