# Estética Lucena — Site

Site da Estética Lucena (Cajazeiras, Salvador — BA).

## Estrutura
```
index.html   → página do site
style.css    → cores, fontes e animações
script.js    → interações + agendamento (configurações no topo do arquivo)
img/         → fotos do site
```

## Pendências
- **WhatsApp:** coloque o número em `script.js` → `CONFIG.whatsapp` (ex.: `'5571999999999'`).
  Enquanto estiver vazio, os botões de contato e o agendamento usam o Direct do Instagram.
- **Combo Premium:** troque "Consulte o valor" pelo preço em `index.html` (seção COMBOS).
- **Fotos:** coloque na pasta `img/` (veja a tabela abaixo).

## Fotos
| Arquivo | Onde aparece |
|---|---|
| `hero.jpg` | Foto grande do topo (vertical) |
| `lucena.jpg` | Foto da profissional (seção "Sobre") |
| `espaco.jpg` | Foto redonda pequena (ambiente / detalhe) |
| `galeria-01.jpg` … `galeria-09.jpg` | Galeria de resultados |
| `compartilhar.jpg` | Imagem que aparece ao compartilhar o link no WhatsApp |

Enquanto uma foto não existir, aparece um degradê com o monograma no lugar.

## Como editar
- **Preços:** em `index.html`, troque "Consulte o valor" pelo preço (ex.: `R$ 120,00`).
- **Horários, dias fechados, serviços e WhatsApp:** no topo de `script.js` (objeto `CONFIG`).
