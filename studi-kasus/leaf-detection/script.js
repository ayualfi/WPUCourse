// ================================================
// KONFIGURASI : Bagian ini berisi konfigurasi dasar website seperti URL model Teachable Machine dan elemen-elemen HTML yang akan digunakan pada program.

// URL model Teachable Machine
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/jT2G5P9Dm/";

// File model dan metadata
// model → menyimpan model AI yang sudah dimuat.
const MODEL_JSON = MODEL_URL + "model.json";
// maxPredictions → jumlah kelas yang dimiliki model (dalam kasusmu ada 3 kelas).
const METADATA_JSON = MODEL_URL + "metadata.json";

// Variabel model AI
let model;
let maxPredictions;
// ======================================================

// Mengambil elemen HTML Deklarasi variabel
const uploadInput = document.getElementById("uploadGambar");

// Area Drag & Drop
const dropArea = document.getElementById("dragDrop");

// Tombol kamera
const startCameraBtn = document.getElementById("startCamera");
const btnCapture = document.getElementById("btnCapture");

const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");

let stream = null;

// Tempat webcam ditampilkan
const webcamContainer = document.getElementById("webcam");

// Preview gambar
const previewGambar = document.getElementById("previewGambar");

// Loading
const loading = document.querySelector(".loading");

// Hasil prediksi utama
const predictionText = document.querySelector(".prediksi");
const persenPrediksi = document.getElementById("persenPrediksi");

// Tempat seluruh confidence
const predictionDetail = document.querySelector(".detailPrediksi");

// Informasi penyakit
const informasi = document.getElementById("informasi");


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

// ===================================================================
// PROGRAM DIMULAI

window.addEventListener("DOMContentLoaded", () => {
    loadModel();
});
// ===================================================================
//  LOAD MODEL : Fungsi ini digunakan untuk memuat model AI yang telah dibuat menggunakan Google Teachable Machine.
async function loadModel() {
  // UPLOAD GAMBAR Mendeteksi ketika pengguna memilih gambar dari komputer.
    uploadInput.addEventListener("change", handleImageUpload);
    try {
        // Tampilkan loading
        loading.style.display = "block";
        // Memuat model dan metadata
        model = await tmImage.load(MODEL_JSON, METADATA_JSON);
        // Mengambil jumlah kelas pada model
        maxPredictions = model.getTotalClasses();
        console.log("Model berhasil dimuat.");
        console.log("Jumlah kelas :", maxPredictions);
    } catch (error) {
        console.error("❌ Gagal memuat model.");
        console.error(error);
        alert("Model gagal dimuat. Periksa kembali koneksi internet atau URL model.");
    } finally {
        // Loading disembunyikan kembali
        loading.style.display = "none";
    }}


// Upload dan preview Image Mengambil file yang dipilih pengguna kemudian menampilkan preview gambar.
function handleImageUpload(event){
    const file = event.target.files[0];
    processImage(file);
}

dragDrop.addEventListener("dragover", function(event){
    // Mencegah browser membuka gambar
    event.preventDefault();
});

dragDrop.addEventListener("drop", function(event){
    // Mencegah browser membuka file
    event.preventDefault();
    // Mengambil file yang dijatuhkan
    const file = event.dataTransfer.files[0];
    // Menampilkan gambar & melakukan prediksi
    processImage(file);
});

// Memproses gambar yang diterima dari berbagai sumber
function processImage(file){
    // Jika tidak ada file
    if(!file) return;
    // Membuat URL sementara
    const imageURL = URL.createObjectURL(file);
    // Menampilkan gambar
    previewGambar.src = imageURL;
    // Setelah gambar selesai dimuat
    previewGambar.onload = () => {
         URL.revokeObjectURL(imageURL);
        console.log("Gambar berhasil dimuat");
        predictImage();
    };
}

// Preview Image
// Predict: Melakukan klasifikasi gambar menggunakan model AI.
async function predictImage() {
    try {
        // Menampilkan loading
        loading.style.display = "block";
        // Melakukan prediksi
        const predictions = await model.predict(previewGambar);
        console.log(predictions);
        console.log(predictions.map(p => p.className));
       // Mencari hasil prediksi dengan probabilitas terbesar
       const bestPrediction = predictions.reduce((best, current) =>{
        return current.probability > best.probability ? current : best
       });
       // Mencari index dari prediksi terbaik
       const bestIndex = predictions.findIndex(
          prediction => prediction === bestPrediction
       );


       displayPrediction(bestPrediction)
       displayPredictionDetails(predictions)
       displayDiseaseInformation(bestIndex)
    }
    catch (error) {
        console.error(error);
    }
    finally {
        loading.style.display = "none";
    }}

// Display Result : MENAMPILKAN HASIL PREDIKSI
function displayPrediction(bestPrediction){
    // Menampilkan nama kelas
    predictionText.textContent = bestPrediction.className;
    // Mengubah probability menjadi persen
    const percentage = (bestPrediction.probability * 100).toFixed(2);
    persenPrediksi.textContent = percentage + "%";
}

// MENAMPILKAN DETAIL HASIL PREDIKSI
function displayPredictionDetails(predictions){
    // Kosongkan isi sebelumnya
    predictionDetail.innerHTML = "";
    // Menampilkan seluruh hasil prediksi
    predictions.forEach(prediction => {
        const percentage = (prediction.probability * 100).toFixed(2);
        const resultItem = document.createElement("div");
        resultItem.className = "prediction-item";
        resultItem.innerHTML = `
            <div class="prediction-header">
                <span>${prediction.className}</span>
                <span>${percentage}%</span>
            </div>
            <div class="progress">
                <div
                    class="progress-bar"
                    style="width:${percentage}%">
                </div>
            </div>
        `;
        predictionDetail.appendChild(resultItem);
    });

}

// MENAMPILKAN INFORMASI PENYAKIT
function displayDiseaseInformation(bestIndex){
    const information = diseaseInformation[bestIndex];
    informasi.innerHTML = `
        <h3>${information.title}</h3>
        <p>${information.description}</p>
    `;
}


// Webcam
startCamera.addEventListener("click", openCamera);
btnCapture.addEventListener("click", captureImage);
async function openCamera(){
    try{
      // bersihkan preview sebelumnya
      previewGambar.src = "";
        // bersihkan hasil prediksi
        prediksi.textContent ="";
        persenPrediksi.textContent = "";
        detailPrediksi.innerHTML = "";
        informasi.innerHTML = `
        <h2>Informasi Prediksi</h2>
        <p>Silahkan ambil foto terlebih dahulu</p>
        `;
        stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });

        camera.srcObject = stream;
        camera.hidden = false;
        btnCapture.hidden = false;
    }
    catch(error){
        console.error(error);
        alert(error.message);
    }
}

// mengambil gambar
function captureImage(){
    const context = canvas.getContext("2d");
    // Menyesuaikan ukuran canvas dengan video
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    // Menggambar frame video ke canvas
    context.drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );
    // Mengubah canvas menjadi gambar
    const imageURL = canvas.toDataURL("image/png");
    // Menampilkan hasil foto
    previewGambar.src = imageURL;
    previewGambar.onload = () => {
        predictImage();
    };

    // Mematikan kamera
    stream.getTracks().forEach(track => track.stop());
    camera.srcObject = null;
    // Menyembunyikan kamera
    camera.hidden = true;
    // Menyembunyikan tombol Ambil Foto
    btnCapture.hidden = true;
}

