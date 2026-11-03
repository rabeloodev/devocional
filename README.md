# Caminhada
## Onde adicionar os devocionais

Edite o arquivo `devocionais.json`. A lista `devocionais` é a sequência que o site percorre, um texto por dia. Depois do último item, a sequência recomeça.

O primeiro item aparece na data definida em `data_inicio`. Troque essa data se quiser começar em outro dia. Para adicionar um texto, inclua um objeto dentro da lista, separado dos outros por vírgula:

```json
{
	"data_inicio": "2026-11-02",
	"devocionais": [
		{
			"titulo": "Seu título",
			"tema": "Tema do devocional",
			"versiculo": "Texto do versículo",
			"referencia": "Livro 1:1",
			"reflexao": [
				"Primeiro parágrafo da reflexão.",
				"Segundo parágrafo da reflexão.",
				"Terceiro parágrafo da reflexão."
			],
			"oracao": "Sua oração."
		}
	]
}
```

Mantenha os nomes dos campos e o formato JSON. O site escolhe o texto pela data, então não é preciso publicar manualmente um arquivo novo todos os dias. Para ver localmente, rode `python -m http.server 5500` e abra `http://localhost:5500`.

