/* ============================================================
   AQARAT — public site logic
   ============================================================ */
(function () {
  'use strict';

  var App = {};
  var state = {
    q: '', type: 'all', city: 'all', price: 'all',
    furnished: false, sort: 'new',
    current: null, gallery: 0
  };

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function applySettings() {
    var s = AQ.getData().settings;
    var name = s.siteName || 'عقاراتي';
    var tag = s.tagline || 'إيجار وتمليك — شقق مختارة بعناية';
    document.title = name + ' — إيجار وتمليك | شقق مختارة بعناية';
    $('#brandName').textContent = name;
    $('#ftrName').textContent = name;
    $('#ftrName2').textContent = name;
    $('#brandMark').textContent = name.trim().charAt(0) || 'ع';
    $('#brandSub').textContent = tag.split('—')[0].trim();
    $('#ftrAbout').textContent = tag + ' — الحجز برسالة واتساب واحدة مباشرة.';
    $('#heroTagline').textContent =
      'اختار الشقة اللي عاجباك، دوس «احجز»، والرسالة هتوصل على واتساب على طول بكل التفاصيل.';

    var wa = AQ.waLink(s.whatsapp, 'السلام عليكم، حابب أستفسر عن الشقق الموجودة على الموقع.');
    ['#hdrWa', '#navWa', '#ftrWa', '#fabWa'].forEach(function (sel) {
      var el = $(sel); if (el) el.href = wa;
    });

    var listings = AQ.getData().listings;
    var avail = listings.filter(function (l) { return l.status === 'available'; }).length;
    var cities = {};
    listings.forEach(function (l) { if (l.city) cities[l.city] = 1; });
    $('#stAvail').textContent = listings.length ? avail : '0';
    $('#stCities').textContent = Object.keys(cities).length || '0';
    $('#year').textContent = new Date().getFullYear();

    var citySel = $('#fCity');
    var cur = citySel.value;
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
      if (state.sort === 'low') return a.price - b.price;
      if (state.sort === 'high') return b.price - a.price;
      if (state.sort === 'area') return (b.area || 0) - (a.area || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    return list;
  }

  /* ---------- rendering ---------- */
  function statusBadge(l) {
    if (l.status === 'booked') return '<span class="badge badge--warn">محجوز</span>';
    if (l.status === 'sold') return '<span class="badge badge--off">تم البيع</span>';
    return '<span class="badge badge--ok">متاح</span>';
  }

  function cardImg(l) {
    var src = (l.images && l.images[0]) || '';
    if (!src) src = AQ.placeholder(l.title);
    return '<img src="' + AQ.esc(src) + '" alt="' + AQ.esc(l.title) + '" loading="lazy" ' +
      'onerror="this.onerror=null;this.src=\'' + AQ.placeholder('') + '\'">';
  }

  function cardHTML(l) {
    var chips = '';
    chips += '<span class="chip">🛏 ' + AQ.esc(AQ.roomsLabel(l.rooms)) + '</span>';
    chips += '<span class="chip">🚿 ' + (l.baths || 0) + ' حمام</span>';
    if (l.area) chips += '<span class="chip">📐 ' + l.area + ' م²</span>';
    if (l.furnished) chips += '<span class="chip">🪑 مفروش</span>';

    return '' +
      '<article class="card" data-id="' + AQ.esc(l.id) + '">' +
        '<div class="card__media" data-open="' + AQ.esc(l.id) + '">' +
          cardImg(l) +
          '<div class="card__badges">' +
            '<span class="badge badge--type">' + AQ.typeLabel(l.type) + '</span>' +
            statusBadge(l) +
          '</div>' +
          ((l.images && l.images.length > 1) ? '<span class="card__count">📷 ' + l.images.length + ' صور</span>' : '') +
        '</div>' +
        '<div class="card__body">' +
          '<div class="card__ref">كود ' + AQ.esc(l.ref) + '</div>' +
          '<h3 class="card__title" data-open="' + AQ.esc(l.id) + '">' + AQ.esc(l.title) + '</h3>' +
          '<div class="card__loc">📍 ' + AQ.esc(l.city || '') + (l.district ? ' — ' + AQ.esc(l.district) : '') + '</div>' +
          '<div class="card__chips">' + chips + '</div>' +
          '<div class="card__price"><b>' + AQ.fmtNum(l.price) + '</b><span>' + AQ.priceNote(l) + '</span></div>' +
          '<div class="card__actions">' +
            '<button class="btn btn--dark" data-book="' + AQ.esc(l.id) + '">احجز الآن</button>' +
            '<button class="btn btn--ghost btn--icon" data-open="' + AQ.esc(l.id) + '" aria-label="تفاصيل">التفاصيل</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function render() {
    var list = filtered();
    var grid = $('#grid');
    $('#resCount').textContent = list.length;
    $('#resLabel').textContent = list.length === 1 ? 'شقة مطابقة'
      : list.length === 2 ? 'شققتان مطابقتان'
      : list.length >= 3 && list.length <= 10 ? 'شقق مطابقة' : 'شقة مطابقة';

    if (!list.length) {
      grid.innerHTML =
        '<div class="empty">' +
          '<b>مفيش شقق مطابقة للفلاتر دي</b>' +
          '<p>جرّب تغيّر نوع العرض أو المدينة أو تمسح الفلاتر.</p>' +
        '</div>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join('');
  }

  /* ---------- detail modal ---------- */
  function galleryHTML(l) {
    var imgs = (l.images && l.images.length) ? l.images : [AQ.placeholder(l.title)];
    var main = imgs[state.gallery] || imgs[0];
    var thumbs = imgs.length > 1
      ? '<div class="det__thumbs">' + imgs.map(function (src, i) {
          return '<img src="' + AQ.esc(src) + '" data-thumb="' + i + '" class="' +
            (i === state.gallery ? 'is-on' : '') + '" alt="صورة ' + (i + 1) + '">';
        }).join('') + '</div>'
      : '';
    var nav = imgs.length > 1
      ? '<button class="det__nav det__nav--prev" data-gnav="-1" aria-label="السابق">›</button>' +
        '<button class="det__nav det__nav--next" data-gnav="1" aria-label="التالي">‹</button>'
      : '';
    return '<div class="det__media">' +
      '<div class="det__main"><img id="detMain" src="' + AQ.esc(main) + '" alt="' + AQ.esc(l.title) + '"></div>' +
      nav + thumbs + '</div>';
  }

  function specBox(l) {
    return '<div class="det__specs">' +
      '<div class="spec"><span>النوع</span><b>' + AQ.typeLabel(l.type) + (l.furnished ? ' — مفروش' : '') + '</b></div>' +
      '<div class="spec"><span>المساحة</span><b>' + (l.area ? l.area + ' متر' : '—') + '</b></div>' +
      '<div class="spec"><span>غرف النوم</span><b>' + AQ.esc(AQ.roomsLabel(l.rooms)) + '</b></div>' +
      '<div class="spec"><span>الحمامات</span><b>' + (l.baths || 0) + '</b></div>' +
      '<div class="spec"><span>الدور</span><b>' + (l.floor ? (l.floor === 0 ? 'أرضي' : l.floor) : '—') + '</b></div>' +
      '<div class="spec"><span>الكود</span><b>' + AQ.esc(l.ref) + '</b></div>' +
      '</div>';
  }

  function bookingFormHTML() {
    return '' +
      '<form class="bform" id="bookForm" novalidate>' +
        '<h4>📩 احجز أو استفسر — الرسالة هتروح على واتساب</h4>' +
        '<div class="row">' +
          '<div class="field" id="fldName">' +
            '<label for="bkName">الاسم *</label>' +
            '<input id="bkName" name="name" type="text" placeholder="اسمك بالكامل" autocomplete="name">' +
            '<div class="err-msg">اكتب اسمك من فضلك</div>' +
          '</div>' +
          '<div class="field" id="fldPhone">' +
            '<label for="bkPhone">رقم التليفون *</label>' +
            '<input id="bkPhone" name="phone" type="tel" inputmode="numeric" placeholder="01xxxxxxxxx" autocomplete="tel">' +
            '<div class="err-msg">اكتب رقم موبايل صحيح مكوّن من 11 رقم</div>' +
          '</div>' +
        '</div>' +
        '<div class="field">' +
          '<label for="bkNote">ملاحظات (اختياري)</label>' +
          '<textarea id="bkNote" name="note" placeholder="مثال: مهتم بالمعاينة يوم الخميس مساءً…"></textarea>' +
        '</div>' +
        '<button class="btn btn--wa" type="submit">إرسال الحجز على الواتساب</button>' +
      '</form>';
  }

  function detailHTML(l) {
    return '' +
      '<button class="modal__close" data-close aria-label="إغلاق">✕</button>' +
      '<div class="det">' +
        galleryHTML(l) +
        '<div class="det__info">' +
          '<div class="det__badges">' +
            '<span class="badge badge--type">' + AQ.typeLabel(l.type) + '</span>' +
            (l.furnished ? '<span class="badge badge--furn">مفروش</span>' : '') +
            statusBadge(l) +
          '</div>' +
          '<h2 class="det__title">' + AQ.esc(l.title) + '</h2>' +
          '<div class="card__loc">📍 ' + AQ.esc(l.city || '') + (l.district ? ' — ' + AQ.esc(l.district) : '') + '</div>' +
          '<div class="det__price">' + AQ.fmtNum(l.price) + ' <small>' + AQ.priceNote(l) + '</small></div>' +
          specBox(l) +
          (l.description ? '<p class="det__desc">' + AQ.esc(l.description) + '</p>' : '') +
          '<div class="det__actions">' +
            '<button class="btn btn--ghost" data-share>📤 شارك الشقة</button>' +
            '<a class="btn btn--wa" id="detWa" href="#" target="_blank" rel="noopener">💬 كلّمنا واتساب</a>' +
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
    state.current = l;
    state.gallery = 0;
    $('#detPanel').innerHTML = detailHTML(l);
    $('#detModal').classList.add('is-open');
    document.body.style.overflow = 'hidden';

    var s = AQ.getData().settings;
    $('#detWa').href = AQ.waLink(s.whatsapp,
      'السلام عليكم، مستفسر عن الشقة:\n' + l.title +
      '\nكود: ' + l.ref + '\n' + AQ.priceLabel(l));

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

    if (!ok) { AQ.toast('راجع البيانات المطلوبة', 'err'); return; }

    var msg = AQ.bookingMessage(l, { name: name, phone: phone, note: note });
    AQ.openWhatsApp(AQ.getData().settings.whatsapp, msg);
    AQ.toast('تم تجهيز الرسالة — هتفتح واتساب دلوقتي ✓', 'ok');
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
      state.price = 'all'; state.furnished = false; state.sort = 'new';
      $('#fq').value = ''; $('#fCity').value = 'all'; $('#fPrice').value = 'all';
      $('#fFurn').checked = false; $('#fSort').value = 'new';
      $$('#fType button').forEach(function (x, i) { x.classList.toggle('is-on', i === 0); });
      render();
    });

    document.addEventListener('click', function (e) {
      var open = e.target.closest('[data-open]');
      if (open) { openDetail(open.dataset.open); return; }

      var book = e.target.closest('[data-book]');
      if (book) {
        openDetail(book.dataset.book);
        setTimeout(function () {
          var f = $('#bkName'); if (f) f.focus({ preventScroll: false });
        }, 250);
        return;
      }

      if (e.target.closest('[data-close]')) { closeDetail(); return; }

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
            AQ.toast('تم نسخ بيانات الشقة ✓', 'ok');
          });
        } else {
          AQ.toast('انسخ اللينك من شريط العنوان', 'info');
        }
      }
    });

    document.addEventListener('submit', function (e) {
      if (e.target.id === 'bookForm') submitBooking(e);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('#detModal').classList.contains('is-open')) closeDetail();
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
  }

  /* ---------- boot ---------- */
  App.boot = function () {
    var data = AQ.getData();
    if (!data.listings.length && !window.LISTINGS_DATA) {
      $('#grid').innerHTML =
        '<div class="empty"><b>تعذّر تحميل بيانات الشقق</b>' +
        '<p>اتأكد إنك بتفتح الموقع من سيرفر محلي أو إن ملف data/listings.js موجود.</p></div>';
      return;
    }
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
})();
