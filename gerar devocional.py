#!/usr/bin/env python3
"""Gera o devocional do dia com IA (Claude) e salva em devocional-hoje.json.

Uso:
    python gerar_devocional.py              # gera o de hoje (pula se já existir)
    python gerar_devocional.py --forcar     # gera de novo mesmo se já existir
    python gerar_devocional.py --data 2026-12-25   # gera para outra data
    python gerar_devocional.py --rascunho   # salva em devocional-rascunho.json para você revisar

Antes: pip install -r requirements.txt e defina ANTHROPIC_API_KEY (veja .env.example).
"""
import argparse
import json
import os
import sys
import time
from datetime import date, datetime
from pathlib import Path

PASTA = Path(__file__).resolve().parent
ARQ_HOJE = PASTA / "devocional-hoje.json"
ARQ_RASCUNHO = PASTA / "devocional-rascunho.json"
ARQ_HIST = PASTA / "historico.json"
PASTA_ARQUIVO = PASTA / "devocionais"
MODELO = os.environ.get("MODELO_CLAUDE", "claude-sonnet-5-5")

# Mesma lista (e mesma ordem) usada no site, para o tema bater com o script.js
TEMAS = [
    "O amor de Cristo na cruz", "Amar o próximo", "Perdão que liberta", "A graça que nos sustenta",
    "Esperança que não se apaga", "A paz que excede o entendimento", "Gratidão em todas as coisas",
    "Fé como confiança", "Oração simples e sincera", "Humildade de coração", "Perseverar no caminho",
    "A alegria do Senhor", "Misericórdia que se renova", "Sabedoria para o dia a dia", "Descansar em Deus",
    "Propósito e chamado", "Família e lar", "Cura das feridas interiores", "Confiar quando não entendemos",
    "Uma vida santa", "Servir como Jesus serviu", "Comunhão com os irmãos", "Entregar a ansiedade",
    "Coragem para seguir", "Bondade que transforma", "Reconciliação", "Adoração de todo o coração",
    "Recomeçar com Deus", "Paciência e espera", "Jesus, o Bom Pastor", "Ser luz no mundo",
]
# Datas especiais (mês-dia). Adicione as que quiser.
ESPECIAIS = {
    "12-25": "O nascimento de Cristo, o amor que se fez presente",
    "01-01": "Um novo ano nas mãos de Deus",
}
DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"]
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto",
         "setembro", "outubro", "novembro", "dezembro"]


def carregar_env():
    """Lê um arquivo .env simples (CHAVE=valor) se existir."""
    arq = PASTA / ".env"
    if not arq.exists():
        return
    for linha in arq.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if linha and not linha.startswith("#") and "=" in linha:
            k, v = linha.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def escolher_tema(d: date) -> str:
    especial = ESPECIAIS.get(d.strftime("%m-%d"))
    return especial or TEMAS[d.timetuple().tm_yday % len(TEMAS)]


def ler_json(caminho: Path, padrao):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return padrao


def gravar_json(caminho: Path, dados):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    tmp = caminho.with_suffix(caminho.suffix + ".tmp")
    tmp.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(caminho)  # troca atômica: o site nunca lê um arquivo pela metade


def montar_prompt(d: date, tema: str, titulos: list[str]) -> str:
    data_extenso = f"{DIAS[d.weekday()]}, {d.day} de {MESES[d.month - 1]} de {d.year}"
    usados = "; ".join(titulos) if titulos else "(nenhum ainda)"
    return f"""Você escreve devocionais cristãos em português do Brasil, com linguagem acolhedora e simples, para o dia {data_extenso}.
Tema do dia: {tema}. O fio condutor é o amor de Cristo.

Regras:
- Título criativo e curto, DIFERENTE destes já usados: {usados}.
- Um versículo curto da Bíblia (Almeida) que você tenha certeza de que está correto, citado exatamente.
- Reflexão em exatamente 3 parágrafos curtos e práticos, sem tom de julgamento e sem defender doutrina de uma denominação específica.
- Termine com uma oração curta, em primeira pessoa.

Responda SOMENTE com um objeto JSON, sem texto antes ou depois e sem markdown:
{{"titulo":"...","versiculo":"texto do versículo","referencia":"Livro cap:vers","reflexao":["p1","p2","p3"],"oracao":"..."}}"""


