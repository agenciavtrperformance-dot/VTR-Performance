# Kit Fim de Ano do Lojista — landing page

Página de vendas do **Kit Fim de Ano do Lojista: da Black Friday ao Natal** (VTR Performance).
Site estático (HTML + CSS + JS puro), sem backend. Lighthouse mobile local: 100 em desempenho, acessibilidade, boas práticas e SEO.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página de vendas |
| `obrigado/index.html` | Página de obrigado + oferta do diagnóstico (R$ 97) |
| `termos/index.html` | Termos de Uso |
| `privacidade/index.html` | Política de Privacidade |
| `assets/main.js` | **Configurações** (checkout, pixel, WhatsApp) + funcionamento da página |
| `assets/styles.css` | Visual da página |
| `assets/img/og-image.jpg` | Imagem que aparece quando o link é compartilhado (1200x630) |
| `assets/img/kit-mockup.svg` | Mockup do kit (o mesmo que está dentro do `index.html`) |
| `vercel.json` | Configuração da Vercel (links sem `.html` e cache) |

---

## 1. Trocar o link do checkout, o pixel e o WhatsApp

> **Já configurado (11/11/2026):** checkout `https://pay.cakto.com.br/966yqov_1312461`, Meta Pixel `1123355403977678` e WhatsApp `5511992137608`. Falta só o `UPSELL_URL`.

Abra `assets/main.js`. As primeiras linhas eram estas:

```js
var CHECKOUT_URL    = "[PREENCHER LINK DO CHECKOUT CAKTO]";
var UPSELL_URL      = "[PREENCHER LINK DO UPSELL]";
var META_PIXEL_ID   = "[PREENCHER PIXEL ID]";
var WHATSAPP_NUMBER = "[PREENCHER WHATSAPP]";
```

Troque o texto entre aspas, mantendo as aspas. Exemplo:

```js
var CHECKOUT_URL    = "https://pay.cakto.com.br/abc123";
var UPSELL_URL      = "https://pay.cakto.com.br/xyz789";
var META_PIXEL_ID   = "123456789012345";
var WHATSAPP_NUMBER = "5519999999999";
```

- **WhatsApp:** só números, com 55 + DDD + número.
- Enquanto um valor estiver como `[PREENCHER...]`, aquela parte fica desligada (o pixel não carrega e os botões só rolam até a oferta). Nada quebra.

### O que acontece automaticamente

- **UTM:** se alguém chega em `kit.vtrperformance.com.br/?utm_source=instagram&utm_medium=reels`, o botão leva para `pay.cakto.com.br/abc123?utm_source=instagram&utm_medium=reels`. Assim a Cakto mostra de onde veio cada venda.
- **Meta Pixel:** `PageView` ao abrir, `ViewContent` ao rolar 50% da página e `InitiateCheckout` ao clicar em qualquer botão de compra (valor 37, BRL).
- **Contador de dias:** mostra "Faltam X dias para a Black Friday" até 27/11 e depois "Faltam X dias para o Natal". É a data real, não reinicia. Depois de 25/12 ele some sozinho.

### Google Tag Manager (GTM-MHCTJ7ZP)

O GTM está instalado em todas as páginas. Além disso, a página envia estes eventos para o `dataLayer`, que você pode usar como acionadores ("Evento personalizado") no GTM, por exemplo para o GA4:

| Evento no dataLayer | Quando acontece |
|---|---|
| `vtr_ViewContent` | Rolou 50% da página de vendas |
| `vtr_InitiateCheckout` | Clicou em um botão de compra |

**Atenção:** o Meta Pixel já está instalado direto na página. **Não** crie uma tag do Meta Pixel dentro do GTM, senão os eventos ficam duplicados no Gerenciador de Anúncios.

### Importante: evento de compra (Purchase)

A página **não** dispara o `Purchase`. Ele precisa ser configurado **dentro da Cakto** (integração com o Meta Pixel / API de Conversões no produto). Sem isso, o Gerenciador de Anúncios não enxerga as vendas.

