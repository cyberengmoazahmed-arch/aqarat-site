/* ============================================================
   AQARAT — public site logic
   ============================================================ */
(function () {
  'use strict';

  var App = {};
  var state = {
    q: '', type: 'all', city: 'all', price: 'all',
    furnished: false, sort: 'new',
    current: null, gallery: 0,
    favs: [], compare: [], onlyFav: false
  };

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function t(key, fallback) { return AQ.t(key, fallback); }

  function countUp(el, to) {
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = to;
      return;
    }
    var t0 = performance.now();
    var dur = 850;
    el.textContent = '0';
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function applySettings() {
    var s = AQ.getData().settings;
    var name = s.siteName || 'عقاراتي';
    var tag = s.tagline || 'إيجار وتمليك — شقق مختارة بعناية';
    document.title = name + ' — ' + t('title_tail', 'إيجار وتمليك | شقق مختارة بعناية');
    $('#brandName').textContent = name;
    $('#ftrName').textContent = name;
    $('#ftrName2').textContent = name;
    $('#brandMark').textContent = name.trim().charAt(0) || 'ع';
    $('#brandSub').textContent = tag.split('—')[0].trim();
    $('#ftrAbout').textContent = tag + t('ftr_suffix', ' — الحجز برسالة واتساب واحدة مباشرة.');
    $('#heroTagline').textContent =
      t('hero_tagline', 'اختار الشقة اللي عاجباك، دوس «احجز»، والرسالة هتوصل على واتساب على طول بكل التفاصيل.');

    var wa = AQ.waLink(s.whatsapp, t('wa_greet', 'السلام عليكم، حابب أستفسر عن الشقق الموجودة على الموقع.'));
    ['#hdrWa', '#navWa', '#ftrWa', '#fabWa'].forEach(function (sel) {
      var el = $(sel); if (el) el.href = wa;
    });

    var listings = AQ.getData().listings;
    var avail = listings.filter(function (l) { return l.status === 'available'; }).length;
    var cities = {};
    listings.forEach(function (l) { if (l.city) cities[l.city] = 1; });
    countUp($('#stAvail'), listings.length ? avail : 0);
    countUp($('#stCities'), Object.keys(cities).length || 0);
    $('#year').textContent = new Date().getFullYear();

    var citySel = $('#fCity');
    var cur = citySel.value;
    Array.prototype.slice.call(citySel.options).forEach(function (o) {
      if (o.value !== 'all') o.remove();
    });
    Object.keys(cities).sort(function (a, b) { return a.localeCompare(b, 'ar'); }).forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      citySel.appendChild(o);
    });
    citySel.value = cur;
  }

  /* ---------- filtering ---------- */
  function matchPrice(l, v) {
    if (v === 'all') return true;
    if (!AQ.hasPrice(l)) return false;
    var parts = v.split('-');
    if (parts[0] === 'rent') {
      if (l.type !== 'rent') return false;
      if (parts[1] === 'lt5000') return l.price < 5000;
      if (parts[1] === 'gt20000') return l.price > 20000;
      if (parts.length === 3) return l.price >= +parts[1] && l.price <= +parts[2];
      return true;
    }
    if (parts[0] === 'sale') {
      if (l.type !== 'sale') return false;
      if (parts[1] === 'lt3000000') return l.price < 3000000;
      if (parts[1] === 'gt3000000') return l.price > 3000000;
      return true;
    }
    return true;
  }

  function filtered() {
    var list = AQ.getData().listings.slice();
    var q = state.q.trim().toLowerCase();
    list = list.filter(function (l) {
      if (state.onlyFav && state.favs.indexOf(l.id) === -1) return false;
      if (state.type !== 'all' && l.type !== state.type) return false;
      if (state.city !== 'all' && l.city !== state.city) return false;
      if (state.furnished && !l.furnished) return false;
      if (!matchPrice(l, state.price)) return false;
      if (q) {
        var hay = [l.title, l.city, l.district, l.ref, l.description]
          .join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      if (state.sort === 'area') return (b.area || 0) - (a.area || 0);
      if (state.sort === 'low' || state.sort === 'high') {
        var av = AQ.hasPrice(a) ? Number(a.price) : null;
        var bv = AQ.hasPrice(b) ? Number(b.price) : null;
        if (av === null && bv === null) return 0;
        if (av === null) return 1;   /* بدون سعر يروح للآخر في الترتيبين */
        if (bv === null) return -1;
        return state.sort === 'low' ? av - bv : bv - av;
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    return list;
  }

  /* ---------- rendering ---------- */
  function statusBadge(l) {
    if (l.status === 'booked') return '<span class="badge badge--warn">' + t('status_booked', 'محجوز') + '</span>';
    if (l.status === 'sold') return '<span class="badge badge--off">' + t('status_sold', 'تم البيع') + '</span>';
    return '<span class="badge badge--ok">' + t('status_available', 'متاح') + '</span>';
  }

  function cardSlides(l) {
    var imgs = (l.images && l.images.length) ? l.images : [AQ.placeholder(l.title)];
    return '<div class="card__slides">' + imgs.map(function (src, i) {
      return '<img src="' + AQ.esc(src) + '" alt="' + AQ.esc(l.title) + '" loading="lazy"' +
        (i === 0 ? ' class="is-on"' : '') + '>';
    }).join('') + '</div>';
  }

  function cardHTML(l, idx) {
    var imgs = (l.images && l.images.length) ? l.images : [AQ.placeholder(l.title)];
    var chips = '';
    chips += '<span class="chip">🛏 ' + AQ.esc(AQ.roomsLabel(l.rooms)) + '</span>';
    chips += '<span class="chip">🚿 ' + (l.baths || 0) + ' ' + t('label_baths', 'حمام') + '</span>';
    if (l.area) chips += '<span class="chip">📐 ' + l.area + ' ' + t('label_area_unit', 'م²') + '</span>';
    if (l.furnished) chips += '<span class="chip">🪑 ' + t('label_furn_chip', 'مفروش') + '</span>';

    var dots = imgs.length > 1
      ? '<span class="card__dots">' + imgs.map(function (_, i) {
          return '<i' + (i === 0 ? ' class="is-on"' : '') + '></i>';
        }).join('') + '</span>'
      : '';

    return '' +
      '<article class="card" data-id="' + AQ.esc(l.id) + '" style="--i:' + (idx || 0) + '">' +
        '<div class="card__media" data-open="' + AQ.esc(l.id) + '">' +
          cardSlides(l) +
          '<div class="card__badges">' +
            '<span class="badge badge--type">' + AQ.typeLabel(l.type) + '</span>' +
            statusBadge(l) +
          '</div>' +
          (imgs.length > 1 ? '<span class="card__count">📷 1/' + imgs.length + '</span>' : '') +
          dots +
          '<div class="card__tools">' +
            '<button class="card__tool card__fav' + (isFav(l.id) ? ' is-on' : '') + '" type="button" data-fav="' + AQ.esc(l.id) + '" title="' + (isFav(l.id) ? t('fav_remove', 'شيل من المفضلة') : t('fav_add', 'أضف للمفضلة')) + '" aria-label="' + (isFav(l.id) ? t('fav_remove', 'شيل من المفضلة') : t('fav_add', 'أضف للمفضلة')) + '">' + (isFav(l.id) ? '♥' : '♡') + '</button>' +
            '<button class="card__tool card__cmp' + (isCmp(l.id) ? ' is-on' : '') + '" type="button" data-cmp="' + AQ.esc(l.id) + '" title="' + (isCmp(l.id) ? t('cmp_remove', 'شيل من المقارنة') : t('cmp_add', 'أضف للمقارنة')) + '" aria-label="' + (isCmp(l.id) ? t('cmp_remove', 'شيل من المقارنة') : t('cmp_add', 'أضف للمقارنة')) + '">' + (isCmp(l.id) ? '✓' : '⇄') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="card__body">' +
          '<div class="card__ref">' + t('label_code', 'كود') + ' ' + AQ.esc(l.ref) + '</div>' +
          '<h3 class="card__title" data-open="' + AQ.esc(l.id) + '"><a href="' + AQ.esc(AQ.unitUrl(l)) + '" data-open="' + AQ.esc(l.id) + '">' + AQ.esc(l.title) + '</a></h3>' +
          '<div class="card__loc">📍 ' + AQ.esc(l.city || '') + (l.district ? ' — ' + AQ.esc(l.district) : '') + '</div>' +
          '<div class="card__chips">' + chips + '</div>' +
          '<div class="card__price">' +
          (AQ.hasPrice(l)
            ? '<b>' + AQ.fmtNum(l.price) + '</b><span>' + AQ.priceNote(l) + '</span>'
            : '<b class="is-na">' + t('price_on_call', 'السعر عند الاتصال') + '</b>') +
        '</div>' +
          '<div class="card__actions">' +
            '<button class="btn btn--dark" data-book="' + AQ.esc(l.id) + '">' + t('book_now', 'احجز الآن') + '</button>' +
            '<button class="btn btn--ghost btn--icon" data-open="' + AQ.esc(l.id) + '" aria-label="' + t('aria_details', 'تفاصيل') + '">' + t('details_btn', 'التفاصيل') + '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function resLabel(n) {
    if (n === 1) return t('res_one', 'شقة مطابقة');
    if (n === 2) return t('res_two', 'شققتان مطابقتان');
    if (n >= 3 && n <= 10) return t('res_few', 'شقق مطابقة');
    return t('res_many', 'شقة مطابقة');
  }

  function render() {
    var list = filtered();
    var grid = $('#grid');
    $$('.card__media', grid).forEach(stopSlides);
    $('#resCount').textContent = list.length;
    $('#resLabel').textContent = resLabel(list.length);
    updateFavUI();
    updateCmpBar();

    if (!list.length) {
      grid.innerHTML =
        '<div class="empty">' +
          '<b>' + t('empty_b', 'مفيش شقق مطابقة للفلاتر دي') + '</b>' +
          '<p>' + t('empty_p', 'جرّب تغيّر نوع العرض أو المدينة أو تمسح الفلاتر.') + '</p>' +
        '</div>';
      return;
    }
    grid.innerHTML = list.map(function (l, i) { return cardHTML(l, i); }).join('');
    peekSlides();
    syncFavButtons();
    syncCmpButtons();
  }

  /* ---------- card hover/touch slideshow ---------- */
  function setSlide(media, i) {
    var imgs = $$('.card__slides img', media);
    if (!imgs.length) return;
    i = (i + imgs.length) % imgs.length;
    imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    var c = $('.card__count', media);
    if (c && imgs.length > 1) c.textContent = '📷 ' + (i + 1) + '/' + imgs.length;
    $$('.card__dots i', media).forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
  }

  function startSlides(media) {
    if (media._aqTimer) return;
    var imgs = $$('.card__slides img', media);
    if (imgs.length < 2) return;
    var i = 0;
    $$('.card__slides img', media).forEach(function (im, k) { if (im.classList.contains('is-on')) i = k; });
    media._aqTimer = setInterval(function () {
      setSlide(media, i + 1);
      i = (i + 1) % imgs.length;
    }, 1300);
  }

  function stopSlides(media) {
    if (!media) return;
    if (media._aqTimer) { clearInterval(media._aqTimer); media._aqTimer = null; }
    setSlide(media, 0);
  }

  /* one-time auto "peek" so multi-image cards show they rotate (works on touch too) */
  function peekSlides() {
    $$('.card__media', $('#grid')).forEach(function (media, idx) {
      if ($$('.card__slides img', media).length < 2) return;
      setTimeout(function () {
        if (media._aqTimer || media._aqPeeked) return;
        media._aqPeeked = 1;
        setSlide(media, 1);
        setTimeout(function () {
          if (!media._aqTimer) setSlide(media, 0);
        }, 1500);
      }, 500 + idx * 130);
    });
  }

  /* ---------- favorites + compare ---------- */
  function isFav(id) { return state.favs.indexOf(id) > -1; }
  function isCmp(id) { return state.compare.indexOf(id) > -1; }
  function saveFavs() { AQ.store.set('favs', state.favs); }
  function saveCmp() { AQ.store.set('cmp', state.compare); }

  function syncFavButtons() {
    $$('[data-fav]').forEach(function (b) {
      var on = isFav(b.dataset.fav);
      b.classList.toggle('is-on', on);
      b.textContent = on ? '♥' : '♡';
      var lb = on ? t('fav_remove', 'شيل من المفضلة') : t('fav_add', 'أضف للمفضلة');
      b.setAttribute('aria-label', lb); b.title = lb;
    });
  }

  function syncCmpButtons() {
    $$('[data-cmp]').forEach(function (b) {
      var on = isCmp(b.dataset.cmp);
      b.classList.toggle('is-on', on);
      b.textContent = on ? '✓' : '⇄';
      var lb = on ? t('cmp_remove', 'شيل من المقارنة') : t('cmp_add', 'أضف للمقارنة');
      b.setAttribute('aria-label', lb); b.title = lb;
    });
  }

  function updateFavUI() {
    var el = $('#favN'); if (el) el.textContent = state.favs.length;
    var btn = $('#fFav'); if (btn) btn.classList.toggle('is-on', state.onlyFav);
  }

  function updateCmpBar() {
    var bar = $('#cmpBar'); if (!bar) return;
    var n = state.compare.length;
    bar.hidden = n < 1;
    var c = $('#cmpCount'); if (c) c.textContent = n;
    var go = $('#cmpGo'); if (go) go.disabled = n < 2;
  }

  function toggleFav(id) {
    var i = state.favs.indexOf(id);
    if (i > -1) { state.favs.splice(i, 1); AQ.toast(t('toast_fav_removed', 'اتشالت من المفضلة'), 'info'); }
    else { state.favs.push(id); AQ.toast(t('toast_fav_added', 'اتضافت للمفضلة ❤'), 'ok'); }
    saveFavs(); syncFavButtons(); updateFavUI();
    if (state.onlyFav) render();
  }

  function toggleCmp(id) {
    var i = state.compare.indexOf(id);
    if (i > -1) { state.compare.splice(i, 1); AQ.toast(t('toast_cmp_removed', 'اتشالت من المقارنة'), 'info'); }
    else {
      if (state.compare.length >= 4) { AQ.toast(t('cmp_full', 'بس 4 شقق كحد أقصى للمقارنة'), 'err'); return; }
      state.compare.push(id); AQ.toast(t('toast_cmp_added', 'اتضافت للمقارنة ⇄'), 'ok');
    }
    saveCmp(); syncCmpButtons(); updateCmpBar();
    refreshCmpIfOpen();
  }

  function refreshCmpIfOpen() {
    var m = $('#cmpModal');
    if (!m || !m.classList.contains('is-open')) return;
    if (state.compare.length < 2) closeCmp();
    else $('#cmpPanel').innerHTML = compareHTML();
  }

  function compareHTML() {
    var items = state.compare.map(findListing).filter(Boolean);
    function head(l) {
      var img = (l.images && l.images.length) ? l.images[0] : AQ.placeholder(l.title);
      return '<th class="cmp__col">' +
        '<span class="cmp__thumb"><img src="' + AQ.esc(img) + '" alt="' + AQ.esc(l.title) + '"></span>' +
        '<a class="cmp__name" href="' + AQ.esc(AQ.unitUrl(l)) + '">' + AQ.esc(l.title) + '</a>' +
        '<button class="cmp__x" type="button" data-cmp="' + AQ.esc(l.id) + '" aria-label="' + t('cmp_remove', 'شيل من المقارنة') + '">✕</button>' +
      '</th>';
    }
    var rows = [
      [t('cmp_price', 'السعر'), function (l) {
        return AQ.hasPrice(l)
          ? '<b>' + AQ.fmtNum(l.price) + '</b><br><small>' + AQ.priceNote(l) + '</small>'
          : '<span class="is-na">' + t('price_on_call', 'السعر عند الاتصال') + '</span>';
      }],
      [t('spec_type', 'النوع'), function (l) { return AQ.typeLabel(l.type); }],
      [t('label_city', 'المدينة'), function (l) { return AQ.esc(l.city || '—'); }],
      [t('label_district', 'الحي'), function (l) { return AQ.esc(l.district || '—'); }],
      [t('spec_area', 'المساحة'), function (l) { return l.area ? l.area + ' ' + t('unit_m', 'متر') : '—'; }],
      [t('cmp_price_per_m', 'سعر المتر'), function (l) {
        return (AQ.hasPrice(l) && l.area) ? AQ.fmtNum(Math.round(l.price / l.area)) + ' ' + t('price_cash', 'جنيه') : '—';
      }],
      [t('spec_rooms', 'غرف النوم'), function (l) { return AQ.esc(AQ.roomsLabel(l.rooms)); }],
      [t('spec_baths', 'الحمامات'), function (l) { return l.baths || 0; }],
      [t('spec_floor', 'الدور'), function (l) { return l.floor ? (l.floor === 0 ? t('floor_ground', 'أرضي') : l.floor) : '—'; }],
      [t('label_furn', 'الفرش'), function (l) { return l.furnished ? t('furn_yes', 'مفروش') : t('furn_no', 'غير مفروش'); }],
      [t('spec_code', 'الكود'), function (l) { return AQ.esc(l.ref); }]
    ];
    var body = rows.map(function (r) {
      return '<tr><th>' + r[0] + '</th>' + items.map(function (l) { return '<td>' + r[1](l) + '</td>'; }).join('') + '</tr>';
    }).join('');
    body += '<tr class="cmp__cta"><th></th>' + items.map(function (l) {
      return '<td><button class="btn btn--dark" type="button" data-book="' + AQ.esc(l.id) + '">' + t('book_now', 'احجز الآن') + '</button></td>';
    }).join('') + '</tr>';
    return '<button class="modal__close" data-close aria-label="' + t('aria_close', 'إغلاق') + '">✕</button>' +
      '<div class="cmp">' +
        '<h3 class="cmp__title">' + t('cmp_title', 'مقارنة الشقق') + '</h3>' +
        '<div class="cmp__scroll"><table class="cmp__tbl">' +
          '<thead><tr><th></th>' + items.map(head).join('') + '</tr></thead>' +
          '<tbody>' + body + '</tbody>' +
        '</table></div>' +
      '</div>';
  }

  function openCmp() {
    if (state.compare.length < 2) { AQ.toast(t('cmp_empty', 'اختار شقتين على الأقل للمقارنة'), 'info'); return; }
    $('#cmpPanel').innerHTML = compareHTML();
    $('#cmpModal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeCmp() {
    $('#cmpModal').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ---------- detail modal ---------- */
  function galleryHTML(l) {
    var imgs = (l.images && l.images.length) ? l.images : [AQ.placeholder(l.title)];
    var main = imgs[state.gallery] || imgs[0];
    var thumbs = imgs.length > 1
      ? '<div class="det__thumbs">' + imgs.map(function (src, i) {
          return '<img src="' + AQ.esc(src) + '" data-thumb="' + i + '" class="' +
            (i === state.gallery ? 'is-on' : '') + '" alt="' + t('gallery_img', 'صورة') + ' ' + (i + 1) + '">';
        }).join('') + '</div>'
      : '';
    var rtl = document.documentElement.dir !== 'ltr';
    var nav = imgs.length > 1
      ? '<button class="det__nav det__nav--prev" data-gnav="-1" aria-label="' + t('gallery_prev', 'السابق') + '">' + (rtl ? '›' : '‹') + '</button>' +
        '<button class="det__nav det__nav--next" data-gnav="1" aria-label="' + t('gallery_next', 'التالي') + '">' + (rtl ? '‹' : '›') + '</button>'
      : '';
    return '<div class="det__media">' +
      '<div class="det__main"><img id="detMain" src="' + AQ.esc(main) + '" alt="' + AQ.esc(l.title) + '"></div>' +
      nav + thumbs + '</div>';
  }

  function specBox(l) {
    return '<div class="det__specs">' +
      '<div class="spec"><span>' + t('spec_type', 'النوع') + '</span><b>' + AQ.typeLabel(l.type) +
        (l.furnished ? t('furn_suffix', ' — مفروش') : '') + '</b></div>' +
      '<div class="spec"><span>' + t('spec_area', 'المساحة') + '</span><b>' + (l.area ? l.area + ' ' + t('unit_m', 'متر') : '—') + '</b></div>' +
      '<div class="spec"><span>' + t('spec_rooms', 'غرف النوم') + '</span><b>' + AQ.esc(AQ.roomsLabel(l.rooms)) + '</b></div>' +
      '<div class="spec"><span>' + t('spec_baths', 'الحمامات') + '</span><b>' + (l.baths || 0) + '</b></div>' +
      '<div class="spec"><span>' + t('spec_floor', 'الدور') + '</span><b>' + (l.floor ? (l.floor === 0 ? t('floor_ground', 'أرضي') : l.floor) : '—') + '</b></div>' +
      '<div class="spec"><span>' + t('spec_code', 'الكود') + '</span><b>' + AQ.esc(l.ref) + '</b></div>' +
      '</div>';
  }

  function bookingFormHTML() {
    return '' +
      '<form class="bform" id="bookForm" novalidate>' +
        '<h4>' + t('bform_title', '📩 احجز أو استفسر — الرسالة هتروح على واتساب') + '</h4>' +
        '<div class="row">' +
          '<div class="field" id="fldName">' +
            '<label for="bkName">' + t('label_name', 'الاسم *') + '</label>' +
            '<input id="bkName" name="name" type="text" placeholder="' + t('ph_name', 'اسمك بالكامل') + '" autocomplete="name">' +
            '<div class="err-msg">' + t('err_name', 'اكتب اسمك من فضلك') + '</div>' +
          '</div>' +
          '<div class="field" id="fldPhone">' +
            '<label for="bkPhone">' + t('label_phone', 'رقم التليفون *') + '</label>' +
            '<input id="bkPhone" name="phone" type="tel" inputmode="numeric" placeholder="01xxxxxxxxx" autocomplete="tel">' +
            '<div class="err-msg">' + t('err_phone', 'اكتب رقم موبايل صحيح مكوّن من 11 رقم') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="bkNote">' + t('label_note', 'ملاحظات (اختياري)') + '</label>' +
          '<textarea id="bkNote" name="note" placeholder="' + t('ph_note', 'مثال: مهتم بالمعاينة يوم الخميس مساءً…') + '"></textarea>' +
        '</div>' +
        '<button class="btn btn--wa" type="submit">' + t('submit_booking', 'إرسال الحجز على الواتساب') + '</button>' +
      '</form>';
  }

  function detailHTML(l) {
    return '' +
      '<button class="modal__close" data-close aria-label="' + t('aria_close', 'إغلاق') + '">✕</button>' +
      '<div class="det">' +
        galleryHTML(l) +
        '<div class="det__info">' +
          '<div class="det__badges">' +
            '<span class="badge badge--type">' + AQ.typeLabel(l.type) + '</span>' +
            (l.furnished ? '<span class="badge badge--furn">' + t('label_furn_chip', 'مفروش') + '</span>' : '') +
            statusBadge(l) +
          '</div>' +
          '<h2 class="det__title">' + AQ.esc(l.title) + '</h2>' +
          '<div class="card__loc">📍 ' + AQ.esc(l.city || '') + (l.district ? ' — ' + AQ.esc(l.district) : '') + '</div>' +
          '<div class="det__price' + (AQ.hasPrice(l) ? '' : ' is-na') + '">' +
            (AQ.hasPrice(l)
              ? AQ.fmtNum(l.price) + ' <small>' + AQ.priceNote(l) + '</small>'
              : t('price_on_call', 'السعر عند الاتصال')) +
          '</div>' +
          specBox(l) +
          (l.description ? '<p class="det__desc">' + AQ.esc(l.description) + '</p>' : '') +
          '<div class="det__actions">' +
            '<button class="btn btn--ghost" data-share>' + t('share_btn', '📤 شارك الشقة') + '</button>' +
            '<a class="btn btn--ghost" href="' + AQ.esc(AQ.unitUrl(l)) + '" target="_blank" rel="noopener">' + t('open_page', 'صفحة الشقة') + ' 🔗</a>' +
            '<a class="btn btn--wa" id="detWa" href="#" target="_blank" rel="noopener">' + t('wa_btn', '💬 كلّمنا واتساب') + '</a>' +
          '</div>' +
          bookingFormHTML() +
        '</div>' +
      '</div>';
  }

  function findListing(id) {
    return AQ.getData().listings.filter(function (l) { return l.id === id; })[0] || null;
  }

  function openDetail(id) {
    var l = findListing(id);
    if (!l) return;
    if ($('#cmpModal').classList.contains('is-open')) closeCmp();
    state.current = l;
    state.gallery = 0;
    $('#detPanel').innerHTML = detailHTML(l);
    $('#detModal').classList.add('is-open');
    document.body.style.overflow = 'hidden';

    var s = AQ.getData().settings;
    $('#detWa').href = AQ.waLink(s.whatsapp,
      t('wa_detail_greet', 'السلام عليكم، مستفسر عن الشقة:') + '\n' + l.title +
      '\n' + t('label_code', 'كود') + ': ' + l.ref + '\n' + AQ.priceLabel(l));

    if (location.hash !== '#' + encodeURIComponent(l.ref)) {
      try { history.replaceState(null, '', '#' + encodeURIComponent(l.ref)); } catch (e) {}
    }
  }

  function closeDetail() {
    $('#detModal').classList.remove('is-open');
    document.body.style.overflow = '';
    state.current = null;
    if (location.hash && location.hash.length > 1) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
  }

  function galleryTo(i) {
    var l = state.current;
    if (!l) return;
    var imgs = (l.images && l.images.length) ? l.images : [AQ.placeholder(l.title)];
    state.gallery = (i + imgs.length) % imgs.length;
    $('#detMain').src = imgs[state.gallery];
    $$('.det__thumbs img').forEach(function (t, idx) {
      t.classList.toggle('is-on', idx === state.gallery);
    });
  }

  /* ---------- booking submit ---------- */
  function submitBooking(e) {
    e.preventDefault();
    var l = state.current;
    if (!l) return;
    var name = $('#bkName').value.trim();
    var phone = $('#bkPhone').value.replace(/\D/g, '');
    var note = $('#bkNote').value.trim();
    var ok = true;

    $('#fldName').classList.toggle('field--err', name.length < 2);
    if (name.length < 2) ok = false;
    var phoneOk = /^01[0-2,5]{1}[0-9]{8}$/.test(phone) || /^[1-9][0-9]{7,12}$/.test(phone);
    $('#fldPhone').classList.toggle('field--err', !phoneOk);
    if (!phoneOk) ok = false;

    if (!ok) { AQ.toast(t('toast_bad_data', 'راجع البيانات المطلوبة'), 'err'); return; }

    var msg = AQ.bookingMessage(l, { name: name, phone: phone, note: note });
    AQ.openWhatsApp(AQ.getData().settings.whatsapp, msg);
    AQ.toast(t('toast_wa_ready', 'تم تجهيز الرسالة — هتفتح واتساب دلوقتي ✓'), 'ok');
  }

  /* ---------- events ---------- */
  function bind() {
    $('#fq').addEventListener('input', function () { state.q = this.value; render(); });

    $('#fType').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      state.type = b.dataset.v;
      $$('#fType button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      render();
    });

    $('#fCity').addEventListener('change', function () { state.city = this.value; render(); });
    $('#fPrice').addEventListener('change', function () { state.price = this.value; render(); });
    $('#fFurn').addEventListener('change', function () { state.furnished = this.checked; render(); });
    $('#fSort').addEventListener('change', function () { state.sort = this.value; render(); });

    $('#fReset').addEventListener('click', function () {
      state.q = ''; state.type = 'all'; state.city = 'all';
      state.price = 'all'; state.furnished = false; state.sort = 'new'; state.onlyFav = false;
      $('#fq').value = ''; $('#fCity').value = 'all'; $('#fPrice').value = 'all';
      $('#fFurn').checked = false; $('#fSort').value = 'new';
      $$('#fType button').forEach(function (x, i) { x.classList.toggle('is-on', i === 0); });
      render();
    });

    $('#fFav').addEventListener('click', function () {
      if (!state.favs.length) { AQ.toast(t('toast_fav_empty', 'لسه مضفتش شقق للمفضلة'), 'info'); return; }
      state.onlyFav = !state.onlyFav;
      render();
    });

    $('#cmpGo').addEventListener('click', openCmp);
    $('#cmpClear').addEventListener('click', function () {
      state.compare = [];
      saveCmp(); syncCmpButtons(); updateCmpBar();
    });

    document.addEventListener('click', function (e) {
      var fav = e.target.closest('[data-fav]');
      if (fav) { toggleFav(fav.dataset.fav); return; }

      var cmp = e.target.closest('[data-cmp]');
      if (cmp) { toggleCmp(cmp.dataset.cmp); return; }

      var open = e.target.closest('[data-open]');
      if (open) {
        var isAnchor = open.tagName === 'A' && open.getAttribute('href');
        if (isAnchor && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)) return; /* new tab -> static page */
        if (isAnchor) e.preventDefault();
        openDetail(open.dataset.open);
        return;
      }

      var book = e.target.closest('[data-book]');
      if (book) {
        openDetail(book.dataset.book);
        setTimeout(function () {
          var f = $('#bkName'); if (f) f.focus({ preventScroll: false });
        }, 250);
        return;
      }

      var cl = e.target.closest('[data-close]');
      if (cl) {
        var m = cl.closest('.modal');
        if (m && m.id === 'cmpModal') closeCmp(); else closeDetail();
        return;
      }

      var nav = e.target.closest('[data-gnav]');
      if (nav) { galleryTo(state.gallery + Number(nav.dataset.gnav)); return; }

      var th = e.target.closest('[data-thumb]');
      if (th) { galleryTo(Number(th.dataset.thumb)); return; }

      if (e.target.closest('[data-share]')) {
        var l = state.current;
        if (!l) return;
        var text = l.title + '\n' + AQ.priceLabel(l) +
          (AQ.listingUrl(l) ? '\n' + AQ.listingUrl(l) : '');
        if (navigator.share) {
          navigator.share({ title: l.title, text: text, url: AQ.listingUrl(l) || undefined }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            AQ.toast(t('toast_copied', 'تم نسخ بيانات الشقة ✓'), 'ok');
          });
        } else {
          AQ.toast(t('toast_copy_link', 'انسخ اللينك من شريط العنوان'), 'info');
        }
      }
    });

    document.addEventListener('submit', function (e) {
      if (e.target.id === 'bookForm') submitBooking(e);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var cm = $('#cmpModal');
        if (cm && cm.classList.contains('is-open')) { closeCmp(); return; }
        if ($('#detModal').classList.contains('is-open')) closeDetail();
      }
      if ($('#detModal').classList.contains('is-open') && state.current) {
        var imgs = state.current.images || [];
        if (e.key === 'ArrowLeft') galleryTo(state.gallery + 1);
        if (e.key === 'ArrowRight') galleryTo(state.gallery - 1);
      }
    });

    $('#burger').addEventListener('click', function () {
      var nav = $('.hdr__nav');
      nav.classList.toggle('is-open');
      this.textContent = nav.classList.contains('is-open') ? '✕' : '☰';
    });
    $$('.hdr__nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        $('.hdr__nav').classList.remove('is-open');
        $('#burger').textContent = '☰';
      });
    });

    $('#langBtn').addEventListener('click', function () {
      if (window.I18N) I18N.set(I18N.lang() === 'ar' ? 'en' : 'ar');
    });

    document.addEventListener('aq:lang', function () {
      applySettings();
      render();
      if (state.current) openDetail(state.current.id);
    });

    /* card hover slideshow (delegated) */
    var grid = $('#grid');
    grid.addEventListener('mouseover', function (e) {
      var media = e.target.closest('.card__media');
      if (media && grid.contains(media)) startSlides(media);
    });
    grid.addEventListener('mouseout', function (e) {
      var media = e.target.closest('.card__media');
      if (!media) return;
      if (e.relatedTarget && media.contains(e.relatedTarget)) return;
      stopSlides(media);
    });
    grid.addEventListener('mouseleave', function () {
      $$('.card__media', grid).forEach(stopSlides);
    });

    /* touch swipe on card image (mobile gallery) */
    var touch = null;
    var swiped = false;
    grid.addEventListener('touchstart', function (e) {
      var media = e.target.closest('.card__media');
      touch = media ? { x: e.touches[0].clientX, y: e.touches[0].clientY, media: media } : null;
      swiped = false;
    }, { passive: true });
    grid.addEventListener('touchend', function (e) {
      if (!touch) return;
      var dx = e.changedTouches[0].clientX - touch.x;
      var dy = e.changedTouches[0].clientY - touch.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        var imgs = $$('.card__slides img', touch.media);
        if (imgs.length > 1) {
          swiped = true;
          var cur = 0;
          imgs.forEach(function (im, i) { if (im.classList.contains('is-on')) cur = i; });
          var fwd = document.documentElement.dir === 'ltr' ? dx < 0 : dx > 0;
          setSlide(touch.media, cur + (fwd ? 1 : -1));
        }
      }
      touch = null;
    }, { passive: true });
    grid.addEventListener('click', function (e) {
      if (swiped) { swiped = false; e.stopPropagation(); e.preventDefault(); }
    }, true);

    /* sticky header shadow on scroll */
    var hdr = $('.hdr');
    window.addEventListener('scroll', function () {
      hdr.classList.toggle('is-scrolled', (window.scrollY || 0) > 8);
    }, { passive: true });

    /* reveal-on-scroll */
    var revs = $$('[data-reveal]');
    if ('IntersectionObserver' in window && revs.length) {
      revs.forEach(function (el) { el.classList.add('reveal'); });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revs.forEach(function (el) { io.observe(el); });
    } else {
      revs.forEach(function (el) { el.classList.add('reveal', 'is-in'); });
    }
  }

  /* ---------- boot ---------- */
  App.boot = function () {
    var data = AQ.getData();
    if (!data.listings.length && !window.LISTINGS_DATA) {
      $('#grid').innerHTML =
        '<div class="empty"><b>' + t('data_error_b', 'تعذّر تحميل بيانات الشقق') + '</b>' +
        '<p>' + t('data_error_p', 'اتأكد إنك بتفتح الموقع من سيرفر محلي أو إن ملف data/listings.js موجود.') + '</p></div>';
      return;
    }
    var known = {};
    data.listings.forEach(function (l) { known[l.id] = 1; });
    state.favs = (AQ.store.get('favs', []) || []).filter(function (id) { return known[id]; });
    state.compare = (AQ.store.get('cmp', []) || []).filter(function (id) { return known[id]; });
    applySettings();
    bind();
    render();

    if (location.hash.length > 1) {
      var ref = decodeURIComponent(location.hash.slice(1));
      var hit = data.listings.filter(function (l) { return l.ref === ref; })[0];
      if (hit) setTimeout(function () { openDetail(hit.id); }, 300);
    }
  };

  window.App = App;

  /* load data (cache-busted) then boot — external, no inline scripts (CSP) */
  var s = document.createElement('script');
  s.src = 'data/listings.js?t=' + Date.now();
  s.onload = function () { App.boot(); };
  s.onerror = function () { App.boot(); };
  document.head.appendChild(s);
})();
