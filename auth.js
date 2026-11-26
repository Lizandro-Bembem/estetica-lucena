/* =========================================================
   Estética Lucena — Cadastro e login
   Contas: Supabase (gratuito; guarda as senhas com segurança e
   funciona direto do GitHub Pages, sem servidor próprio).
   E-mails (confirmação de cadastro e "esqueci minha senha"):
   enviados pelo Brevo, configurado como SMTP dentro do Supabase.
   Passo a passo completo no README.md → "Cadastro e login".
   ========================================================= */

/* ---------------------------------------------------------
   CONFIGURAÇÃO — cole aqui os dados do projeto Supabase
   (Supabase → Project Settings → API). A chave "anon public"
   foi feita para ficar no site: ela NÃO é a chave do Brevo.
   Enquanto estiver vazio, a tela funciona (validações, mostrar
   senha etc.) e avisa que o cadastro online está sendo ativado.
   --------------------------------------------------------- */
const AUTH_CONFIG = {
    supabaseUrl: '',   // ex.: 'https://abcdefgh.supabase.co'
    supabaseChave: '', // ex.: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'
};

(function () {
    const q = (s, el = document) => el.querySelector(s);
    const qa = (s, el = document) => [...el.querySelectorAll(s)];

    const modal = q('#auth');
    if (!modal) return;
    const guestView = q('#authGuest');
    const userView = q('#authUser');
    const tabsBox = q('.auth__tabs', modal);
    const forms = { login: q('#loginForm'), signup: q('#signupForm'), nova: q('#novaSenhaForm') };
    const tabs = qa('.auth__tab', modal);
    const pill = q('.auth__tabs-pill', modal);
    const configurado = !!(AUTH_CONFIG.supabaseUrl && AUTH_CONFIG.supabaseChave);
    const voltarPara = location.origin + location.pathname;
    let usuario = null;
    let lastFocus = null;
    let closeTimer = null;

    /* ---------- Supabase (carregado só quando configurado) ---------- */
    let sbPromise = null;
    function supabase() {
        if (!configurado) return Promise.resolve(null);
        if (!sbPromise) {
            sbPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm').then(({ createClient }) => {
                const sb = createClient(AUTH_CONFIG.supabaseUrl, AUTH_CONFIG.supabaseChave, {
                    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'lucena.auth' },
                });
                sb.auth.onAuthStateChange((evento, sessao) => {
                    usuario = usuarioDe(sessao);
                    atualizarInterface();
                    if (evento === 'PASSWORD_RECOVERY') setTimeout(() => abrir('nova'), 300);
                });
                return sb;
            }).catch(() => { sbPromise = null; return null; });
        }
        return sbPromise;
    }
    function usuarioDe(sessao) {
        const u = sessao && sessao.user;
        if (!u) return null;
        const m = u.user_metadata || {};
        return { nome: m.nome || '', email: u.email || '', telefone: m.telefone || '' };
    }

    /* ---------- Interface ---------- */
    const primeiroNome = nome => (nome || '').trim().split(/\s+/)[0] || '';
    function formatarTelefone(v) {
        const d = String(v || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
        if (d.length <= 2) return d.length ? `(${d}` : '';
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    function atualizarInterface() {
        const u = usuario;
        qa('[data-account-label]').forEach(el => { el.textContent = u ? (primeiroNome(u.nome) || 'Minha conta') : 'Entrar'; });
        qa('.account-btn').forEach(b => {
            b.classList.toggle('is-logged', !!u);
            b.setAttribute('aria-label', u ? 'Minha conta' : 'Entrar ou criar conta');
        });
        const emRecuperacao = forms.nova.classList.contains('is-active');
        guestView.hidden = !!u && !emRecuperacao;
        userView.hidden = !u || emRecuperacao;
        if (u) {
            q('[data-user-first]', userView).textContent = primeiroNome(u.nome) || 'cliente';
            q('[data-user="nome"]', userView).textContent = u.nome || '—';
            q('[data-user="email"]', userView).textContent = u.email || '—';
            q('[data-user="telefone"]', userView).textContent = formatarTelefone(u.telefone) || '—';
            const bName = q('#bName');
            if (bName && !bName.value.trim() && u.nome) bName.value = u.nome;
        }
    }

    /* ---------- Abrir / fechar ---------- */
    const temMouse = () => window.matchMedia('(hover: hover)').matches;
    function focaveis() {
        return qa('button, [href], input, [tabindex]:not([tabindex="-1"])', modal)
            .filter(el => !el.disabled && !el.closest('[hidden]') && el.offsetParent !== null);
    }
    function abrir(aba) {
        clearTimeout(closeTimer);
        if (!modal.classList.contains('is-open')) lastFocus = document.activeElement;
        if (document.body.classList.contains('menu-open') && typeof toggleMenu === 'function') toggleMenu(false);
        trocarAba(aba || (forms.nova.classList.contains('is-active') ? 'login' : currentTab()), false);
        atualizarInterface();
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        void modal.offsetWidth; // garante a animação de entrada
        modal.classList.add('is-open');
        document.body.classList.add('auth-open');
        requestAnimationFrame(() => {
            moverPill();
            // no celular não abre o teclado sozinho
            const alvo = temMouse() && guestView.hidden === false ? q('.auth__form.is-active input', modal) : q('.auth__close', modal);
            alvo && alvo.focus({ preventScroll: true });
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
        if (!el.getAttribute('href')) e.preventDefault(); // "Agendar horário" fecha e segue para a seção
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
    if (location.hash === '#conta') setTimeout(() => abrir(), 1800);

    /* ---------- Abas ---------- */
    function currentTab() { return forms.signup.classList.contains('is-active') ? 'signup' : 'login'; }
    function moverPill() {
        const ativa = tabs.find(t => t.classList.contains('is-active'));
        if (!ativa || !pill || !ativa.offsetWidth) return;
        pill.style.width = `${ativa.offsetWidth}px`;
        pill.style.transform = `translateX(${ativa.offsetLeft}px)`;
    }
    function trocarAba(nome, focar = true) {
        tabsBox.hidden = nome === 'nova';
        q('#authTitle').innerHTML = nome === 'nova' ? 'Nova <em>senha</em>' : 'Bem-vinda à <em>Lucena</em>';
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
        if (focar && temMouse()) {
            const inp = q('input', forms[nome]);
            inp && inp.focus({ preventScroll: true });
        }
    }
    qa('[data-tab]', modal).forEach(b => b.addEventListener('click', () => trocarAba(b.dataset.tab)));
    tabsBox.addEventListener('keydown', e => {
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
        btn.addEventListener('pointerdown', e => e.preventDefault()); // mantém o teclado aberto
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
    function esconderSenhas(form) {
        qa('.pass-toggle.is-visible', form).forEach(b => b.click());
    }

    /* ---------- Máscara do telefone ---------- */
    const tel = q('input[name="telefone"]', forms.signup);
    tel.addEventListener('input', () => {
        const novo = formatarTelefone(tel.value);
        if (novo !== tel.value) {
            tel.value = novo;
            tel.setSelectionRange(novo.length, novo.length);
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
            if (form !== forms.login && v.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
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
    function mensagemErro(err) {
        const cod = (err && (err.code || '')) + ' ' + (err && err.message || '');
        if (/user_already_exists|already registered/i.test(cod)) return 'Esse e-mail já tem uma conta. Toque em "Entrar" e use a sua senha.';
        if (/invalid_credentials|invalid login/i.test(cod)) return 'E-mail ou senha incorretos.';
        if (/email_not_confirmed|not confirmed/i.test(cod)) return 'Falta confirmar o seu e-mail. Abra a mensagem que enviamos e toque no link.';
        if (/weak_password|password should/i.test(cod)) return 'Essa senha é fraca. Use pelo menos 8 caracteres, misturando letras e números.';
        if (/same_password|different from the old/i.test(cod)) return 'A nova senha precisa ser diferente da anterior.';
        if (/rate_limit|too many|429/i.test(cod) || (err && err.status === 429)) return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
        if (!navigator.onLine || /fetch|network/i.test(cod)) return 'Sem conexão com a internet. Verifique e tente de novo.';
        return 'Não foi possível concluir agora. Tente de novo em instantes.';
    }
    const EM_BREVE = 'O cadastro online está sendo ativado e fica disponível em breve. Enquanto isso, agende pelo botão "Agendar".';

    /* ---------- Envio dos formulários ---------- */
    Object.entries(forms).forEach(([nome, form]) => {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const ok = qa('input', form).map(validarCampo).every(Boolean);
            if (!ok) {
                const primeiro = q('.is-invalid input', form);
                primeiro && primeiro.focus();
                return;
            }
            const dados = Object.fromEntries(new FormData(form));
            if (dados.email) dados.email = dados.email.trim().toLowerCase();
            if (dados.nome) dados.nome = dados.nome.trim().replace(/\s+/g, ' ');
            if (dados.telefone) dados.telefone = '55' + dados.telefone.replace(/\D/g, '');

            if (!configurado) {
                aviso(form, nome === 'signup' ? 'Seus dados estão certinhos! ' + EM_BREVE : EM_BREVE, 'info');
                return;
            }

            carregando(form, true);
            aviso(form, '');
            try {
                const sb = await supabase();
                if (!sb) throw new Error('network');

                if (nome === 'signup') {
                    const { data, error } = await sb.auth.signUp({
                        email: dados.email,
                        password: dados.senha,
                        options: { data: { nome: dados.nome, telefone: dados.telefone }, emailRedirectTo: voltarPara },
                    });
                    if (error) throw error;
                    // o Supabase não revela se o e-mail já existe: devolve um usuário sem identidades
                    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
                        throw { code: 'user_already_exists' };
                    }
                    form.reset(); esconderSenhas(form); meter.style.width = '0';
                    if (!data.session) {
                        aviso(form, `Quase lá! Enviamos um e-mail para ${dados.email}. Abra a mensagem e toque no link para ativar a sua conta.`, 'ok');
                        return;
                    }
                    fechar();
                    mostrarAviso(`Conta criada! Bem-vinda, ${primeiroNome(dados.nome)}. ✨`);
                }

                if (nome === 'login') {
                    const { data, error } = await sb.auth.signInWithPassword({ email: dados.email, password: dados.senha });
                    if (error) throw error;
                    form.reset(); esconderSenhas(form);
                    usuario = usuarioDe(data.session);
                    atualizarInterface();
                    fechar();
                    mostrarAviso(`Que bom te ver${usuario && usuario.nome ? ', ' + primeiroNome(usuario.nome) : ''}! ✨`);
                }

                if (nome === 'nova') {
                    const { error } = await sb.auth.updateUser({ password: dados.senha });
                    if (error) throw error;
                    form.reset(); esconderSenhas(form);
                    trocarAba('login', false);
                    atualizarInterface();
                    fechar();
                    mostrarAviso('Senha alterada com sucesso!');
                }
            } catch (err) {
                aviso(form, mensagemErro(err));
            } finally {
                carregando(form, false);
            }
        });
    });

    /* ---------- Esqueci minha senha ---------- */
    q('[data-forgot]', forms.login).addEventListener('click', async () => {
        const form = forms.login;
        const email = q('input[name="email"]', form);
        if (!validarCampo(email)) {
            aviso(form, 'Digite o seu e-mail acima e toque de novo em "Esqueci minha senha".', 'info');
            email.focus();
            return;
        }
        if (!configurado) { aviso(form, EM_BREVE, 'info'); return; }
        try {
            const sb = await supabase();
            if (!sb) throw new Error('network');
            const { error } = await sb.auth.resetPasswordForEmail(email.value.trim().toLowerCase(), { redirectTo: voltarPara });
            if (error) throw error;
            aviso(form, 'Se esse e-mail tiver conta, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.', 'ok');
        } catch (err) {
            aviso(form, mensagemErro(err));
        }
    });

    /* ---------- Sair ---------- */
    q('#authLogout').addEventListener('click', async () => {
        try { const sb = await supabase(); if (sb) await sb.auth.signOut(); } catch (e) { /* sai localmente mesmo assim */ }
        usuario = null;
        atualizarInterface();
        trocarAba('login', false);
        fechar();
        mostrarAviso('Você saiu da sua conta.');
    });

    /* ---------- Início ---------- */
    atualizarInterface();
    if (configurado) {
        supabase().then(sb => sb && sb.auth.getSession()).then(r => {
            if (r && r.data) { usuario = usuarioDe(r.data.session); atualizarInterface(); }
        }).catch(() => {});
    }
})();
