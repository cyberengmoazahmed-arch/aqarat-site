/* ============================================================
   AQARAT — admin panel logic
   ============================================================ */
(function () {
  'use strict';

  var Admin = {};
  var DEFAULT_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; /* sha256("admin123") */
  var st = {
    data: null,
    editing: null,
    isNew: false,
    removed: [],
    tab: 'listings',
    q: ''
  };

  /* ---------- utils ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function busy(on) { $('#prog').classList.toggle('is-on', !!on); }

  function statusBadge(l) {
    if (l.status === 'booked') return '<span class="badge badge--warn">محجوز</span>';
    if (l.status === 'sold') return '<span class="badge badge--off">تم البيع</span>';
    return '<span class="badge badge--ok">متاح</span>';
  }

  function thumb(l) {
    var src = (l.images && l.images[0]) || AQ.placeholder(l.title || '');
    return '<img class="row__img" src="' + AQ.esc(src) + '" alt="" loading="lazy" ' +
      'onerror="this.onerror=null;this.src=\'' + AQ.placeholder('') + '\'">';
  }

  /* ---------- auth ---------- */
  function showLogin() {
    $('#loginView').hidden = false;
    $('#appView').hidden = true;
    $('#btnLogout').hidden = true;
    setTimeout(function () { var p = $('#loginPass'); if (p) p.focus(); }, 60);
  }

  function showApp() {
    $('#loginView').hidden = true;
    $('#appView').hidden = false;
    $('#btnLogout').hidden = false;
    fillSettings();
    renderRows();
    renderConn();
    switchTab(st.tab, true);
  }

  function login(pass) {
    var want = st.data.settings.passwordHash || '';
    if (!want) { /* no hash set yet — accept nothing */
      $('#fldLogin').classList.add('field--err');
      return;
    }
    AQ.sha256(pass).then(function (h) {
      if (h === want) {
        AQ.store.session.set('admin', 1);
        showApp();
        AQ.toast('أهلاً بيك ✓', 'ok');
      } else {
        $('#fldLogin').classList.add('field--err');
        $('#loginPass').value = '';
        $('#loginPass').focus();
      }
    }).catch(function () {
      AQ.toast('المتصفح مايدعمش التشفير هنا — افتح الصفحة على localhost أو https', 'err');
    });
  }

  /* ---------- tabs ---------- */
  function switchTab(name, silent) {
    st.tab = name;
    $$('.tabs button[data-tab]').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.tab === name);
    });
    $('#tabForm').hidden = true;
    $('#tabListings').hidden = name !== 'listings';
    $('#tabSettings').hidden = name !== 'settings';
    if (name === 'settings') fillSettings();
    if (!silent && name === 'listings') renderRows();
  }

  function showList() {
    st.editing = null;
    st.removed = [];
    switchTab('listings');
  }

  /* ---------- rows ---------- */
  function renderRows() {
    var q = st.q.trim().toLowerCase();
    var list = st.data.listings.slice().sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    if (q) {
      list = list.filter(function (l) {
        return [l.title, l.ref, l.city, l.district].join(' ').toLowerCase().indexOf(q) > -1;
      });
    }
    var el = $('#rows');
    if (!list.length) {
      el.innerHTML = '<div class="empty"><b>مفيش شقق لسه</b>' +
        '<p>دوس «+ إضافة شقة» وأول شقة ليك تنشر في ثواني.</p></div>';
      return;
    }
    el.innerHTML = list.map(function (l) {
      return '<div class="row" data-id="' + AQ.esc(l.id) + '">' +
        thumb(l) +
        '<div class="row__main">' +
          '<b>' + AQ.esc(l.title) + '</b>' +
          '<div class="row__meta">' +
            '<span>كود ' + AQ.esc(l.ref) + '</span>' +
            '<span>' + AQ.typeLabel(l.type) + (l.furnished ? ' · مفروش' : '') + '</span>' +
            '<span>' + AQ.esc(l.city || '') + (l.district ? ' — ' + AQ.esc(l.district) : '') + '</span>' +
            statusBadge(l) +
          '</div>' +
        '</div>' +
        '<div class="row__price">' + AQ.fmtNum(l.price) +
          ' <small style="font-size:11px;color:var(--t-lo)">' + AQ.priceNote(l) + '</small></div>' +
        '<div class="row__acts">' +
          '<button type="button" data-edit>تعديل</button>' +
          '<button type="button" class="is-del" data-del>حذف</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderConn() {
    var b = $('#connBadge');
    var r = AQ.github.repoInfo();
    if (AQ.github.connected()) {
      b.textContent = '✅ متصل: ' + r.owner + '/' + r.repo + ' (' + r.branch + ')';
      b.classList.add('is-on');
    } else {
      b.textContent = 'غير متصل بـ GitHub';
      b.classList.remove('is-on');
    }
  }

  /* ---------- form ---------- */
  function fillCities() {
    var seen = {};
    st.data.listings.forEach(function (l) { if (l.city) seen[l.city] = 1; });
    $('#cityList').innerHTML = Object.keys(seen).map(function (c) {
      return '<option value="' + AQ.esc(c) + '">';
    }).join('');
  }

  function openForm(id) {
    fillCities();
    if (id) {
      var found = st.data.listings.filter(function (l) { return l.id === id; })[0];
      if (!found) return;
      st.editing = clone(found);
      st.isNew = false;
      $('#formTitle').textContent = 'تعديل الشقة ' + st.editing.ref;
    } else {
      st.isNew = true;
      st.editing = {
        id: AQ.newId(),
        ref: AQ.newRef(st.data.listings),
        title: '',
        type: 'rent',
        furnished: false,
        price: '',
        city: '',
        district: '',
        rooms: 3,
        baths: 2,
        area: '',
        floor: 1,
        status: 'available',
        description: '',
        images: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      $('#formTitle').textContent = 'إضافة شقة جديدة';
    }
    st.removed = [];

    var l = st.editing;
    $('#fTitle').value = l.title || '';
    $('#fType').value = l.type || 'rent';
    $('#fPrice').value = l.price === '' || l.price === undefined ? '' : l.price;
    $('#fCity').value = l.city || '';
    $('#fDistrict').value = l.district || '';
    $('#fRooms').value = l.rooms === undefined ? '' : l.rooms;
    $('#fBaths').value = l.baths === undefined ? '' : l.baths;
    $('#fArea').value = l.area === undefined || l.area === '' ? '' : l.area;
    $('#fFloor').value = l.floor === undefined ? '' : l.floor;
    $('#fStatus').value = l.status || 'available';
    $('#fDesc').value = l.description || '';
    $('#fFurn').checked = !!l.furnished;
    $('#fldTitle').classList.remove('field--err');
    $('#fldPrice').classList.remove('field--err');
    $('#fldCity').classList.remove('field--err');
    priceHint();
    renderImgs();

    $('#tabListings').hidden = true;
    $('#tabSettings').hidden = true;
    $('#tabForm').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(function () { $('#fTitle').focus(); }, 100);
  }

  function priceHint() {
    $('#priceHint').textContent = $('#fType').value === 'rent' ? '(شهري)' : '(إجمالي)';
  }

  function renderImgs() {
    var imgs = st.editing.images || [];
    var box = $('#imgs');
    if (!imgs.length) {
      box.innerHTML = '<p class="up-note" style="margin:0">لسه مفيش صور — الصورة الأولى هتبقى غلاف الشقة.</p>';
      return;
    }
    box.innerHTML = imgs.map(function (src, i) {
      var cap = src.indexOf('data:') === 0 ? 'جديدة' :
        (src.indexOf('http') === 0 ? 'رابط' : src.split('/').pop());
      return '<figure class="' + (src.indexOf('data:') === 0 ? 'new' : '') + '">' +
        '<img src="' + AQ.esc(src) + '" alt="" onerror="this.style.opacity=.3">' +
        '<figcaption>' + AQ.esc(cap) + '</figcaption>' +
        '<button class="rm" type="button" data-rm="' + i + '" aria-label="حذف الصورة">✕</button>' +
      '</figure>';
    }).join('');
  }

  function collect() {
    var title = $('#fTitle').value.trim();
    var price = Number($('#fPrice').value);
    var city = $('#fCity').value.trim();
    var ok = true;

    $('#fldTitle').classList.toggle('field--err', !title);
    if (!title) ok = false;
    var priceOk = isFinite(price) && price > 0;
    $('#fldPrice').classList.toggle('field--err', !priceOk);
    if (!priceOk) ok = false;
    $('#fldCity').classList.toggle('field--err', !city);
    if (!city) ok = false;
    if (!ok) { AQ.toast('كمّل الحقول المطلوبة', 'err'); return null; }

    var l = st.editing;
    l.title = title;
    l.type = $('#fType').value;
    l.price = Math.round(price);
    l.city = city;
    l.district = $('#fDistrict').value.trim();
    l.rooms = Math.max(0, parseInt($('#fRooms').value, 10) || 0);
    l.baths = Math.max(0, parseInt($('#fBaths').value, 10) || 0);
    l.area = Math.max(0, parseInt($('#fArea').value, 10) || 0);
    l.floor = parseInt($('#fFloor').value, 10);
    if (!isFinite(l.floor)) l.floor = '';
    l.status = $('#fStatus').value;
    l.description = $('#fDesc').value.trim();
    l.furnished = $('#fFurn').checked;
    l.updatedAt = Date.now();
    return l;
  }

  function upsert(l) {
    var i = -1;
    st.data.listings.forEach(function (x, idx) { if (x.id === l.id) i = idx; });
    if (i > -1) st.data.listings[i] = l;
    else st.data.listings.push(l);
    st.data.updated = Date.now();
  }

  /* ---------- save / publish ---------- */
  function downloadDataFile() {
    var blob = new Blob([AQ.dataFileContent(st.data)], { type: 'application/javascript;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'listings.js';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  async function publish(l) {
    busy(true);
    AQ.toast('جارٍ النشر على GitHub…');
    try {
      var imgs = [];
      for (var i = 0; i < l.images.length; i++) {
        var src = l.images[i];
        if (src.indexOf('data:') === 0) {
          var name = l.id + '-' + (i + 1) + '.jpg';
          await AQ.github.saveImage(name, AQ.dataUrlToBase64(src));
          imgs.push('assets/listings/' + name);
        } else {
          imgs.push(src);
        }
      }
      l.images = imgs;
      upsert(l);

      for (var j = 0; j < st.removed.length; j++) {
        await AQ.github.deleteFile(st.removed[j]);
      }
      st.removed = [];

      await AQ.github.saveDataFile(st.data);
      window.LISTINGS_DATA = st.data;
      AQ.toast('تم النشر ✓ الموقع هيتحدث خلال دقيقة', 'ok');
      return true;
    } catch (e) {
      AQ.toast('فشل النشر: ' + e.message, 'err');
      return false;
    } finally {
      busy(false);
    }
  }

  async function saveListing(alsoDownload) {
    var l = collect();
    if (!l) return;
    var btn = $('#btnSave'), btn2 = $('#btnSaveLocal');
    btn.disabled = btn2.disabled = true;

    if (AQ.github.connected()) {
      var ok = await publish(l);
      if (ok) { showList(); }
    } else {
      upsert(l);
      window.LISTINGS_DATA = st.data;
      downloadDataFile();
      AQ.toast('اتحفظ + اتنزّل الملف — استبدله في مجلد data/ وارفعه على GitHub، أو اربط GitHub من الإعدادات', 'ok');
      showList();
    }
    if (alsoDownload && AQ.github.connected()) downloadDataFile();
    btn.disabled = btn2.disabled = false;
  }

  function deleteListing(id) {
    var l = st.data.listings.filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    if (!confirm('متأكد إنك عايز تحذف "' + l.title + '"؟')) return;
    st.data.listings = st.data.listings.filter(function (x) { return x.id !== id; });
    st.data.updated = Date.now();
    renderRows();
    AQ.toast('اتحذف من القائمة — اضغط حفظ عشان يتنشر', 'info');

    if (AQ.github.connected()) {
      (l.images || []).forEach(function (src) {
        if (src.indexOf('assets/listings/') === 0) AQ.github.deleteFile(src);
      });
      AQ.github.saveDataFile(st.data).then(function () {
        window.LISTINGS_DATA = st.data;
        AQ.toast('تم حذف الشقة من الموقع ✓', 'ok');
      }).catch(function (e) {
        AQ.toast('الحذف المحلي تم بس النشر فشل: ' + e.message, 'err');
      });
    } else {
      downloadDataFile();
    }
  }

  /* ---------- settings ---------- */
  function fillSettings() {
    var s = st.data.settings;
    $('#sName').value = s.siteName || '';
    $('#sTag').value = s.tagline || '';
    $('#sWa').value = s.whatsapp || '';
    $('#ahBrand').textContent = s.siteName || 'عقاراتي';
    var r = AQ.github.repoInfo();
    $('#gOwner').value = r.owner || '';
    $('#gRepo').value = r.repo || '';
    $('#gBranch').value = r.branch || 'main';
    $('#gToken').value = AQ.github.token() || '';
    renderConn();
  }

  async function saveSettings() {
    var name = $('#sName').value.trim();
    var tag = $('#sTag').value.trim();
    var waRaw = $('#sWa').value.replace(/\D/g, '');
    var waOk = AQ.waNumber(waRaw).length >= 10;
    $('#fldWa').classList.toggle('field--err', !waOk);
    if (!waOk) { AQ.toast('رقم الواتساب غير صحيح', 'err'); return; }

    st.data.settings.siteName = name || 'عقاراتي';
    st.data.settings.tagline = tag || 'إيجار وتمليك — شقق مختارة بعناية';
    st.data.settings.whatsapp = AQ.waNumber(waRaw);
    st.data.updated = Date.now();
    window.LISTINGS_DATA = st.data;
    $('#ahBrand').textContent = st.data.settings.siteName;

    if (AQ.github.connected()) {
      busy(true);
      try {
        await AQ.github.saveDataFile(st.data);
        AQ.toast('تم حفظ الإعدادات على GitHub ✓', 'ok');
      } catch (e) {
        AQ.toast('فشل الحفظ: ' + e.message, 'err');
      }
      busy(false);
    } else {
      downloadDataFile();
      AQ.toast('اتحفظت + اتنزّل الملف عشان تنشرها', 'ok');
    }
  }

  async function changePassword() {
    var p1 = $('#sPass').value;
    var p2 = $('#sPass2').value;
    var ok = true;
    $('#fldNewPass').classList.toggle('field--err', p1.length < 6);
    if (p1.length < 6) ok = false;
    var match = p1 === p2;
    $('#sPass2').closest('.field').classList.toggle('field--err', !match);
    if (!match) ok = false;
    if (!ok) { AQ.toast('راجع كلمة السر', 'err'); return; }

    try {
      st.data.settings.passwordHash = await AQ.sha256(p1);
      st.data.updated = Date.now();
      window.LISTINGS_DATA = st.data;
      $('#sPass').value = $('#sPass2').value = '';
      if (AQ.github.connected()) {
        await AQ.github.saveDataFile(st.data);
        AQ.toast('تم تغيير كلمة السر ونشرها ✓', 'ok');
      } else {
        downloadDataFile();
        AQ.toast('تم تغيير كلمة السر + تنزيل الملف للنشر', 'ok');
      }
    } catch (e) {
      AQ.toast('حصل خطأ: ' + e.message, 'err');
    }
  }

  /* ---------- github connect ---------- */
  function saveGit() {
    var owner = $('#gOwner').value.trim();
    var repo = $('#gRepo').value.trim();
    var branch = $('#gBranch').value.trim() || 'main';
    var token = $('#gToken').value.trim();

    if (!owner || !repo) { AQ.toast('اكتب اسم المستخدم واسم الريبو', 'err'); return; }
    AQ.github.setRepoInfo({ owner: owner, repo: repo, branch: branch });
    AQ.github.setToken(token);

    st.data.settings.owner = owner;
    st.data.settings.repo = repo;
    st.data.settings.branch = branch;
    window.LISTINGS_DATA = st.data;
    renderConn();

    if (token) AQ.toast('اتحفظ — دوس «اختبار الاتصال» للتأكد', 'ok');
    else AQ.toast('اتحفظ البيانات — مفيش توكن لسه (الحفظ هيكون بالتنزيل)', 'info');
  }

  function testGit() {
    saveGit();
    if (!AQ.github.token()) { AQ.toast('اكتب التوكن الأول', 'err'); return; }
    busy(true);
    AQ.github.test().then(function (repo) {
      AQ.toast('✅ متصل: ' + repo.full_name + ' — الفرع: ' + AQ.github.repoInfo().branch, 'ok');
      renderConn();
    }).catch(function (e) {
      AQ.toast('فشل: ' + e.message, 'err');
    }).finally(function () { busy(false); });
  }

  function syncFromGitHub() {
    if (!AQ.github.connected()) { AQ.toast('اربط GitHub الأول من الإعدادات', 'err'); return; }
    busy(true);
    AQ.github.getFile('data/listings.js').then(function (f) {
      if (!f) throw new Error('ملف data/listings.js مش موجود في الريبو');
      var text = atob(f.content.replace(/\s/g, ''));
      var bytes = new Uint8Array(text.length);
      for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
      var parsed = AQ.parseDataFile(new TextDecoder().decode(bytes));
      st.data = parsed;
      window.LISTINGS_DATA = parsed;
      fillSettings();
      renderRows();
      AQ.toast('تم جلب أحدث نسخة من GitHub ✓', 'ok');
    }).catch(function (e) {
      AQ.toast('فشل الجلب: ' + e.message, 'err');
    }).finally(function () { busy(false); });
  }

  function importDataFile(file) {
    var r = new FileReader();
    r.onerror = function () { AQ.toast('تعذّرت قراءة الملف', 'err'); };
    r.onload = function () {
      try {
        var parsed = AQ.parseDataFile(r.result);
        if (!parsed.listings) throw new Error('الملف مفيهوش listings');
        st.data = parsed;
        window.LISTINGS_DATA = parsed;
        fillSettings();
        renderRows();
        AQ.toast('تم استيراد الملف ✓ — اعمل حفظ عشان يتنشر', 'ok');
      } catch (e) {
        AQ.toast('ملف غير صالح: ' + e.message, 'err');
      }
    };
    r.readAsText(file);
  }

  /* ---------- images ---------- */
  function addFiles(files) {
    var arr = Array.prototype.slice.call(files).slice(0, 10);
    if (!arr.length) return;
    busy(true);
    AQ.toast('جارٍ معالجة الصور…');
    arr.reduce(function (chain, f) {
      return chain.then(function () {
        return AQ.resizeImage(f, 1400, 0.82);
      }).then(function (dataUrl) {
        st.editing.images.push(dataUrl);
        renderImgs();
      }).catch(function () {
        AQ.toast('صورة واحدة اتخطفت (' + f.name + ')', 'err');
      });
    }, Promise.resolve()).then(function () {
      busy(false);
      AQ.toast('تمت إضافة الصور ✓ (مش متحفظة لسه — دوس حفظ)', 'ok');
    });
  }

  /* ---------- events ---------- */
  function bind() {
    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      login($('#loginPass').value);
    });

    $('#btnLogout').addEventListener('click', function () {
      AQ.store.session.del('admin');
      showLogin();
      AQ.toast('اتسجل الخروج', 'info');
    });

    $$('.tabs button[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { switchTab(b.dataset.tab); });
    });

    $('#btnNew').addEventListener('click', function () { openForm(); });
    $('#btnBack').addEventListener('click', showList);
    $('#btnCancel').addEventListener('click', showList);
    $('#btnSync').addEventListener('click', syncFromGitHub);

    $('#aSearch').addEventListener('input', function () {
      st.q = this.value;
      renderRows();
    });

    $('#rows').addEventListener('click', function (e) {
      var row = e.target.closest('.row');
      if (!row) return;
      if (e.target.closest('[data-edit]')) openForm(row.dataset.id);
      else if (e.target.closest('[data-del]')) deleteListing(row.dataset.id);
    });

    $('#fType').addEventListener('change', priceHint);
    $('#btnSave').addEventListener('click', function () { saveListing(false); });
    $('#btnSaveLocal').addEventListener('click', function () { saveListing(true); });

    $('#fFiles').addEventListener('change', function () {
      addFiles(this.files);
      this.value = '';
    });
    $('#btnAddUrl').addEventListener('click', function () {
      var v = $('#fUrl').value.trim();
      if (!/^https?:\/\/.+/.test(v)) { AQ.toast('اكتب لينك صورة صحيح', 'err'); return; }
      st.editing.images.push(v);
      $('#fUrl').value = '';
      renderImgs();
    });
    $('#fUrl').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); $('#btnAddUrl').click(); }
    });
    $('#imgs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]');
      if (!b) return;
      var i = Number(b.dataset.rm);
      var src = st.editing.images[i];
      if (src && src.indexOf('assets/listings/') === 0) st.removed.push(src);
      st.editing.images.splice(i, 1);
      renderImgs();
    });

    $('#btnSaveSettings').addEventListener('click', saveSettings);
    $('#btnPass').addEventListener('click', changePassword);
    $('#btnGitSave').addEventListener('click', saveGit);
    $('#btnGitTest').addEventListener('click', testGit);
    $('#btnGitForget').addEventListener('click', function () {
      AQ.github.setToken('');
      $('#gToken').value = '';
      renderConn();
      AQ.toast('التوكن اتمسح من المتصفح', 'info');
    });
    $('#btnDownload').addEventListener('click', function () {
      downloadDataFile();
      AQ.toast('تم تنزيل الملف ✓', 'ok');
    });
    $('#btnUploadData').addEventListener('click', function () { $('#fDataFile').click(); });
    $('#fDataFile').addEventListener('change', function () {
      if (this.files[0]) importDataFile(this.files[0]);
      this.value = '';
    });
  }

  /* ---------- boot ---------- */
  Admin.boot = function () {
    st.data = JSON.parse(JSON.stringify(AQ.getData()));
    if (!st.data.settings.passwordHash) {
      st.data.settings.passwordHash = DEFAULT_HASH; /* recovery: empty hash => password is admin123 */
    }
    bind();
    fillSettings();
    if (AQ.store.session.get('admin', 0)) showApp();
    else showLogin();
  };

  window.Admin = Admin;
})();
