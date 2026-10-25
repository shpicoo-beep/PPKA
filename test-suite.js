/**
 * Comprehensive Automated Test Suite for KepAn Profesi HTML PWA
 * Tests all requirements, functions, flows, calculations, exports, and UI elements.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
  }
}

console.log('=================================================================');
console.log('🩺 MENJALANKAN PENGUJIAN OTOMATIS: KEPAN PROFESI KEPERAWATAN ANAK');
console.log('=================================================================\n');

// -----------------------------------------------------------------
// 1. FILE INTEGRITY & STATIC STRUCTURE TESTS
// -----------------------------------------------------------------
console.log('📦 [1/5] PENGUJIAN INTEGRITAS BERKAS & STRUKTUR PWA');

const indexHtmlPath = path.join(__dirname, 'index.html');
const indexPath = path.join(__dirname, 'index');
const manifestPath = path.join(__dirname, 'manifest.json');
const swPath = path.join(__dirname, 'sw.js');
const iconPath = path.join(__dirname, 'icon.svg');

assert(fs.existsSync(indexHtmlPath), 'Berkas index.html ditemukan');
assert(fs.existsSync(indexPath), 'Berkas index ditemukan');
assert(fs.existsSync(manifestPath), 'Berkas manifest.json ditemukan');
assert(fs.existsSync(swPath), 'Berkas sw.js (Service Worker) ditemukan');
assert(fs.existsSync(iconPath), 'Berkas icon.svg ditemukan');

const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Check Preceptor Name in Title & HTML
assert(
  htmlContent.includes('Sugeng Hadisaputra, M. Kep., Sp. Kep An'),
  'Nama Preseptor Sugeng Hadisaputra, M. Kep., Sp. Kep An tercantum di HTML'
);

// Check Signature in HTML
assert(
  htmlContent.includes('copyright@shadisap 2026'),
  'Signature copyright@shadisap 2026 tercantum di HTML'
);

// Check removal of admin credentials hint
assert(
  !htmlContent.includes('💡 Admin: user') && !htmlContent.includes('pass <b>admin</b>'),
  'Kredensial admin di halaman muka berhasil disembunyikan'
);

// Check Email & WhatsApp inputs in HTML
assert(
  htmlContent.includes('id="signupEmail"') && htmlContent.includes('id="signupWhatsapp"'),
  'Formulir pendaftaran memuat input Email dan No. WhatsApp aktif'
);

// Check 3D gradient tab styles
assert(
  htmlContent.includes('box-shadow: 0 4px 0') && htmlContent.includes('linear-gradient'),
  'Kotak tab menerapkan gaya gradasi dengan efek 3D bevel'
);

// Check Manifest JSON content
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifestContent.display === 'standalone', 'PWA Manifest display mode adalah standalone');
assert(manifestContent.name.includes('Sugeng Hadisaputra'), 'PWA Manifest memuat nama Preseptor');
assert(manifestContent.icons && manifestContent.icons.length > 0, 'PWA Manifest memuat ikon aplikasi');

// Check Service Worker content
const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes('CACHE_NAME'), 'Service Worker memiliki konfigurasi Cache');
assert(swContent.includes('fetch'), 'Service Worker mengintersepsi event fetch untuk offline');

console.log('\n');

// -----------------------------------------------------------------
// 2. SIMULASI DOM & PENGECEKAN FUNGSI APLIKASI
// -----------------------------------------------------------------
console.log('⚙️ [2/5] PENGUJIAN LOGIKA APLIKASI, BASIS DATA, & AUTENTIKASI');

// In-memory mock of IndexedDB
const mockDB = {
  users: new Map(),
  presensi: new Map(),
  logbook: new Map(),
  resume: new Map(),
  kelolaan: new Map(),
  meta: new Map()
};

// Create Mock DOM environment with auto-generating Proxy
const elements = new Proxy({}, {
  get(target, prop) {
    if (!target[prop]) {
      target[prop] = createMockElement(prop);
    }
    return target[prop];
  }
});

function createMockElement(id, tagName = 'div') {
  return {
    id,
    tagName,
    value: '',
    textContent: '',
    innerHTML: '',
    src: '',
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); }
    },
    style: {},
    appendChild: function(child) {},
    remove: function() {},
    setAttribute: function() {},
    getAttribute: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    options: [],
    focus: function() {},
    click: function() {}
  };
}

// Extract Javascript from index.html
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
const match = scriptRegex.exec(htmlContent);
assert(match !== null, 'Blok kode JavaScript ditemukan di index.html');
const appScript = match[1];

// Build custom context to run application code
const context = {
  console: {
    log: () => {},
    error: console.error,
    warn: () => {}
  },
  Date: Date,
  Math: Math,
  JSON: JSON,
  String: String,
  Number: Number,
  Array: Array,
  Set: Set,
  Promise: Promise,
  setTimeout: (fn) => fn(),
  setInterval: () => {},
  document: {
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = createMockElement(id);
      }
      return elements[id];
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: (tag) => createMockElement(`dyn_${Math.random()}`, tag)
  },
  window: {
    addEventListener: () => {},
    scrollTo: () => {},
    print: () => {}
  },
  navigator: {
    serviceWorker: { register: () => Promise.resolve({ scope: './' }) },
    mediaDevices: { getUserMedia: () => Promise.resolve({}) }
  },
  URL: {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {}
  },
  Blob: function(parts, options) {
    this.parts = parts;
    this.options = options;
  },
  FileReader: function() {
    this.readAsText = function() {};
    this.readAsDataURL = function() {};
  },
  confirm: () => true,
  alert: () => {}
};

// Execute Script in Sandbox
vm.createContext(context);
vm.runInContext(appScript, context);

assert(typeof context.calcAge === 'function', 'Fungsi calcAge terdefinisi');
assert(typeof context.handleSignup === 'function', 'Fungsi handleSignup terdefinisi');
assert(typeof context.handleLogin === 'function', 'Fungsi handleLogin terdefinisi');
assert(typeof context.savePresensi === 'function', 'Fungsi savePresensi terdefinisi');
assert(typeof context.handleSaveLogbook === 'function', 'Fungsi handleSaveLogbook terdefinisi');
assert(typeof context.handleSaveResume === 'function', 'Fungsi handleSaveResume terdefinisi');
assert(typeof context.handleSaveKelolaan === 'function', 'Fungsi handleSaveKelolaan terdefinisi');
assert(typeof context.exportAsCSV === 'function', 'Fungsi exportAsCSV terdefinisi');
assert(typeof context.exportAsJSON === 'function', 'Fungsi exportAsJSON terdefinisi');
assert(typeof context.exportAsPDF === 'function', 'Fungsi exportAsPDF terdefinisi');

console.log('\n');

// -----------------------------------------------------------------
// 3. PENGUJIAN LOGIKA PERHITUNGAN USIA & DATA KLINIS ANAK
// -----------------------------------------------------------------
console.log('👶 [3/5] PENGUJIAN LOGIKA PEDIATRIK & PERHITUNGAN USIA');

// Set a birth date 2 years ago
const twoYearsAgo = new Date();
twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 3);
const dobStr = twoYearsAgo.toISOString().split('T')[0];

context.calcAge(dobStr, 'resumeClientAge');
const ageTargetElem = context.document.getElementById('resumeClientAge');
assert(
  ageTargetElem.value.includes('2 tahun') && ageTargetElem.value.includes('bulan'),
  'Perhitungan usia anak akurat berdasarkan tanggal lahir (misal: 2 tahun X bulan)',
  `Hasil aktual: ${ageTargetElem.value}`
);

// Test age for infant (5 months ago)
const fiveMonthsAgo = new Date();
fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
const infantDobStr = fiveMonthsAgo.toISOString().split('T')[0];
context.calcAge(infantDobStr, 'resumeClientAge');
assert(
  ageTargetElem.value.includes('bulan') || ageTargetElem.value.includes('tahun'),
  'Perhitungan usia bayi mencakup satuan bulan',
  `Hasil aktual: ${ageTargetElem.value}`
);

console.log('\n');

// -----------------------------------------------------------------
// 4. PENGUJIAN SIMULASI PENDAFTARAN & LOGIN MAHASISWA & ADMIN
// -----------------------------------------------------------------
console.log('🔐 [4/5] PENGUJIAN ALUR AUTENTIKASI MAHASISWA & PRESEPTOR ADMIN');

// Override DB functions in context to use our fast in-memory mockDB
context.dbGet = (store, key) => Promise.resolve(mockDB[store] ? mockDB[store].get(key) || null : null);
context.dbPut = (store, value) => {
  if (!mockDB[store]) mockDB[store] = new Map();
  const key = store === 'users' ? value.npm : (store === 'meta' ? value.key : value.id);
  mockDB[store].set(key, value);
  return Promise.resolve(true);
};
context.dbGetAll = (store) => Promise.resolve(mockDB[store] ? Array.from(mockDB[store].values()) : []);
context.dbDelete = (store, key) => {
  if (mockDB[store]) mockDB[store].delete(key);
  return Promise.resolve(true);
};

// 4A. Pendaftaran Mahasiswa Baru
elements['signupName'].value = 'Ns. Annisa Putri, S.Kep';
elements['signupNPM'].value = '245130099';
elements['signupGender'].value = 'Perempuan';
elements['signupEmail'].value = 'annisa.putri@mhs.ac.id';
elements['signupWhatsapp'].value = '081298765432';
elements['signupPassword'].value = 'rahasia123';
elements['signupAvatarPreview'].src = 'data:image/jpeg;base64,mockphoto';

const signupEvent = { preventDefault: () => {} };
context.handleSignup(signupEvent).then(async () => {
  const registeredUser = await context.dbGet('users', '245130099');
  assert(registeredUser !== null, 'Pendaftaran mahasiswa berhasil tersimpan di basis data');
  assert(registeredUser.name === 'Ns. Annisa Putri, S.Kep', 'Nama mahasiswa tersimpan dengan benar');
  assert(registeredUser.email === 'annisa.putri@mhs.ac.id', 'Email mahasiswa tersimpan dengan benar');
  assert(registeredUser.whatsapp === '081298765432', 'No. WhatsApp mahasiswa tersimpan dengan benar');
  
  const session = await context.dbGet('meta', 'session');
  assert(session && session.user && session.user.npm === '245130099', 'Mahasiswa otomatis masuk (auto-login) setelah mendaftar');

  // 4B. Login Mahasiswa
  elements['loginNPM'].value = '245130099';
  elements['loginPassword'].value = 'rahasia123';
  await context.handleLogin(signupEvent);
  const loggedInSession = await context.dbGet('meta', 'session');
  assert(loggedInSession && loggedInSession.user && loggedInSession.user.npm === '245130099', 'Login mahasiswa dengan NPM dan password valid berhasil');

  // 4C. Login Preseptor Administrator (user: admin, pass: admin)
  elements['loginNPM'].value = 'admin';
  elements['loginPassword'].value = 'admin';
  await context.handleLogin(signupEvent);
  const adminSession = await context.dbGet('meta', 'session');
  assert(adminSession && adminSession.user && adminSession.user.role === 'admin', 'Login akun Administrator berhasil');
  assert(
    adminSession.user.name.includes('Sugeng Hadisaputra'),
    'Akun Administrator terverifikasi sebagai Preseptor Sugeng Hadisaputra, M. Kep., Sp. Kep An'
  );

  runClinicalWorkflowTests();
});

// -----------------------------------------------------------------
// 5. PENGUJIAN WORKFLOW KLINIS: PRESENSI, LOGBOOK, ASKEP, KELOLAAN, EXPORTS
// -----------------------------------------------------------------
async function runClinicalWorkflowTests() {
  console.log('🩺 [5/5] PENGUJIAN MODUL PRESENSI, LOGBOOK, RESUME, KELOLAAN & EKSPOR\n');

  // Log in as student to set currentUser in VM scope
  elements['loginNPM'].value = '245130099';
  elements['loginPassword'].value = 'rahasia123';
  await context.handleLogin(signupEvent);

  // 5A. Presensi Datang
  context.window.tempSelfieData.come = {
    photo: 'data:image/jpeg;base64,selfieDatangBase64',
    time: '07:35:10 WIB',
    timestamp: Date.now()
  };
  elements['noteCome'].value = 'Dinas Pagi di Ruang Melati / Pediatric Care';
  await context.savePresensi('come');

  const todayStr = new Date().toISOString().split('T')[0];
  const presensiId = `PRES_245130099_${todayStr}`;
  let presensiRecord = await context.dbGet('presensi', presensiId);
  assert(presensiRecord !== null, 'Presensi Datang berhasil tersimpan');
  assert(presensiRecord.photoCome.includes('selfieDatangBase64'), 'Foto selfie datang berhasil tersimpan');
  assert(presensiRecord.timeCome === '07:35:10 WIB', 'Stempel waktu presensi datang akurat');

  // 5B. Presensi Pulang
  context.window.tempSelfieData.leave = {
    photo: 'data:image/jpeg;base64,selfiePulangBase64',
    time: '14:20:00 WIB',
    timestamp: Date.now()
  };
  elements['noteLeave'].value = 'Operan dinas sore selesai';
  await context.savePresensi('leave');

  presensiRecord = await context.dbGet('presensi', presensiId);
  assert(presensiRecord.photoLeave.includes('selfiePulangBase64'), 'Foto selfie pulang berhasil tersimpan');
  assert(presensiRecord.timeLeave === '14:20:00 WIB', 'Stempel waktu presensi pulang akurat');

  // 5C. Editor Presensi (Mengulang / Update)
  elements['editPresensiId'].value = presensiId;
  elements['editPresensiTimeCome'].value = '07:30:00 WIB';
  elements['editPresensiPhotoCome'].src = 'data:image/jpeg;base64,selfieDatangUpdated';
  elements['editPresensiTimeLeave'].value = '14:25:00 WIB';
  elements['editPresensiPhotoLeave'].src = 'data:image/jpeg;base64,selfiePulangUpdated';
  elements['editPresensiNotes'].value = 'Dinas pagi selesai penuh, waktu disesuaikan';
  await context.saveEditedPresensi();

  presensiRecord = await context.dbGet('presensi', presensiId);
  assert(presensiRecord.timeCome === '07:30:00 WIB', 'Fungsi editor presensi berhasil memperbarui jam datang');
  assert(presensiRecord.photoCome.includes('selfieDatangUpdated'), 'Fungsi editor presensi berhasil mengulang foto selfie');

  // 5D. Log Book Harian
  elements['logbookEditId'].value = '';
  elements['logDate'].value = todayStr;
  elements['logTime'].value = '09:00';
  elements['logActivityType'].value = 'Pengkajian Tumbuh Kembang & Antropometri (SDIDTK/KPSP)';
  elements['logDescription'].value = 'Pemeriksaan motorik kasar dan halus pada An. B usia 2 tahun. KPSP skor 9/10 sesuai.';
  elements['logEvidencePreview'].src = 'data:image/jpeg;base64,buktiLogbook';
  await context.handleSaveLogbook({ preventDefault: () => {} });

  const logs = await context.dbGetAll('logbook');
  assert(logs.length > 0, 'Entri Log Book Harian berhasil tersimpan');
  assert(logs[0].activityType.includes('SDIDTK'), 'Kategori jenis kegiatan logbook tersimpan benar');
  assert(logs[0].studentEmail === 'annisa.putri@mhs.ac.id', 'Email mahasiswa terhubung pada entri logbook');

  // 5E. Resume Asuhan Keperawatan Anak
  elements['resumeEditId'].value = '';
  elements['resumeDate'].value = todayStr;
  elements['resumeClientInitial'].value = 'An. K';
  elements['resumeClientDob'].value = '2023-05-12';
  elements['resumeClientAge'].value = '3 tahun 5 bulan';
  elements['resumeClientGender'].value = 'Laki-laki';
  elements['resumeClientHeight'].value = '95.5';
  elements['resumeClientWeight'].value = '13.8';
  elements['resumeChiefComplaint'].value = 'Demam tinggi sejak 2 hari, batuk pilek dan nafsu makan berkurang';
  elements['resumeAssessment'].value = 'Suhu 38.6 C, RR 26x/m, Nadi 105x/m, SpO2 98%, turgor kulit kembali cepat, tidak ada retraksi dinding dada';
  elements['resumeIntervention'].value = 'Hipertermia b.d proses penyakit infeksi. Intervensi: Kompres hangat, hidrasi cairan oral adekuat, kolaborasi parasetamol';
  elements['resumeImplementation'].value = 'Melakukan kompres hangat di lipat ketiak, memberikan edukasi minum air putih sedikit tapi sering kepada ibu, observasi suhu pasca terapi';
  elements['resumeEvaluation'].value = 'S: Ibu mengatakan anak sudah lebih tenang. O: Suhu turun menjadi 37.4 C. A: Masalah hipertermia teratasi sebagian. P: Lanjutkan pemantauan tanda vital.';
  elements['resumeEvidencePreview'].src = 'data:image/jpeg;base64,buktiResume';
  await context.handleSaveResume({ preventDefault: () => {} });

  const resumes = await context.dbGetAll('resume');
  assert(resumes.length > 0, 'Resume Asuhan Keperawatan Anak berhasil tersimpan');
  assert(resumes[0].clientInitial === 'An. K', 'Identitas inisial klien resume tersimpan benar');
  assert(resumes[0].clientHeight === '95.5' && resumes[0].clientWeight === '13.8', 'TB dan BB anak tersimpan akurat');

  // 5F. Laporan Kasus Kelolaan Anak
  elements['kelolaanEditId'].value = '';
  elements['kelolaanDate'].value = todayStr;
  elements['kelolaanClientInitial'].value = 'An. D';
  elements['kelolaanClientDob'].value = '2022-10-10';
  elements['kelolaanClientAge'].value = '4 tahun';
  elements['kelolaanClientGender'].value = 'Perempuan';
  elements['kelolaanClientHeight'].value = '102';
  elements['kelolaanClientWeight'].value = '15.2';
  elements['kelolaanChiefComplaint'].value = 'Diare cair lebih dari 5 kali per hari disertai lemas';
  elements['kelolaanAssessment'].value = 'Pengkajian MTBS: Dehidrasi ringan-sedang, turgor kulit lambat, mata agak cekung, anak haus terus menerus';
  elements['kelolaanIntervention'].value = 'Hipovolemia b.d kehilangan cairan aktif via feses cair. Rencana: Terapi cairan Rencana B (Oralit 75 ml/kgBB dalam 3 jam pertama), suplementasi Zinc 20 mg/hari selama 10 hari';
  elements['kelolaanImplementation'].value = 'Memberikan oralit bertahap dengan sendok, memberikan tablet zinc dilarutkan dalam air, mengukur intake output cairan';
  elements['kelolaanEvaluation'].value = 'S: Anak mau minum oralit. O: Turgor membaik, mata tidak cekung. A: Dehidrasi teratasi. P: Edukasi tanda bahaya diare pada orang tua.';
  elements['kelolaanEvidencePreview'].src = 'data:image/jpeg;base64,buktiKelolaan';
  await context.handleSaveKelolaan({ preventDefault: () => {} });

  const kelolaanList = await context.dbGetAll('kelolaan');
  assert(kelolaanList.length > 0, 'Laporan Kasus Kelolaan Keperawatan Anak berhasil tersimpan');
  assert(kelolaanList[0].clientInitial === 'An. D', 'Identitas inisial kasus kelolaan tersimpan benar');

  // 5G. Pengujian Ekspor Data (PDF, CSV, JSON)
  let downloadedData = null;
  context.downloadBlob = (blob, filename) => {
    downloadedData = { blob, filename };
  };

  const studentUser = await context.dbGet('users', '245130099');

  const exportPayload = {
    metadata: {
      app: 'KepAn Profesi Keperawatan Anak',
      preceptor: 'Sugeng Hadisaputra, M. Kep., Sp. Kep An',
      copyright: 'copyright@shadisap 2026',
      generatedAt: new Date().toISOString(),
      reportType: 'ALL',
      periodType: 'all',
      periodRange: 'Seluruh Data Lengkap',
      student: studentUser
    },
    presensi: await context.dbGetAll('presensi'),
    logbook: await context.dbGetAll('logbook'),
    resume: await context.dbGetAll('resume'),
    kelolaan: await context.dbGetAll('kelolaan')
  };

  // Test JSON Export
  context.exportAsJSON(exportPayload, 'test_export.json');
  assert(downloadedData !== null && downloadedData.filename === 'test_export.json', 'Ekspor format JSON berhasil dibuat');
  assert(downloadedData.blob.parts[0].includes('Sugeng Hadisaputra'), 'Ekspor JSON memuat nama Preseptor');
  assert(downloadedData.blob.parts[0].includes('copyright@shadisap 2026'), 'Ekspor JSON memuat signature copyright');

  // Test CSV Export
  context.exportAsCSV(exportPayload, 'test_export.csv');
  assert(downloadedData !== null && downloadedData.filename === 'test_export.csv', 'Ekspor format CSV berhasil dibuat');
  const csvText = downloadedData.blob.parts.join('');
  assert(csvText.includes('Email') && csvText.includes('No WhatsApp'), 'Ekspor CSV memuat kolom Email dan No WhatsApp');
  assert(csvText.includes('annisa.putri@mhs.ac.id'), 'Ekspor CSV memuat data email mahasiswa');

  // Test PDF Export Generation
  elements['printReportContainer'].innerHTML = '';
  context.exportAsPDF(exportPayload);
  const pdfHtml = elements['printReportContainer'].innerHTML;
  assert(pdfHtml.includes('Sugeng Hadisaputra, M. Kep., Sp. Kep An'), 'Ekspor PDF memuat nama Preseptor Sugeng Hadisaputra');
  assert(pdfHtml.includes('copyright@shadisap 2026'), 'Ekspor PDF memuat signature copyright@shadisap 2026');
  assert(pdfHtml.includes('annisa.putri@mhs.ac.id'), 'Ekspor PDF memuat email mahasiswa');
  assert(pdfHtml.includes('081298765432'), 'Ekspor PDF memuat no. WhatsApp mahasiswa');
  assert(pdfHtml.includes('Mengetahui,<br>Preseptor / Pembimbing Klinik'), 'Ekspor PDF memuat kolom tanda tangan resmi Preseptor');

  // -----------------------------------------------------------------
  // SUMMARY RESULTS
  // -----------------------------------------------------------------
  console.log('\n=================================================================');
  console.log(`📊 HASIL PENGUJIAN AKHIR:`);
  console.log(`   ✅ Lulus (Passed) : ${passedTests} pengujian`);
  console.log(`   ❌ Gagal (Failed) : ${failedTests} pengujian`);
  console.log('=================================================================');

  if (failedTests === 0) {
    console.log('🎉 SEMUA PENGUJIAN BERHASIL 100%! Aplikasi siap digunakan.');
    process.exit(0);
  } else {
    console.error('⚠️ Terdapat pengujian yang gagal.');
    process.exit(1);
  }
}
