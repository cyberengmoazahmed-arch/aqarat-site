/* ============================================================
   AQARAT — i18n (ar / en) — public site only
   ============================================================ */
(function () {
  'use strict';

  var LANG_KEY = 'aq_lang';

  var DICT = {
    ar: {
      doc_title: 'عقاراتي — إيجار وتمليك | شقق مختارة بعناية',
      title_tail: 'إيجار وتمليك | شقق مختارة بعناية',
      brand_sub: 'إيجار وتمليك',
      nav_listings: 'الشقق',
      nav_how: 'إزاي تحجز؟',
      nav_contact: 'تواصل معانا',
      hdr_wa: 'اتصل على واتساب',
      aria_menu: 'القائمة',
      aria_lang: 'تغيير اللغة',
      aria_search: 'بحث',
      aria_city: 'المدينة',
      aria_price: 'السعر',
      aria_sort: 'ترتيب',
      aria_details: 'تفاصيل',
      aria_close: 'إغلاق',
      aria_whatsapp: 'واتساب',
      hero_eyebrow: 'عقارات مصر · إيجار وتمليك',
      hero_h1: 'شقة أحلامك <em>من غير وسطاء</em> — وحجزك على الواتساب',
      hero_tagline: 'اختار الشقة اللي عاجباك، دوس «احجز»، والرسالة هتوصل على واتساب على طول بكل التفاصيل.',
      stat_avail: 'شقة متاحة الآن',
      stat_cities: 'محافظة مغطاة',
      stat_instant: 'حجز فوري واتساب',
      ph_search: 'ابحث بالاسم أو الحي أو كود الشقة…',
      type_all: 'الكل',
      btn_rent: 'إيجار',
      btn_sale: 'تمليك',
      city_all: 'كل المدن',
      price_all: 'أي سعر',
      price_rent_lt5000: 'إيجار أقل من 5,000',
      price_rent_5000_10000: 'إيجار 5,000 – 10,000',
      price_rent_10000_20000: 'إيجار 10,000 – 20,000',
      price_rent_gt20000: 'إيجار أكثر من 20,000',
      price_sale_lt3m: 'تمليك أقل من 3 مليون',
      price_sale_gt3m: 'تمليك أكثر من 3 مليون',
      furn_check: 'مفروش',
      reset_filters: 'مسح الفلاتر',
      sort_new: 'الأحدث الأول',
      sort_low: 'السعر: من الأقل',
      sort_high: 'السعر: من الأعلى',
      sort_area: 'المساحة: من الأكبر',
      how_title: 'إزاي تحجز شقة في 3 خطوات؟',
      how_sub: 'مفيش مكالمات مزعجة ولا وسطاء — كل حاجة بتتم من الموبايل بتاعك على الواتساب.',
      how_s1t: 'اختار الشقة',
      how_s1p: 'تصفّح الشقق، غيّر الفلاتر (إيجار / تمليك / مفروش)، وشوف الصور والتفاصيل كاملة.',
      how_s2t: 'دوس «احجز»',
      how_s2p: 'اكتب اسمك وتليفونك وملاحظتك — الرسالة هتتجهّز أوتوماتيك بكل بيانات الشقة.',
      how_s3t: 'توصل على واتساب',
      how_s3p: 'الرسالة بتوصل على واتساب مباشرة، ونرد عليك بأقرب وقت لتأكيد الموعد والمعاينة.',
      ftr_all: 'كل الشقق',
      ftr_how: 'إزاي تحجز',
      ftr_wa: 'واتساب',
      ftr_rights: '— كل الحقوق محفوظة',
      ftr_prices: 'الأسعار بالجنيه المصري · الصور تقريبية',
      ftr_suffix: ' — الحجز برسالة واتساب واحدة مباشرة.',
      wa_greet: 'السلام عليكم، حابب أستفسر عن الشقق الموجودة على الموقع.',
      status_available: 'متاح',
      status_booked: 'محجوز',
      status_sold: 'تم البيع',
      label_code: 'كود',
      label_baths: 'حمام',
      label_area_unit: 'م²',
      label_furn_chip: 'مفروش',
      book_now: 'احجز الآن',
      details_btn: 'التفاصيل',
      price_on_call: 'السعر عند الاتصال',
      res_one: 'شقة مطابقة',
      res_two: 'شققتان مطابقتان',
      res_few: 'شقق مطابقة',
      res_many: 'شقة مطابقة',
      empty_b: 'مفيش شقق مطابقة للفلاتر دي',
      empty_p: 'جرّب تغيّر نوع العرض أو المدينة أو تمسح الفلاتر.',
      spec_type: 'النوع',
      spec_area: 'المساحة',
      spec_rooms: 'غرف النوم',
      spec_baths: 'الحمامات',
      spec_floor: 'الدور',
      spec_code: 'الكود',
      floor_ground: 'أرضي',
      unit_m: 'متر',
      furn_suffix: ' — مفروش',
      bform_title: '📩 احجز أو استفسر — الرسالة هتروح على واتساب',
      label_name: 'الاسم *',
      label_phone: 'رقم التليفون *',
      label_note: 'ملاحظات (اختياري)',
      ph_name: 'اسمك بالكامل',
      ph_note: 'مثال: مهتم بالمعاينة يوم الخميس مساءً…',
      err_name: 'اكتب اسمك من فضلك',
      err_phone: 'اكتب رقم موبايل صحيح مكوّن من 11 رقم',
      submit_booking: 'إرسال الحجز على الواتساب',
      share_btn: '📤 شارك الشقة',
      wa_btn: '💬 كلّمنا واتساب',
      toast_bad_data: 'راجع البيانات المطلوبة',
      toast_wa_ready: 'تم تجهيز الرسالة — هتفتح واتساب دلوقتي ✓',
      toast_copied: 'تم نسخ بيانات الشقة ✓',
      toast_copy_link: 'انسخ اللينك من شريط العنوان',
      gallery_img: 'صورة',
      gallery_prev: 'السابق',
      gallery_next: 'التالي',
      wa_detail_greet: 'السلام عليكم، مستفسر عن الشقة:',
      data_error_b: 'تعذّر تحميل بيانات الشقق',
      data_error_p: 'اتأكد إنك بتفتح الموقع من سيرفر محلي أو إن ملف data/listings.js موجود.',
      /* common.js shared labels */
      price_month: 'جنيه / شهر',
      price_cash: 'جنيه',
      type_rent: 'إيجار',
      type_sale: 'تمليك',
      rooms_studio: 'استديو',
      rooms_1: 'غرفة واحدة',
      rooms_2: 'غرفتين',
      rooms_n: '%d غرف',
      rooms_many: '%d غرفة',
      bk_greet: 'السلام عليكم، عايز أحجز/أستفسر عن الشقة دي:',
      bk_label_type: '🔖 النوع: ',
      bk_label_code: '🔢 كود الشقة: ',
      bk_label_name: '👤 الاسم: ',
      bk_label_phone: '📱 التليفون: ',
      bk_label_note: '📝 ملاحظات: ',
      bk_from: '(اتبعت من موقع %s)'
    },
    en: {
      doc_title: 'Aqarat — Rent & Sale | Handpicked apartments',
      title_tail: 'Rent & Sale | Handpicked apartments',
      brand_sub: 'Rent & Sale',
      nav_listings: 'Apartments',
      nav_how: 'How to book',
      nav_contact: 'Contact us',
      hdr_wa: 'Chat on WhatsApp',
      aria_menu: 'Menu',
      aria_lang: 'Change language',
      aria_search: 'Search',
      aria_city: 'City',
      aria_price: 'Price',
      aria_sort: 'Sort',
      aria_details: 'Details',
      aria_close: 'Close',
      aria_whatsapp: 'WhatsApp',
      hero_eyebrow: 'Egypt Real Estate · Rent & Sale',
      hero_h1: 'Your dream apartment <em>without brokers</em> — booked via WhatsApp',
      hero_tagline: 'Pick the apartment you like, tap “Book”, and the message goes straight to WhatsApp with all the details.',
      stat_avail: 'apartments available now',
      stat_cities: 'governorates covered',
      stat_instant: 'Instant WhatsApp booking',
      ph_search: 'Search by name, district or code…',
      type_all: 'All',
      btn_rent: 'Rent',
      btn_sale: 'Sale',
      city_all: 'All cities',
      price_all: 'Any price',
      price_rent_lt5000: 'Rent under 5,000',
      price_rent_5000_10000: 'Rent 5,000 – 10,000',
      price_rent_10000_20000: 'Rent 10,000 – 20,000',
      price_rent_gt20000: 'Rent over 20,000',
      price_sale_lt3m: 'Sale under 3 million',
      price_sale_gt3m: 'Sale over 3 million',
      furn_check: 'Furnished',
      reset_filters: 'Clear filters',
      sort_new: 'Newest first',
      sort_low: 'Price: low to high',
      sort_high: 'Price: high to low',
      sort_area: 'Area: largest first',
      how_title: 'How to book an apartment in 3 steps',
      how_sub: 'No annoying calls and no brokers — everything happens from your phone on WhatsApp.',
      how_s1t: 'Pick an apartment',
      how_s1p: 'Browse apartments, use the filters (rent / sale / furnished) and view all photos and details.',
      how_s2t: 'Tap “Book”',
      how_s2p: 'Enter your name, number and note — the message is prepared automatically with the apartment details.',
      how_s3t: 'Arrives on WhatsApp',
      how_s3p: 'The message goes straight to WhatsApp and we reply as soon as possible to confirm your appointment and visit.',
      ftr_all: 'All apartments',
      ftr_how: 'How to book',
      ftr_wa: 'WhatsApp',
      ftr_rights: '— All rights reserved',
      ftr_prices: 'Prices in EGP · Photos are approximate',
      ftr_suffix: ' — booking with a single WhatsApp message.',
      wa_greet: 'Hello, I would like to ask about the apartments on your website.',
      status_available: 'Available',
      status_booked: 'Booked',
      status_sold: 'Sold',
      label_code: 'Code',
      label_baths: 'baths',
      label_area_unit: 'm²',
      label_furn_chip: 'Furnished',
      book_now: 'Book now',
      details_btn: 'Details',
      price_on_call: 'Price on call',
      res_one: 'listing matched',
      res_two: 'listings matched',
      res_few: 'listings matched',
      res_many: 'listings matched',
      empty_b: 'No apartments match these filters',
      empty_p: 'Try changing the type or city, or clear the filters.',
      spec_type: 'Type',
      spec_area: 'Area',
      spec_rooms: 'Bedrooms',
      spec_baths: 'Bathrooms',
      spec_floor: 'Floor',
      spec_code: 'Code',
      floor_ground: 'Ground',
      unit_m: 'm',
      furn_suffix: ' — Furnished',
      bform_title: '📩 Book or ask — the message goes to WhatsApp',
      label_name: 'Name *',
      label_phone: 'Phone number *',
      label_note: 'Notes (optional)',
      ph_name: 'Your full name',
      ph_note: 'e.g. Available for a visit on Thursday evening…',
      err_name: 'Please enter your name',
      err_phone: 'Enter a valid mobile number of 11 digits',
      submit_booking: 'Send booking via WhatsApp',
      share_btn: '📤 Share apartment',
      wa_btn: '💬 Chat on WhatsApp',
      toast_bad_data: 'Please check the required fields',
      toast_wa_ready: 'Message ready — opening WhatsApp now ✓',
      toast_copied: 'Listing details copied ✓',
      toast_copy_link: 'Copy the link from the address bar',
      gallery_img: 'Image',
      gallery_prev: 'Previous',
      gallery_next: 'Next',
      wa_detail_greet: "Hello, I'm interested in this apartment:",
      data_error_b: "Couldn't load apartment data",
      data_error_p: 'Make sure you open the site via a local server or that data/listings.js exists.',
      /* common.js shared labels */
      price_month: 'EGP / month',
      price_cash: 'EGP',
      type_rent: 'Rent',
      type_sale: 'Sale',
      rooms_studio: 'Studio',
      rooms_1: '1 bedroom',
      rooms_2: '2 bedrooms',
      rooms_n: '%d bedrooms',
      rooms_many: '%d bedrooms',
      bk_greet: 'Hello, I would like to book/inquire about this apartment:',
      bk_label_type: '🔖 Type: ',
      bk_label_code: '🔢 Apartment code: ',
      bk_label_name: '👤 Name: ',
      bk_label_phone: '📱 Phone: ',
      bk_label_note: '📝 Notes: ',
      bk_from: "(Sent from %s's website)"
    }
  };

  var lang = 'ar';
  try {
    var saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'ar') lang = saved;
  } catch (e) {}

  function t(key) {
    var d = DICT[lang] || DICT.ar;
    if (d[key] !== undefined) return d[key];
    if (DICT.ar[key] !== undefined) return DICT.ar[key];
    return key;
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute('data-i18n'));

    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (i = 0; i < phs.length; i++) phs[i].placeholder = t(phs[i].getAttribute('data-i18n-ph'));

    var htm = document.querySelectorAll('[data-i18n-html]');
    for (i = 0; i < htm.length; i++) htm[i].innerHTML = t(htm[i].getAttribute('data-i18n-html'));

    var aria = document.querySelectorAll('[data-i18n-aria]');
    for (i = 0; i < aria.length; i++) aria[i].setAttribute('aria-label', t(aria[i].getAttribute('data-i18n-aria')));

    var btn = document.getElementById('langBtn');
    if (btn) btn.textContent = (lang === 'ar') ? 'EN' : 'ع';

    document.title = t('doc_title');
  }

  function set(l) {
    lang = (l === 'en') ? 'en' : 'ar';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyStatic();
    document.dispatchEvent(new CustomEvent('aq:lang'));
  }

  window.I18N = {
    t: t,
    lang: function () { return lang; },
    set: set,
    apply: applyStatic,
    dict: DICT
  };

  /* static markup is already in the DOM (scripts are at end of body) */
  applyStatic();
})();
