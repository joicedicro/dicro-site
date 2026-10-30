/* Dicró Odontologia — rastreamento de cliques no agendamento online (GA4)
 * Evento único: agendamento_online_click (parâmetro "origem": botao | acesso_direto)
 * - Nunca chama preventDefault: o agendamento abre normalmente, com ou sem Analytics.
 * - Envio por beacon: o evento sobrevive à abertura de nova aba ou troca de página.
 * - Anti-duplicidade por marcador do próprio clique (?ag=b) apenas nos links /agendar
 *   do site: a página /agendar só não conta quando o acesso veio desse clique.
 *   Não há janela de tempo, então acessos legítimos seguidos são contados normalmente.
 */
(function () {
  var INTERNO_RE = /^(?:https?:\/\/(?:www\.)?dicro\.com\.br)?\/(agendar|agendaonline|agendamento-online)\/?(?:[?#].*)?$/i;
  var EXTERNO_RE = /simplesdental\.com\/simples\/agendamento\//i;

  function enviar(params) {
    try {
      if (typeof window.gtag === 'function') {
        params.transport_type = 'beacon';
        window.gtag('event', 'agendamento_online_click', params);
      }
    } catch (e) { /* nunca bloqueia o agendamento */ }
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var interno = INTERNO_RE.test(href);
    if (!interno && !EXTERNO_RE.test(href)) return;

    if (interno) {
      // Marca este clique na própria URL (ex.: https://www.dicro.com.br/agendar?ag=b)
      try {
        var u = new URL(a.href, location.href);
        if (u.searchParams.get('ag') !== 'b') {
          if (/^dicro\.com\.br$/i.test(u.hostname)) u.hostname = 'www.dicro.com.br'; // evita depender do redirecionamento do domínio
          u.searchParams.set('ag', 'b');
          var original = href;
          a.setAttribute('href', u.toString());
          setTimeout(function () { a.setAttribute('href', original); }, 0);
        }
      } catch (e) {}
    }

    enviar({
      event_category: 'Agendamento',
      event_label: 'Agendamento online',
      origem: 'botao',
      link_text: (a.textContent || '').trim().slice(0, 60),
      pagina: location.pathname
    });
  }, true);
})();