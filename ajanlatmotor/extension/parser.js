/*
 * Caradvance Sourcing – mobile.de listing parser.
 * Pure function over an HTML string, so it runs in the content script, the side panel
 * and in Node tests. Three layers: JSON-LD → embedded page state → DOM text patterns.
 * Field patterns come from the Worker's /api/ext/parser-config (versioned); DEFAULT_CONFIG
 * is the bundled fallback.
 */
(function (root) {
  "use strict";

  var DEFAULT_CONFIG = {
    version: 1,
    listing_url: ["/auto-inserat/", "/fahrzeuge/details.html"],
    search_url: ["/fahrzeuge/search.html", "/auto/"],
    search_card_selectors: ["[data-testid^='result-listing']", "article[class*='result']", "a[href*='details.html?id=']"],
    state_markers: ["firstRegistration", "mileage", "make"],
    dom_patterns: {
      km: "(?:Kilometerstand|Mileage)\\s*([\\d.]+)\\s*km",
      first_registration: "(?:Erstzulassung|First registration)\\s*(\\d{2}/\\d{4})",
      power_kw: "(?:Leistung|Power)\\s*(\\d+)\\s*kW",
      price: "(\\d{1,3}(?:\\.\\d{3})+)\\s*€",
      fuel: "(?:Kraftstoffart|Fuel)\\s*([A-Za-zäöüÄÖÜ\\- ]+?)\\s{2,}",
      gearbox: "(?:Getriebe|Transmission)\\s*(Automatik|Schaltgetriebe|Automatic|Manual)",
      color: "(?:Farbe \\(Hersteller\\)|Manufacturer colour)\\s*(.+?)\\s{2,}",
      zip_city: "\\b(\\d{5})\\s+([A-ZÄÖÜ][\\wäöüß\\-]+(?: [\\wäöüß\\-]+){0,3}?)(?=\\s{2}|$)"
    },
    equipment_heading: ["Ausstattung", "Features"],
    critical_fields: ["price_gross_eur", "km", "first_registration", "power_kw", "seller_location"]
  };

  function decode(s) {
    return String(s)
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); });
  }
  function num(v) {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return v;
    var s = String(v).replace(/[^\d.,-]/g, "");
    s = s.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  function firstReg(v) {
    if (!v) return null;
    var s = String(v).trim(), m;
    if ((m = s.match(/^(\d{4})-(\d{2})/))) return m[1] + "-" + m[2];
    if ((m = s.match(/^(\d{1,2})\/(\d{4})$/))) return m[2] + "-" + (m[1].length === 1 ? "0" + m[1] : m[1]);
    if ((m = s.match(/^(\d{4})(\d{2})$/))) return m[1] + "-" + m[2];
    return null;
  }
  function str(v) {
    if (v == null) return null;
    if (typeof v === "object") return v.localized || v.name || v.label || v.value || null;
    return String(v).trim() || null;
  }
  function adIdFromUrl(url) {
    var m = String(url || "").match(/[?&]id=(\d{6,})/) || String(url || "").match(/\/(\d{6,})\.html/);
    return m ? m[1] : null;
  }
  function scripts(html, typeRe) {
    var out = [], re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, m;
    while ((m = re.exec(html))) if (!typeRe || typeRe.test(m[1])) out.push({ attrs: m[1], text: m[2] });
    return out;
  }
  function walk(o, fn, depth) {
    depth = depth || 0;
    if (!o || typeof o !== "object" || depth > 12) return null;
    if (fn(o)) return o;
    var keys = Object.keys(o);
    for (var i = 0; i < keys.length; i++) {
      var r = walk(o[keys[i]], fn, depth + 1);
      if (r) return r;
    }
    return null;
  }

  // ---------- layer 1: JSON-LD ----------
  function fromJsonLd(html) {
    var out = {};
    scripts(html, /application\/ld\+json/i).forEach(function (s) {
      var data;
      try { data = JSON.parse(s.text.trim()); } catch (e) { return; }
      var node = walk(data, function (o) {
        var t = [].concat(o["@type"] || []).join(" ");
        return /\b(Car|Vehicle|Product)\b/.test(t) && (o.mileageFromOdometer || o.vehicleEngine || o.offers || o.brand);
      });
      if (!node) return;
      var offer = [].concat(node.offers || [])[0] || {};
      var seller = offer.seller || offer.offeredBy || {};
      var addr = seller.address || {};
      var engine = [].concat(node.vehicleEngine || [])[0] || {};
      var power = [].concat(engine.enginePower || [])[0] || {};
      var kw = null;
      if (power.value != null) kw = /PS|HP|BHP/i.test(power.unitCode || power.unitText || "") ? Math.round(num(power.value) / 1.35962) : num(power.value);
      var imgs = [].concat(node.image || []).map(function (i) { return typeof i === "string" ? i : i && (i.contentUrl || i.url); }).filter(Boolean);
      set(out, {
        title: str(node.name),
        make: str(node.brand) || str(node.manufacturer),
        model: str(node.model),
        variant: str(node.vehicleConfiguration),
        price_gross_eur: num(offer.price || (offer.priceSpecification || {}).price),
        km: num((node.mileageFromOdometer || {}).value != null ? node.mileageFromOdometer.value : node.mileageFromOdometer),
        first_registration: firstReg(node.dateVehicleFirstRegistered || node.productionDate),
        power_kw: kw,
        fuel: str(engine.fuelType || node.fuelType),
        gearbox: str(node.vehicleTransmission),
        color: str(node.color),
        body: str(node.bodyType),
        images: imgs.length ? imgs : null,
        description_de: str(node.description),
        seller: {
          name: str(seller.name),
          city: str(addr.addressLocality),
          zip: str(addr.postalCode),
          country: str(addr.addressCountry) || "DE",
          lat: seller.geo ? num(seller.geo.latitude) : null,
          lon: seller.geo ? num(seller.geo.longitude) : null,
          type: /Person/i.test([].concat(seller["@type"] || []).join(" ")) ? "private" : "dealer"
        }
      });
    });
    return out;
  }

  // ---------- layer 2: embedded state JSON (located by content shape, not variable name) ----------
  function balancedObjects(text, maxCount) {
    var res = [], i = 0;
    while (res.length < maxCount && (i = text.indexOf("{", i)) !== -1) {
      if (text.charAt(i + 1) !== '"') { i++; continue; }
      var depth = 0, inStr = false, esc = false, j = i;
      for (; j < text.length; j++) {
        var ch = text.charAt(j);
        if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
        if (ch === '"') inStr = true;
        else if (ch === "{") depth++;
        else if (ch === "}") { depth--; if (depth === 0) break; }
      }
      if (depth === 0) {
        try { res.push(JSON.parse(text.slice(i, j + 1))); i = j + 1; continue; } catch (e) { /* not JSON */ }
      }
      i++;
    }
    return res;
  }

  function fromState(html, cfg) {
    var out = {};
    scripts(html).forEach(function (s) {
      if (/ld\+json/i.test(s.attrs)) return;
      if (!cfg.state_markers.every(function (m) { return s.text.indexOf(m) !== -1; })) return;
      balancedObjects(s.text, 6).forEach(function (obj) {
        var ad = walk(obj, function (o) { return o.firstRegistration != null && o.mileage != null && (o.make || o.title); });
        if (!ad) return;
        var price = ad.price || {};
        var seller = ad.contactInfo || ad.seller || ad.dealer || {};
        var loc = seller.location || seller.coordinates || seller.address || {};
        var feats = [].concat(ad.features || ad.equipment || ad.attributes && ad.attributes.features || []).map(function (f) { return str(f); }).filter(Boolean);
        var imgs = [].concat(ad.images || ad.galleryImages || []).map(function (i) {
          return typeof i === "string" ? i : i && (i.uri ? "https://" + String(i.uri).replace(/^https?:\/\//, "") + "?rule=mo-1600" : i.src || i.url);
        }).filter(Boolean);
        set(out, {
          title: str(ad.title),
          make: str(ad.make),
          model: str(ad.model),
          variant: str(ad.modelDescription || ad.subTitle || ad.shortTitle),
          price_gross_eur: num(price.grossAmount != null ? price.grossAmount : price.consumerPriceGross != null ? price.consumerPriceGross : price.gross != null ? price.gross : price.amount != null ? price.amount : ad.price),
          price_net_eur: num(price.netAmount != null ? price.netAmount : price.consumerPriceNet),
          vat_reclaimable: price.vatRate != null ? true : ad.vatReclaimable != null ? !!ad.vatReclaimable : null,
          km: num(ad.mileage),
          first_registration: firstReg(ad.firstRegistration),
          power_kw: num(typeof ad.power === "string" ? (ad.power.match(/(\d+)\s*kW/) || [])[1] : ad.power),
          fuel: str(ad.fuel || ad.fuelType),
          gearbox: str(ad.transmission || ad.gearbox),
          color: str(ad.manufacturerColorName || ad.exteriorColor || ad.color),
          equipment: feats.length ? feats : null,
          accident_free: ad.accidentDamaged === false || ad.damageUnrepaired === false ? true : ad.accidentFree != null ? !!ad.accidentFree : null,
          previous_owners: num(ad.numberOfPreviousOwners != null ? ad.numberOfPreviousOwners : ad.previousOwners),
          images: imgs.length ? imgs : null,
          description_de: str(ad.description),
          seller: {
            name: str(seller.name || seller.companyName),
            city: str(seller.city || loc.city),
            zip: str(seller.zipcode || seller.zip || loc.zipcode),
            country: str(seller.countryCode || loc.countryCode) || "DE",
            lat: num(loc.lat != null ? loc.lat : loc.latitude),
            lon: num(loc.lon != null ? loc.lon : loc.longitude),
            rating: num(seller.rating && (seller.rating.score || seller.rating)),
            type: /FSBO|PRIVATE/i.test(String(seller.type || ad.sellerType || "")) ? "private" : "dealer"
          }
        });
      });
    });
    return out;
  }

  // ---------- layer 3: DOM text patterns ----------
  function fromDom(html, cfg) {
    var body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
    var text = decode(body.replace(/<(br|\/p|\/div|\/li|\/dt|\/dd|\/h\d|\/tr)[^>]*>/gi, "  \n").replace(/<[^>]+>/g, " ")).replace(/[ \t]+\n/g, "\n");
    var P = cfg.dom_patterns, out = {}, m;
    var flat = text.replace(/\n+/g, "  ");
    if ((m = flat.match(new RegExp(P.km, "i")))) out.km = num(m[1]);
    if ((m = flat.match(new RegExp(P.first_registration, "i")))) out.first_registration = firstReg(m[1]);
    if ((m = flat.match(new RegExp(P.power_kw, "i")))) out.power_kw = num(m[1]);
    if ((m = flat.match(new RegExp(P.price)))) out.price_gross_eur = num(m[1]);
    if ((m = flat.match(new RegExp(P.fuel, "i")))) out.fuel = m[1].trim();
    if ((m = flat.match(new RegExp(P.gearbox, "i")))) out.gearbox = m[1];
    if ((m = flat.match(new RegExp(P.color, "i")))) out.color = m[1].trim();
    if ((m = flat.match(new RegExp(P.zip_city)))) out.seller = { zip: m[1], city: m[2].trim(), country: "DE" };
    var h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1) out.title = decode(h1[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    // equipment: <li> items after the equipment heading
    for (var i = 0; i < cfg.equipment_heading.length; i++) {
      var hi = body.search(new RegExp("<h[2-4][^>]*>\\s*" + cfg.equipment_heading[i] + "\\s*<\\/h[2-4]>", "i"));
      if (hi === -1) continue;
      var rest = body.slice(hi + 10);
      var end = rest.search(/<h[2-4][\s>]/i);
      var chunk = end === -1 ? rest : rest.slice(0, end);
      var items = [], re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      while ((m = re.exec(chunk))) items.push(decode(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim());
      if (items.length) { out.equipment = items.filter(Boolean); break; }
    }
    var imgs = [], ire = /<img[^>]+src="([^"]*classistatic\.de[^"]*)"/gi;
    while ((m = ire.exec(body))) imgs.push(decode(m[1]));
    if (imgs.length) out.images = imgs;
    return out;
  }

  function set(target, src) {
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (k === "seller") { target.seller = target.seller || {}; set(target.seller, v || {}); return; }
      if (v !== null && v !== undefined && v !== "" && target[k] == null) target[k] = v;
    });
  }

  function splitMakeModel(out) {
    if ((!out.make || !out.model) && out.title) {
      var makes = ["Mercedes-Benz", "Land Rover", "BMW", "Audi", "Porsche", "Volkswagen", "VW", "Volvo", "Tesla", "Skoda", "MINI", "Lexus", "Toyota", "Cupra"];
      for (var i = 0; i < makes.length; i++) {
        if (out.title.indexOf(makes[i] + " ") === 0) {
          out.make = out.make || makes[i];
          var rest = out.title.slice(makes[i].length + 1).split(" ");
          out.model = out.model || rest.slice(0, 2).join(" ");
          out.variant = out.variant || rest.slice(2).join(" ");
          break;
        }
      }
    }
  }

  function parseListing(html, url, cfg) {
    cfg = cfg || DEFAULT_CONFIG;
    var layers = [];
    var out = {};
    var l1 = fromJsonLd(html), l2 = fromState(html, cfg), l3 = fromDom(html, cfg);
    if (Object.keys(l1).length) layers.push("jsonld");
    if (Object.keys(l2).length) layers.push("state");
    if (Object.keys(l3).length) layers.push("dom");
    set(out, l1); set(out, l2); set(out, l3);
    splitMakeModel(out);
    out.ad_id = adIdFromUrl(url) || out.ad_id || null;
    out.url = url;
    out.seller = out.seller || {};
    if (out.images) out.images = Array.from(new Set(out.images)).slice(0, 40);
    var missing = cfg.critical_fields.filter(function (f) {
      if (f === "seller_location") return !(out.seller.city || (out.seller.lat && out.seller.lon));
      return out[f] == null || out[f] === "";
    });
    return { listing: out, layers: layers, missing: missing, parser_version: cfg.version };
  }

  function isListingUrl(url, cfg) { return (cfg || DEFAULT_CONFIG).listing_url.some(function (p) { return String(url).indexOf(p) !== -1; }); }
  function isSearchUrl(url, cfg) { return (cfg || DEFAULT_CONFIG).search_url.some(function (p) { return String(url).indexOf(p) !== -1; }) && !isListingUrl(url, cfg); }

  var api = { parseListing: parseListing, isListingUrl: isListingUrl, isSearchUrl: isSearchUrl, adIdFromUrl: adIdFromUrl, DEFAULT_CONFIG: DEFAULT_CONFIG };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CaradvanceParser = api;
})(typeof self !== "undefined" ? self : globalThis);
