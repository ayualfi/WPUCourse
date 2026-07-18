// ================================================
// KONFIGURASI
// Bagian ini berisi konfigurasi dasar website seperti URL model
// Teachable Machine dan elemen-elemen HTML yang digunakan pada program.
// ================================================

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/jT2G5P9Dm/";
const MODEL_JSON = MODEL_URL + "model.json";
const METADATA_JSON = MODEL_URL + "metadata.json";

// Variabel model AI
let model;
let maxPredictions;
let modelIsReady = false;

// ================================================
// ELEMEN HTML
// ================================================

// Navigasi mobile
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

// Upload gambar
const uploadInput = document.getElementById("uploadGambar");

// Drag & Drop
const dropArea = document.getElementById("dragDrop");

// Kamera
const startCameraBtn = document.getElementById("startCamera");
const btnCapture = document.getElementById("btnCapture");
const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");
let stream = null;

// Preview & reset
const previewGambar = document.getElementById("previewGambar");
const btnReset = document.getElementById("btnReset");

// Loading
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");

// Hasil prediksi
const resultSection = document.getElementById("result");
const predictionText = document.getElementById("prediksi");
const persenPrediksi = document.getElementById("persenPrediksi");
const predictionDetail = document.getElementById("detailPrediksi");

// Informasi penyakit
const informasi = document.getElementById("informasi");

// Format file gambar yang diizinkan
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// INFORMASI SETIAP KELAS
const diseaseInformation = [
  {
    title: "Daun Sehat",
    description: "Daun cabai berada dalam kondisi sehat. Pertahankan penyiraman, pencahayaan, dan pemupukan secara rutin agar tanaman tetap tumbuh optimal."
  },
  {
    title: "Hama atau Jamur",
    description: "Daun cabai diduga mengalami serangan hama atau infeksi jamur. Lakukan pemeriksaan lebih lanjut dan gunakan pestisida atau fungisida sesuai kebutuhan."
  },
  {
    title: "Kurang Unsur Hara",
    description: "Tanaman diduga mengalami kekurangan unsur hara. Disarankan melakukan pemupukan sesuai kebutuhan tanaman dan memperbaiki kondisi media tanam."
  }
];

const INFORMASI_AWAL = `
    <h2>Informasi Prediksi</h2>
    <p>Silahkan lakukan deteksi terlebih dahulu.</p>
`;

// ================================================
// PROGRAM DIMULAI
// ================================================
window.addEventListener("DOMContentLoaded", () => {
  const tahunEl = document.getElementById("tahun");
  if (tahunEl) tahunEl.textContent = new Date().getFullYear();

  setupNavigasi();
  setupUploadGambar();
  setupDragAndDrop();
  setupKamera();
  setupReset();
  loadModel();
});

// ================================================
// NAVIGASI MOBILE
// ================================================
function setupNavigasi() {
  if (!navToggle || !navMenu) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("navOpen");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Tutup menu setiap kali salah satu link diklik
  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("navOpen");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ================================================
// LOAD MODEL
// Fungsi ini digunakan untuk memuat model AI yang telah dibuat
// menggunakan Google Teachable Machine.
// ================================================
async function loadModel() {
  try {
    showLoading("Sedang memuat model...");
    model = await tmImage.load(MODEL_JSON, METADATA_JSON);
    maxPredictions = model.getTotalClasses();
    modelIsReady = true;
    console.log("Model berhasil dimuat.");
    console.log("Jumlah kelas :", maxPredictions);
  } catch (error) {
    console.error("Gagal memuat model.", error);
    alert("Model gagal dimuat. Periksa kembali koneksi internet atau URL model.");
  } finally {
    hideLoading();
  }
}

// ================================================
// UPLOAD GAMBAR
// Mendeteksi ketika pengguna memilih gambar dari komputer.
// ================================================
function setupUploadGambar() {
  uploadInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    processImage(file);
  });
}

// ================================================
// DRAG & DROP
// ================================================
function setupDragAndDrop() {
  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("dragOver");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragOver");
  });

  dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.classList.remove("dragOver");
    const file = event.dataTransfer.files[0];
    processImage(file);
  });
}

// ================================================
// MEMPROSES GAMBAR
// Memproses gambar yang diterima dari berbagai sumber
// (galeri, drag & drop, atau kamera).
// ================================================
function processImage(file) {
  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    alert("Format file tidak didukung. Silakan unggah gambar JPG, PNG, atau WEBP.");
    return;
  }

  const imageURL = URL.createObjectURL(file);
  previewGambar.src = imageURL;

  previewGambar.onload = () => {
    URL.revokeObjectURL(imageURL);
    console.log("Gambar berhasil dimuat");
    btnReset.hidden = false;
    predictImage();
  };

  previewGambar.onerror = () => {
    alert("Gambar gagal dimuat. Coba gunakan file lain.");
  };
}