---

## 2. Itens para preencher nos arquivos HTML

Procure por `[PREENCHER` e `[CONFIRMAR` (Ctrl+F) em cada arquivo:

- **Razão social:** o CNPJ 56.418.923/0001-12 já está no rodapé e nos termos, com o nome "VTR Performance". Troque pelo nome empresarial exato do cartão CNPJ onde houver `[CONFIRMAR RAZÃO SOCIAL]`.
- **E-mail de contato:** já preenchido (agenciavtrperformance@gmail.com).
- **Foto do Vitor:** já está em `assets/img/vitor.webp` (fundo azul). A outra foto (escritório escuro) está em `assets/img/vitor-alternativa.webp`; para trocar, é só renomear os arquivos.
- **Escopo do diagnóstico:** confirme os 4 itens da oferta no `obrigado/index.html`.

---

## 3. Publicar na Vercel (passo a passo)

1. Entre em **vercel.com** e faça login com a sua conta do GitHub.
2. Clique em **Add New… → Project**.
3. Escolha o repositório **VTR-Performance** e clique em **Import**.
4. Em **Root Directory**, clique em **Edit** e escolha a pasta **`kit-fim-de-ano-lp`**.
5. Em **Framework Preset**, deixe **Other**. Não precisa de comando de build.
6. Clique em **Deploy**. Em 1 minuto a página estará num endereço `.vercel.app`. Teste por ele.

Toda vez que um arquivo for alterado no GitHub, a Vercel publica a nova versão sozinha.

## 4. Apontar o subdomínio kit.vtrperformance.com.br

**Na Vercel:**

1. Abra o projeto → **Settings → Domains**.
2. Digite `kit.vtrperformance.com.br` e clique em **Add**.
3. A Vercel vai mostrar um registro do tipo **CNAME**. Anote o valor (geralmente `cname.vercel-dns.com`; use exatamente o que a Vercel mostrar).

**Onde o domínio está registrado** (Registro.br, Hostinger, GoDaddy, Cloudflare etc.):

1. Abra a zona de **DNS** de `vtrperformance.com.br`.
2. Crie um registro novo:
   - **Tipo:** `CNAME`
   - **Nome/Host:** `kit`
   - **Valor/Destino:** o valor que a Vercel mostrou
   - **TTL:** o padrão
3. Salve. Em alguns minutos (às vezes até algumas horas) a Vercel mostra **Valid Configuration** e ativa o HTTPS sozinha.

> No Cloudflare, deixe a nuvem **cinza** (somente DNS) nesse registro.

---

## 5. Configurações na Cakto

- **Página de obrigado:** no produto, configure o redirecionamento após a compra para `https://kit.vtrperformance.com.br/obrigado`.
- **Order bump:** crie o "Pack de prompts de anúncios para lojas de moda (Meta Ads)" por R$ 17 como order bump do kit.
- **Pixel:** adicione o mesmo ID do Meta Pixel no produto, para disparar o `Purchase`.
- **Upsell:** crie o produto "Diagnóstico estratégico da loja" (R$ 97) e cole o link dele em `UPSELL_URL`.

## 6. Depois da Black Friday (a partir de 28/11)

A headline cita Black Friday e Natal. A partir de 28/11, vale trocar a headline no `index.html` por uma versão focada no Natal, por exemplo:

> "Ainda dá tempo: o Natal da sua loja planejado em uma tarde, com o desconto calculado pela sua margem."

Lembre de atualizar também o `<title>` e o `og:title`.

## 7. Depoimentos

Existe um comentário `<!-- DEPOIMENTOS: inserir quando houver -->` no `index.html`. Só coloque depoimentos reais, com autorização de quem escreveu.

---

Os textos de Termos e Privacidade são modelos simples. Vale uma revisão rápida com o seu contador ou advogado.
