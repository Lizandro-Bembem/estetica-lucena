# Estética Lucena — Site

Site da Estética Lucena (Cajazeiras, Salvador — BA).
No ar em: https://lizandro-bembem.github.io/estetica-lucena/

## Estrutura
```
index.html            → página do site
style.css             → cores, fontes e animações
script.js             → interações, agendamento e PWA (configurações no topo do arquivo)
auth.js               → cadastro e login (configuração no topo do arquivo)
sw.js                 → service worker (site funciona offline / instalável)
manifest.webmanifest  → dados do aplicativo (nome, cores, ícones)
icons/                → ícones e capturas do aplicativo
img/                  → fotos do site
```

## Pendências
- **WhatsApp:** coloque o número em `script.js` → `CONFIG.whatsapp` (ex.: `'5571999999999'`).
  Enquanto estiver vazio, os botões de contato e o agendamento usam o Direct do Instagram.
- **Combo Premium:** troque "Consulte o valor" pelo preço em `index.html` (seção COMBOS).
- **Foto do topo:** salve `img/hero.jpg` (vertical) e adicione `data-img="img/hero.jpg"` na `div` `ph--hero` em `index.html`.
- **Cadastro e login:** siga o passo a passo abaixo.

## Fotos
| Arquivo | Onde aparece | Formato |
|---|---|---|
| `hero.jpg` | Foto grande do topo (ainda sem foto) | vertical 3:4 |
| `lucena.jpg` | Foto da profissional (seção "Sobre") | vertical 3:4 |
| `espaco.jpg` | Foto redonda pequena (logo do espaço) | quadrada |
| `galeria-01.jpg` … `galeria-09.jpg` | Galeria de resultados | veja o comentário na galeria do `index.html` |
| `login.jpg` | Lado esquerdo da tela de login (computador) | vertical 3:4 |
| `compartilhar.jpg` | Imagem ao compartilhar o link no WhatsApp | 1200 × 630 |

Para trocar uma foto, basta salvar outra com o **mesmo nome** na pasta `img/`.
Enquanto uma foto não existir, aparece um degradê com o monograma no lugar.

## Aplicativo (PWA)
O site pode ser instalado no celular como aplicativo:
- **Android / Chrome:** menu do site → "Instalar app" (ou o aviso do próprio Chrome).
- **iPhone:** no Safari, Compartilhar → "Adicionar à Tela de Início".

Ao mudar a lista de arquivos em `sw.js`, aumente o número em `VERSAO` (ex.: `lucena-v3`).

## Cadastro e login (Supabase + Brevo)
O GitHub Pages só hospeda arquivos — não roda servidor. Por isso:
- **Supabase** (gratuito) guarda as contas e as senhas com segurança;
- **Brevo** envia os e-mails (confirmação de cadastro e "Esqueci minha senha") como SMTP do Supabase.
A chave do Brevo fica só dentro do Supabase — nunca no código do site.

1. **Supabase:** crie uma conta em https://supabase.com e um projeto novo (região: São Paulo).
2. **Endereço do site:** Supabase → Authentication → URL Configuration
   - Site URL: `https://lizandro-bembem.github.io/estetica-lucena/`
   - Redirect URLs: adicione o mesmo endereço.
3. **Chave SMTP do Brevo:** Brevo → menu do perfil → *SMTP & API* → aba **SMTP** → "Gerar nova chave SMTP".
   Anote também o **login SMTP** que aparece na mesma página.
   Em Brevo → *Remetentes, domínios e IPs dedicados*, confirme o e-mail que vai aparecer como remetente.
4. **Ligar o Brevo no Supabase:** Supabase → Project Settings → Authentication → **SMTP Settings** → ative *Custom SMTP*:
   - Host: `smtp-relay.brevo.com` · Porta: `587`
   - Usuário: o login SMTP do Brevo · Senha: a chave SMTP do Brevo
   - Remetente: o e-mail confirmado no Brevo · Nome: `Estética Lucena`
5. **E-mails em português (opcional):** Supabase → Authentication → Email Templates (Confirm signup e Reset password).
6. **Colar no site:** Supabase → Project Settings → API → copie **Project URL** e a chave **anon public**
   e cole em `auth.js` → `AUTH_CONFIG` (`supabaseUrl` e `supabaseChave`).
   A chave *anon public* foi feita para ficar no site; **nunca** cole a *service_role* nem a chave do Brevo no código.

Os dados da cliente (nome e telefone) ficam no cadastro do Supabase (Authentication → Users).

## Como editar
- **Preços:** em `index.html`, troque "Consulte o valor" pelo preço (ex.: `R$ 120,00`).
- **Horários, dias fechados, serviços e WhatsApp:** no topo de `script.js` (objeto `CONFIG`).