def extrair_json(texto: str) -> dict:
    a, b = texto.find("{"), texto.rfind("}")
    if a < 0 or b < a:
        raise ValueError("A IA não devolveu um JSON.")
    return json.loads(texto[a:b + 1])


def validar(dev: dict, titulos: list[str]):
    for campo in ("titulo", "versiculo", "referencia", "oracao"):
        if not isinstance(dev.get(campo), str) or not dev[campo].strip():
            raise ValueError(f"Campo ausente ou vazio: {campo}")
    r = dev.get("reflexao")
    if not isinstance(r, list) or len(r) != 3 or not all(isinstance(p, str) and p.strip() for p in r):
        raise ValueError("A reflexão precisa ter exatamente 3 parágrafos.")
    if dev["titulo"].strip().lower() in {t.strip().lower() for t in titulos}:
        raise ValueError("Título repetido.")


def gerar(d: date, tema: str, titulos: list[str], tentativas: int = 3) -> dict:
    import anthropic  # importado aqui para dar erro claro se faltar instalar

    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("Falta a chave: defina ANTHROPIC_API_KEY (veja .env.example).")
    cliente = anthropic.Anthropic()
    ultimo_erro = None
    for i in range(1, tentativas + 1):
        try:
            msg = cliente.messages.create(
                model=MODELO,
                max_tokens=1500,
                messages=[{"role": "user", "content": montar_prompt(d, tema, titulos)}],
            )
            texto = "".join(b.text for b in msg.content if b.type == "text")
            dev = extrair_json(texto)
            validar(dev, titulos)
            return dev
        except Exception as e:  # tenta de novo em caso de erro de rede, formato ou título repetido
            ultimo_erro = e
            print(f"Tentativa {i}/{tentativas} falhou: {e}", file=sys.stderr)
            time.sleep(3 * i)
    sys.exit(f"Não foi possível gerar o devocional: {ultimo_erro}")


def main():
    carregar_env()
    p = argparse.ArgumentParser(description="Gera o devocional diário com IA.")
    p.add_argument("--data", help="AAAA-MM-DD (padrão: hoje)")
    p.add_argument("--forcar", action="store_true", help="gera mesmo se já existir o de hoje")
    p.add_argument("--rascunho", action="store_true", help="salva em devocional-rascunho.json para revisão")
    args = p.parse_args()

    d = date.fromisoformat(args.data) if args.data else date.today()
    iso = d.isoformat()
    destino = ARQ_RASCUNHO if args.rascunho else ARQ_HOJE

    atual = ler_json(destino, {})
    if atual.get("data") == iso and not args.forcar:
        print(f"Já existe devocional para {iso}. Use --forcar para gerar de novo.")
        return

    historico = ler_json(ARQ_HIST, [])
    titulos = [h["titulo"] for h in historico[-40:]]
    tema = escolher_tema(d)
    print(f"Gerando devocional de {iso} (tema: {tema})...")

    dev = gerar(d, tema, titulos)
    dev.update({"data": iso, "tema": tema, "gerado_em": datetime.now().isoformat(timespec="seconds"),
                "modelo": MODELO})

    gravar_json(destino, dev)
    if not args.rascunho:
        gravar_json(PASTA_ARQUIVO / f"{iso}.json", dev)
        historico = [h for h in historico if h.get("data") != iso]
        historico.append({"data": iso, "titulo": dev["titulo"], "tema": tema})
        gravar_json(ARQ_HIST, historico)
    print(f"Pronto: {destino.name} -> \"{dev['titulo']}\" ({dev['referencia']})")
    if args.rascunho:
        print("Revise e, se estiver bom, renomeie para devocional-hoje.json.")


if __name__ == "__main__":
    main()