// ================================================
// PREDIKSI
// Melakukan klasifikasi gambar menggunakan model AI.
// ================================================
async function predictImage() {
  if (!modelIsReady) {
    alert("Model masih dimuat, silakan tunggu sebentar lalu coba lagi.");
    return;
  }

  try {
    showLoading("Sedang melakukan prediksi...");

    const predictions = await model.predict(previewGambar);
    console.log(predictions);

    const bestPrediction = predictions.reduce((best, current) =>
      current.probability > best.probability ? current : best
    );
    const bestIndex = predictions.findIndex(
      (prediction) => prediction === bestPrediction
    );

    displayPrediction(bestPrediction, bestIndex);
    displayPredictionDetails(predictions);
    displayDiseaseInformation(bestIndex);
  } catch (error) {
    console.error(error);
    alert("Terjadi kesalahan saat melakukan prediksi.");
  } finally {
    hideLoading();
  }
}

// MENAMPILKAN HASIL PREDIKSI UTAMA
function displayPrediction(bestPrediction, bestIndex) {
  resultSection.hidden = false;

  // Nama yang ditampilkan diambil dari daftar nama bersih (diseaseInformation),
  // bukan dari className mentah milik model. Ini menghindari nama yang
  // tidak lengkap/terpotong apabila label class pada model aslinya bermasalah.
  const information = diseaseInformation[bestIndex];
  predictionText.textContent = information ? information.title : bestPrediction.className;

  const percentage = (bestPrediction.probability * 100).toFixed(2);
  persenPrediksi.textContent = percentage + "%";
}

// MENAMPILKAN DETAIL SELURUH HASIL PREDIKSI
function displayPredictionDetails(predictions) {
  predictionDetail.innerHTML = "";

  predictions.forEach((prediction, index) => {
    const percentage = (prediction.probability * 100).toFixed(2);
    // Pakai nama bersih dari diseaseInformation (sesuai urutan index),
    // fallback ke className asli kalau index-nya tidak terdaftar.
    const information = diseaseInformation[index];
    const namaTampil = information ? information.title : prediction.className;

    const resultItem = document.createElement("div");
    resultItem.className = "prediction-item";
    resultItem.innerHTML = `
            <div class="prediction-header">
                <span>${namaTampil}</span>
                <span>${percentage}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar" style="width:${percentage}%"></div>
            </div>
        `;
    predictionDetail.appendChild(resultItem);
  });
}

// MENAMPILKAN INFORMASI PENYAKIT
function displayDiseaseInformation(bestIndex) {
  const information = diseaseInformation[bestIndex];
  if (!information) return;

  informasi.innerHTML = `
        <h2>Informasi Prediksi</h2>
        <h3>${information.title}</h3>
        <p>${information.description}</p>
    `;
}

// ================================================
// KAMERA
// ================================================
function setupKamera() {
  startCameraBtn.addEventListener("click", openCamera);
  btnCapture.addEventListener("click", captureImage);
}

async function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Kamera tidak didukung pada perangkat atau browser ini.");
    return;
  }

  try {
    // Hentikan stream sebelumnya jika kamera dibuka ulang
    stopCameraStream();

    resetTampilanHasil();

    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    camera.srcObject = stream;
    camera.hidden = false;
    btnCapture.hidden = false;

    informasi.innerHTML = `
        <h2>Informasi Prediksi</h2>
        <p>Silahkan ambil foto terlebih dahulu.</p>
    `;
  } catch (error) {
    console.error(error);
    alert("Tidak dapat mengakses kamera: " + error.message);
  }
}

function captureImage() {
  const context = canvas.getContext("2d");
  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;
  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  const imageURL = canvas.toDataURL("image/png");
  previewGambar.src = imageURL;
  previewGambar.onload = () => {
    btnReset.hidden = false;
    predictImage();
  };

  stopCameraStream();
  camera.hidden = true;
  btnCapture.hidden = true;
}

function stopCameraStream() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  camera.srcObject = null;
}

// ================================================
// RESET
// Fitur tambahan: menghapus gambar & hasil prediksi
// agar pengguna bisa mengulang deteksi dari awal.
// ================================================
function setupReset() {
  btnReset.addEventListener("click", () => {
    resetTampilanHasil();
    previewGambar.src = "";
    btnReset.hidden = true;
    uploadInput.value = "";
  });
}

function resetTampilanHasil() {
  resultSection.hidden = true;
  predictionText.textContent = "";
  persenPrediksi.textContent = "";
  predictionDetail.innerHTML = "";
  informasi.innerHTML = INFORMASI_AWAL;
}

// ================================================
// LOADING HELPER
// ================================================
function showLoading(text) {
  if (text) loadingText.textContent = text;
  loading.hidden = false;
}

function hideLoading() {
  loading.hidden = true;
}
