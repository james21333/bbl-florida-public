(function () {
  const root = document.getElementById("app");
  const barEl = document.getElementById("bar-notice");
  if (!root) return;

  loadContent()
    .then((data) => {
      try {
        renderBarNotice(data, barEl);
        render(data);
      } catch (err) {
        console.error(err);
        root.innerHTML =
          "<p>We loaded the data file but could not render the page. Please hard-refresh (Ctrl+Shift+R or Cmd+Shift+R).</p>";
      }
    })
    .catch((err) => {
      console.error(err);
      root.innerHTML =
        "<p>Unable to load site content. If you opened this page from a file on your computer, use a local web server or visit the live site. Otherwise try a hard refresh.</p>";
      if (barEl) {
        barEl.innerHTML =
          "<p class=\"lead\">* Public information notice will appear when content loads.</p>";
      }
    });

  function loadContent() {
    return fetch("./data/content.json", { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error("content HTTP " + r.status);
      return r.json();
    });
  }

  function renderBarNotice(data, el) {
    if (!el || !data.barNotice) return;
    el.innerHTML =
      "<p class=\"lead\">" +
      esc(data.barNotice.lead) +
      "</p><p>" +
      esc(data.barNotice.body) +
      "</p><p class=\"footnote\">" +
      esc(data.barNotice.footnote) +
      "</p>";
  }

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCase(c, labels) {
    const badges = [];
    if (c.priority === "miami") badges.push(`<span class="badge miami">${esc(labels.miamiBadge)}</span>`);
    if (c.featured) badges.push(`<span class="badge">${esc(labels.featuredBadge)}</span>`);

    const meta = [];
    if (c.court) meta.push(row(labels.court, c.court));
    if (c.filed) meta.push(row(labels.filed, c.filed));
    if (c.status) meta.push(row(labels.status, c.status));
    if (c.procedure) meta.push(row(labels.procedure, c.procedure));
    if (c.incidentDate) meta.push(row(labels.incident, c.incidentDate));
    if (c.location) meta.push(row(labels.location, c.location));
    if (c.plaintiffs) meta.push(row(labels.plaintiffs, fmtParty(c.plaintiffs)));
    if (c.defendants) meta.push(row(labels.defendants, fmtParty(c.defendants)));
    if (c.counselPlaintiff) meta.push(row(labels.plaintiffCounsel, c.counselPlaintiff));
    if (c.counselDefendant) meta.push(row(labels.defendantCounsel, c.counselDefendant));

    const docs = (c.documents || [])
      .map(
        (d) =>
          `<li><a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.label)}</a></li>`
      )
      .join("");

    const cardClass = ["case-card", c.priority === "miami" ? "miami" : "", c.featured ? "featured" : ""]
      .filter(Boolean)
      .join(" ");

    return `
      <article class="${cardClass}">
        <div class="case-head">
          <div class="badges">${badges.join("")}</div>
          <h3>${esc(c.title)}</h3>
        </div>
        <div class="case-body">
          <p>${esc(c.summary)}</p>
          <dl class="case-meta">${meta.join("")}</dl>
          ${docs ? `<ul class="doc-links">${docs}</ul>` : ""}
        </div>
      </article>`;
  }

  function row(label, value) {
    return `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
  }

  function fmtParty(p) {
    return Array.isArray(p) ? p.join("; ") : p;
  }

  function watchCases(data) {
    const mw = data.miamiWatch || {};
    const extra = mw.cases;
    if (extra && extra.length) return extra;
    return (data.cases || []).filter((c) => c.featured && c.priority === "miami");
  }

  function render(data) {
    const L = data.meta && data.meta.lang === "es" ? esLabels : enLabels;
    if (data.meta && data.meta.lang) {
      document.documentElement.lang = data.meta.lang;
    }

    const sections = data.sections || {};
    const miamiWatch = data.miamiWatch || { title: "", subtitle: "" };
    const cases = data.cases || [];
    const newsBlurbs = data.newsBlurbs || [];
    const stats = data.stats || [];
    const sourcing = data.sourcing || [];

    const featured = watchCases(data);
    const featuredIds = new Set(featured.map((c) => c.id));

    const miamiCases = cases.filter(
      (c) => c.priority === "miami" && !featuredIds.has(c.id)
    );
    const otherCases = cases.filter((c) => c.priority !== "miami");

    const watchHtml = featured.map((c) => renderCase(c, L)).join("");

    root.innerHTML = `
      <section class="hero" id="top">
        <h1>${esc(data.meta && data.meta.siteName)}</h1>
        <p>${esc(data.meta && data.meta.tagline)}</p>
        <p class="updated">${esc(L.lastUpdated)} ${esc(data.meta && data.meta.updated)}</p>
      </section>

      <section class="miami-watch-panel" id="miami-watch">
        <h2>${esc(miamiWatch.title)}</h2>
        <p class="subtitle">${esc(miamiWatch.subtitle)}</p>
        <div class="case-grid">${watchHtml || `<p>${esc(L.noFeaturedMiami)}</p>`}</div>
      </section>

      <section class="section" id="miami">
        <h2>${esc(sections.miamiDockets)}</h2>
        <div class="case-grid">${miamiCases.map((c) => renderCase(c, L)).join("")}</div>
      </section>

      <section class="section" id="statewide">
        <h2>${esc(sections.statewide)}</h2>
        <div class="case-grid">${otherCases.map((c) => renderCase(c, L)).join("")}</div>
      </section>

      <section class="section" id="news">
        <h2>${esc(sections.news)}</h2>
        <ul class="news-list">
          ${newsBlurbs
            .map(
              (n) => `
            <li>
              <a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${esc(n.headline)}</a>
              <div class="news-meta">${esc(n.source)} · ${esc(n.date)}</div>
              <p>${esc(n.teaser)}</p>
            </li>`
            )
            .join("")}
        </ul>
      </section>

      <section class="section" id="stats">
        <h2>${esc(sections.stats)}</h2>
        <div class="stats-grid">
          ${stats
            .map(
              (s) => `
            <div class="stat-card">
              <div class="value">${esc(s.value)}</div>
              <div class="label">${esc(s.label)}</div>
              <div class="source">${esc(s.source)}${
                s.url
                  ? ` · <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(L.sourceLink)}</a>`
                  : ""
              }</div>
            </div>`
            )
            .join("")}
        </div>
      </section>

      <section class="section sourcing" id="sources">
        <h2>${esc(sections.howWeSource)}</h2>
        <ul>${sourcing.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </section>`;

    const navWatch = document.querySelector('nav a[href="#miami-watch"]');
    if (navWatch && data.nav && data.nav.watch) {
      navWatch.textContent = data.nav.watch;
    }
  }

  const enLabels = {
    lastUpdated: "Last updated",
    miamiBadge: "Miami area",
    featuredBadge: "Lead case",
    court: "Court",
    filed: "Filed",
    status: "Status",
    procedure: "Procedure",
    incident: "Incident date",
    location: "Location",
    plaintiffs: "Plaintiff(s)",
    defendants: "Defendant(s)",
    plaintiffCounsel: "Plaintiff counsel",
    defendantCounsel: "Defense counsel",
    sourceLink: "Source",
    noFeaturedMiami: "No featured Miami cases listed yet.",
  };

  const esLabels = {
    lastUpdated: "Última actualización",
    miamiBadge: "Área Miami",
    featuredBadge: "Caso principal",
    court: "Tribunal",
    filed: "Presentado",
    status: "Estado",
    procedure: "Procedimiento",
    incident: "Fecha del incidente",
    location: "Lugar",
    plaintiffs: "Demandante(s)",
    defendants: "Demandado(s)",
    plaintiffCounsel: "Abogados del demandante",
    defendantCounsel: "Defensa",
    sourceLink: "Fuente",
    noFeaturedMiami: "Aún no hay casos destacados de Miami.",
  };
})();
