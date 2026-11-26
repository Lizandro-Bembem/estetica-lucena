/* =========================================================
   Estética Lucena — Cadastro e login
   ========================================================= */

/* ---------------------------------------------------------
   CONFIGURAÇÃO
   api: endereço do servidor que cria a conta, faz o login e
   envia os e-mails pelo Brevo. Enquanto estiver vazio, a tela
   funciona (validações, mostrar senha etc.), mas avisa que o
   cadastro online ainda está sendo ativado.

   O servidor deve responder:
     POST {api}/cadastro  { nome, email, telefone, senha } → 201 { usuario: { nome, email, telefone }, token }
     POST {api}/login     { email, senha }                 → 200 { usuario: { nome, email, telefone }, token }
     Erros: 409 = e-mail já cadastrado · 401 = e-mail ou senha incorretos
   --------------------------------------------------------- */
const AUTH_CONFIG = {
    api: '',
};

(function () {
    const q = (s, el = document) => el.querySelector(s);
    const qa = (s, el = document) => [...el.querySelectorAll(s)];

    const modal = q('#auth');
    if (!modal) return;
    const guestView = q('#authGuest');
    const userView = q('#authUser');
    const forms = { login: q('#loginForm'), signup: q('#signupForm') };
    const tabs = qa('.auth__tab', modal);
    const pill = q('.auth__tabs-pill', modal);
    const STORAGE = 'lucena.conta';
    let lastFocus = null;
    let closeTimer = null;

    /* ---------- Sessão salva no aparelho ---------- */
    function lerConta() {
        try { return JSON.parse(localStorage.getItem(STORAGE)) || null; } catch (e) { return null; }
    }
    function salvarConta(conta) {
        try { conta ? localStorage.setItem(STORAGE, JSON.stringify(conta)) : localStorage.removeItem(STORAGE); } catch (e) { /* modo privado */ }
    }
    const primeiroNome = nome => (nome || '').trim().split(/\s+/)[0] || '';

    function atualizarInterface() {
        const conta = lerConta();
        const u = conta && conta.usuario;
        qa('[data-account-label]').forEach(el => { el.textContent = u ? primeiroNome(u.nome) : 'Entrar'; });
        qa('.account-btn').forEach(b => {
            b.classList.toggle('is-logged', !!u);
            b.setAttribute('aria-label', u ? `Minha conta (${primeiroNome(u.nome)})` : 'Entrar ou criar conta');
        });
        guestView.hidden = !!u;
        userView.hidden = !u;
        if (u) {
            q('[data-user-first]', userView).textContent = primeiroNome(u.nome);
            qa('[data-user]', userView).forEach(el => { el.textContent = u[el.dataset.user] || '—'; });
            // já preenche o nome no agendamento
            const bName = q('#bName');
            if (bName && !bName.value.trim()) bName.value = u.nome;
        }
    }

    /* ---------- Abrir / fechar ---------- */
    function focaveis() {
        return qa('button, [href], input, [tabindex]:not([tabindex="-1"])', modal)
            .filter(el => !el.disabled && !el.closest('[hidden]') && el.offsetParent !== null);
    }
    function abrir(aba) {
        clearTimeout(closeTimer);
        lastFocus = document.activeElement;
        if (document.body.classList.contains('menu-open') && typeof toggleMenu === 'function') toggleMenu(false);
        atualizarInterface();
        if (aba) trocarAba(aba, false);
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        void modal.offsetWidth; // garante a animação de entrada
        modal.classList.add('is-open');
        document.body.classList.add('auth-open');
        requestAnimationFrame(() => {
            moverPill();
            // no celular, não abre o teclado sozinho (só no computador)
            if (window.matchMedia('(hover: hover)').matches) {
                const alvo = lerConta() ? q('.auth__close', modal) : q('.auth__form.is-active input', modal);
                alvo && alvo.focus({ preventScroll: true });
            } else {
                q('.auth__close', modal).focus({ preventScroll: true });
            }
        });
    }
    function fechar() {
        if (!modal.classList.contains('is-open')) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('auth-open');
        closeTimer = setTimeout(() => { modal.hidden = true; }, 450);
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    qa('[data-auth-open]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); abrir(); }));
    qa('[data-auth-close]', modal).forEach(el => el.addEventListener('click', e => {
        // o link "Agendar horário" fecha e segue para a seção
        if (!el.getAttribute('href')) e.preventDefault();
        fechar();
    }));
    document.addEventListener('keydown', e => {
        if (!modal.classList.contains('is-open')) return;
        if (e.key === 'Escape') { e.preventDefault(); fechar(); }
        if (e.key === 'Tab') {
            const f = focaveis();
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });
    // abre direto por link: site.com/#conta
    if (location.hash === '#conta') setTimeout(() => abrir(), 1800);

    /* ---------- Abas ---------- */
    function moverPill() {
        const ativa = tabs.find(t => t.classList.contains('is-active'));
        if (!ativa || !pill) return;
        pill.style.width = `${ativa.offsetWidth}px`;
        pill.style.transform = `translateX(${ativa.offsetLeft}px)`;
    }
    function trocarAba(nome, focar = true) {
        tabs.forEach(t => {
            const on = t.dataset.tab === nome;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on);
            t.tabIndex = on ? 0 : -1;
        });
        Object.entries(forms).forEach(([k, f]) => {
            const on = k === nome;
            f.hidden = !on;
            f.classList.toggle('is-active', on);
        });
        moverPill();
        if (focar && window.matchMedia('(hover: hover)').matches) {
            const inp = q('input', forms[nome]);
            inp && inp.focus({ preventScroll: true });
        }
    }
    qa('[data-tab]', modal).forEach(b => b.addEventListener('click', () => trocarAba(b.dataset.tab)));
    q('.auth__tabs', modal).addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const atual = tabs.findIndex(t => t.classList.contains('is-active'));
        const prox = tabs[(atual + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        trocarAba(prox.dataset.tab, false);
        prox.focus();
    });
    window.addEventListener('resize', moverPill);

    /* ---------- Mostrar / esconder senha ---------- */
    qa('.pass-toggle', modal).forEach(btn => {
        const input = q(`#${btn.getAttribute('aria-controls')}`);
        // não tira o foco do campo (evita o teclado do celular fechar e abrir)
        btn.addEventListener('pointerdown', e => e.preventDefault());
        btn.addEventListener('click', () => {
            const mostrar = input.type === 'password';
            const ini = input.selectionStart, fim = input.selectionEnd;
            input.type = mostrar ? 'text' : 'password';
            btn.setAttribute('aria-pressed', mostrar);
            btn.setAttribute('aria-label', mostrar ? 'Esconder senha' : 'Mostrar senha');
            btn.classList.toggle('is-visible', mostrar);
            if (document.activeElement === input && ini !== null) {
                try { input.setSelectionRange(ini, fim); } catch (e) { /* alguns navegadores não permitem */ }
            }
        });
    });

    /* ---------- Máscara do telefone: (71) 99999-9999 ---------- */
    function formatarTelefone(v) {
        const d = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
        if (d.length <= 2) return d.length ? `(${d}` : '';
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    const tel = q('input[name="telefone"]', forms.signup);
    tel.addEventListener('input', () => {
        const antes = tel.value;
        const depois = formatarTelefone(antes);
        if (antes !== depois) {
            tel.value = depois;
            tel.setSelectionRange(depois.length, depois.length);
        }
    });

    /* ---------- Força da senha ---------- */
    const meter = q('.pass-meter span', forms.signup);
    const senhaNova = q('#signupSenha');
    senhaNova.addEventListener('input', () => {
        const s = senhaNova.value;
        let pontos = 0;
        if (s.length >= 8) pontos++;
        if (s.length >= 12) pontos++;
        if (/[a-zA-Z]/.test(s) && /\d/.test(s)) pontos++;
        if (/[^a-zA-Z0-9]/.test(s) || (/[a-z]/.test(s) && /[A-Z]/.test(s))) pontos++;
        meter.style.width = s ? `${Math.max(12, pontos * 25)}%` : '0';
        meter.dataset.nivel = pontos <= 1 ? 'fraca' : pontos <= 2 ? 'media' : 'forte';
    });

    /* ---------- Validação ---------- */
    const REGRAS = {
        nome(v) {
            v = v.trim();
            if (!v) return 'Digite o seu nome.';
            if (v.replace(/[^a-zA-ZÀ-ÿ]/g, '').length < 3) return 'Digite o seu nome completo.';
            return '';
        },
        email(v) {
            v = v.trim();
            if (!v) return 'Digite o seu e-mail.';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Esse e-mail não parece certo. Confira, por favor.';
            return '';
        },
        telefone(v) {
            const d = v.replace(/\D/g, '');
            if (!d) return 'Digite o seu telefone.';
            if (d.length < 10 || Number(d.slice(0, 2)) < 11) return 'Digite o telefone com DDD. Ex.: (71) 99999-9999';
            if (d.length === 11 && d[2] !== '9') return 'Celular com 11 dígitos começa com 9 depois do DDD.';
            return '';
        },
        senha(v, form) {
            if (!v) return 'Digite a sua senha.';
            if (form === forms.signup && v.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
            return '';
        },
    };
    function validarCampo(input) {
        const regra = REGRAS[input.name];
        if (!regra) return true;
        const form = input.form;
        const msg = regra(input.value, form);
        const err = q(`.field__error[data-for="${input.name}"]`, form);
        input.closest('.field').classList.toggle('is-invalid', !!msg);
        input.setAttribute('aria-invalid', !!msg);
        if (err) {
            err.textContent = msg;
            err.id = err.id || `err-${form.id}-${input.name}`;
            msg ? input.setAttribute('aria-describedby', err.id) : input.removeAttribute('aria-describedby');
        }
        return !msg;
    }
    Object.values(forms).forEach(form => {
        qa('input', form).forEach(inp => {
            inp.addEventListener('blur', () => { if (inp.value) validarCampo(inp); });
            inp.addEventListener('input', () => {
                if (inp.closest('.field').classList.contains('is-invalid')) validarCampo(inp);
                aviso(form, '');
            });
        });
    });

    function aviso(form, texto, tipo = 'erro') {
        const el = q('.auth__msg', form);
        el.textContent = texto;
        el.dataset.tipo = tipo;
        el.classList.toggle('is-show', !!texto);
    }
    function carregando(form, sim) {
        const b = q('.auth__submit', form);
        if (!b.dataset.texto) b.dataset.texto = b.textContent;
        b.disabled = sim;
        b.classList.toggle('is-loading', sim);
        b.textContent = sim ? 'Aguarde…' : b.dataset.texto;
    }

    /* ---------- Envio ---------- */
    async function enviar(rota, dados) {
        const r = await fetch(`${AUTH_CONFIG.api.replace(/\/$/, '')}/${rota}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });
        let corpo = {};
        try { corpo = await r.json(); } catch (e) { /* resposta sem JSON */ }
        if (!r.ok) {
            const err = new Error(corpo.mensagem || corpo.message || '');
            err.status = r.status;
            throw err;
        }
        return corpo;
    }
    function mensagemErro(err, rota) {
        if (err.status === 409) return 'Esse e-mail já tem uma conta. Toque em "Entrar" e use a sua senha.';
        if (err.status === 401) return 'E-mail ou senha incorretos.';
        if (err.status === 429) return 'Muitas tentativas. Espere um pouquinho e tente de novo.';
        if (!navigator.onLine || err instanceof TypeError) return 'Sem conexão com a internet. Verifique e tente de novo.';
        return err.message || (rota === 'cadastro' ? 'Não foi possível criar a conta agora. Tente de novo em instantes.' : 'Não foi possível entrar agora. Tente de novo em instantes.');
    }

    Object.entries(forms).forEach(([nome, form]) => {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const campos = qa('input', form);
            const ok = campos.map(validarCampo).every(Boolean);
            if (!ok) {
                const primeiro = q('.is-invalid input', form);
                primeiro && primeiro.focus();
                return;
            }
            const dados = Object.fromEntries(new FormData(form));
            dados.email = dados.email.trim().toLowerCase();
            if (dados.nome) dados.nome = dados.nome.trim().replace(/\s+/g, ' ');
            if (dados.telefone) dados.telefone = '55' + dados.telefone.replace(/\D/g, '');

            if (!AUTH_CONFIG.api) {
                aviso(form, nome === 'signup'
                    ? 'Seus dados estão certinhos! O cadastro online está sendo ativado e fica disponível em breve.'
                    : 'O login online está sendo ativado e fica disponível em breve.', 'info');
                return;
            }

            const rota = nome === 'signup' ? 'cadastro' : 'login';
            carregando(form, true);
            aviso(form, '');
            try {
                const resp = await enviar(rota, dados);
                if (!resp || !resp.usuario) throw new Error('');
                salvarConta({ usuario: resp.usuario, token: resp.token || null });
                form.reset();
                qa('.pass-toggle.is-visible', form).forEach(b => b.click());
                if (meter) meter.style.width = '0';
                atualizarInterface();
                if (typeof mostrarAviso === 'function') {
                    mostrarAviso(rota === 'cadastro'
                        ? `Conta criada, ${primeiroNome(resp.usuario.nome)}! Enviamos um e-mail de boas-vindas.`
                        : `Que bom te ver, ${primeiroNome(resp.usuario.nome)}!`);
                }
                fechar();
            } catch (err) {
                aviso(form, mensagemErro(err, rota));
            } finally {
                carregando(form, false);
            }
        });
    });

    q('#authLogout').addEventListener('click', () => {
        salvarConta(null);
        atualizarInterface();
        trocarAba('login', false);
        if (typeof mostrarAviso === 'function') mostrarAviso('Você saiu da sua conta.');
        fechar();
    });

    atualizarInterface();
})();
