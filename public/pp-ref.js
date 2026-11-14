/*
 * Portfel.pro — przenoszenie tokenu atrybucji na stronie docelowej spółki (inna domena).
 * Użycie: <script src="https://portfel.pro/pp-ref.js" defer></script> + ukryte pole <input type="hidden" name="pp_ref"> w formularzu.
 * Skrypt zapamiętuje ?pp_ref= w sessionStorage tej domeny (do końca wizyty) i uzupełnia ukryte pola.
 * Wartość pp_ref należy przekazać z backendu spółki do webhooka Portfel.pro jako pole "ref".
 */
(function () {
  try {
    var KEY = "pp_ref";
    var v = new URLSearchParams(location.search).get(KEY);
    if (v && /^[A-Za-z0-9]{10,40}$/.test(v)) sessionStorage.setItem(KEY, v);
    v = sessionStorage.getItem(KEY);
    var iq = new URLSearchParams(location.search).get("iqid");
    if (iq && /^\d{1,9}$/.test(iq)) sessionStorage.setItem("iqid", iq);
    iq = sessionStorage.getItem("iqid");
    if (iq) document.addEventListener("DOMContentLoaded", function () { document.querySelectorAll('input[name="iqid"]').forEach(function (el) { el.value = iq; }); });
    if (!v) return;
    var fill = function () {
      document.querySelectorAll('input[name="pp_ref"]').forEach(function (el) { el.value = v; });
      document.querySelectorAll("a[data-pp-ref]").forEach(function (a) {
        var u = new URL(a.href, location.href); u.searchParams.set(KEY, v); a.href = u.toString();
      });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill); else fill();
  } catch (e) { /* brak dostępu do storage — atrybucja tylko z adresu URL */ }
})();
