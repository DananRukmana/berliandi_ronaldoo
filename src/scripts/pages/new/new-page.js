import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as CityCareAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Screenshot from '../../utils/screenshot';
import { initializeMap, addMarkersToMap } from '../../utils/map-utils';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #screenshot;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #map;
  #marker;
  #isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  async render() {
    return `
      <section>
        <div class="new-report__header">
          <div class="container">
            <h1 class="new-report__header__title">Buat Story Baru</h1>
            <p class="new-report__header__description">
              Silakan lengkapi formulir di bawah dan buat story terbaik mu.<br>
              Pastikan story yang dibuat adalah karya mu sendiri.
            </p>
            <div class="shortcuts-container">
            <br>
              <div class="shortcuts-buttons">
                <button id="focus-description" class="shortcut-btn" title="Fokus ke deskripsi (Ctrl+1) - Tekan Ctrl+, untuk semua shortcut">
                  <i class="fas fa-align-left"></i> <span>Deskripsi</span>
                </button>
                <button id="focus-location" class="shortcut-btn" title="Fokus ke peta (Ctrl+2) - Tekan Ctrl+, untuk semua shortcut">
                  <i class="fas fa-map-marker-alt"></i> <span>Peta</span>
                </button>
                <button id="take-quick-screenshot" class="shortcut-btn" title="Ambil screenshot cepat (Ctrl+3) - Tekan Ctrl+, untuk semua shortcut">
                  <i class="fas fa-camera"></i> <span>Screenshot</span>
                </button>
                ${
                  this.#isMobile
                    ? `
                <button id="open-mobile-camera" class="shortcut-btn" title="Buka kamera mobile">
                  <i class="fas fa-mobile-alt"></i> <span>Kamera</span>
                </button>`
                    : ''
                }
                <button id="show-help" class="shortcut-btn" title="Tampilkan semua shortcut (Ctrl+,)">
                  <i class="fas fa-question-circle"></i> <span>Bantuan Shortcut</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Tulis Ceritamu</label>
              <div class="new-form__description__container">
                <textarea id="description-input" name="description" placeholder="Masukkan Cerita terbaikmu..."></textarea>
              </div>
            </div>
            <div class="form-control">
              <label class="new-form__documentations__title">Dokumentasi</label>
              <div id="documentations-more-info">Anda dapat menyertakan foto sebagai dokumentasi.</div>
              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">
                    <i class="fas fa-folder-open"></i> Pilih Gambar
                  </button>
                  <input id="documentations-input" name="documentations" type="file" accept="image/*" multiple hidden>
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    <i class="fas fa-camera"></i> Buka Kamera
                  </button>
                  <button id="take-screenshot-button" class="btn btn-outline" type="button">
                    <i class="fas fa-desktop"></i> Screenshot
                  </button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video">Video stream not available.</video>
                  <canvas id="camera-canvas"></canvas>
                  <div class="new-form__camera__tools">
                    <select id="camera-select"></select>
                    <button id="camera-take-button" class="btn" type="button">Ambil Gambar</button>
                  </div>
                </div>
                <div id="screenshot-loading" class="screenshot-loading" style="display: none;"></div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>
            <div class="form-control">
              <div class="new-form__location__title">Lokasi</div>
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="number" step="any" name="latitude" id="latitudeInput" value="-6.352003776761075">
                  <input type="number" step="any" name="longitude" id="longitudeInput" value="106.83254971864685">
                </div>
              </div>
            </div>
            <div class="form-buttons">
              <button class="btn" type="submit" id="submit-button-container">Tambah Cerita</button>
              <a class="btn btn-outline sb-btn" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({ view: this, model: CityCareAPI });
    this.#takenDocumentations = [];
    this.#screenshot = new Screenshot({
      loadingElement: document.getElementById('screenshot-loading'),
      scale: 2,
    });

    this.#presenter.showNewFormMap();
    this.#setupForm();
    this.#setupScreenshotButton();
    this.#setupShortcuts();
    this.#setupMobileFeatures();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = {
        description: this.#form.elements.namedItem('description').value,
        evidenceImages: this.#takenDocumentations.map((picture) => picture.blob),
        latitude: this.#form.elements.namedItem('latitude').value,
        longitude: this.#form.elements.namedItem('longitude').value,
      };
      await this.#presenter.postNewReport(data);
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      await Promise.all(
        Object.values(event.target.files).map(async (file) => await this.#addTakenPicture(file)),
      );
      await this.#populateTakenPictures();
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-documentations-camera-button')
      .addEventListener('click', async (e) => {
        cameraContainer.classList.toggle('open');
        this.#isCameraOpen = cameraContainer.classList.contains('open');
        e.currentTarget.innerHTML = this.#isCameraOpen
          ? '<i class="fas fa-camera"></i> Tutup Kamera'
          : '<i class="fas fa-camera"></i> Buka Kamera';

        if (this.#isCameraOpen) {
          this.#setupCamera();
          await this.#camera.launch();
        } else {
          this.#camera.stop();
        }
      });
  }

  #setupShortcuts() {
    document
      .getElementById('focus-description')
      .addEventListener('click', () => document.getElementById('description-input').focus());
    document
      .getElementById('focus-location')
      .addEventListener('click', () =>
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' }),
      );
    document
      .getElementById('take-quick-screenshot')
      .addEventListener('click', () => this.#takeScreenshot());
    document.getElementById('show-help').addEventListener('click', () => this.#showShortcutHelp());

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        this.#showShortcutHelp();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        document.getElementById('description-input').focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        this.#takeScreenshot();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('new-form').dispatchEvent(new Event('submit'));
      }
    });
  }

  #showShortcutHelp() {
    const shortcuts = [
      { keys: 'Ctrl + ,', description: 'Menampilkan daftar semua shortcut yang tersedia' },
      { keys: 'Ctrl + 1', description: 'Fokus ke input deskripsi cerita' },
      { keys: 'Ctrl + 2', description: 'Scroll ke peta lokasi' },
      { keys: 'Ctrl + 3', description: 'Ambil screenshot cepat' },
      { keys: 'Ctrl + S', description: 'Submit form' },
    ];

    let helpHTML = `
      <div class="shortcut-help-overlay">
        <div class="shortcut-help-container">
          <h2>Daftar Shortcut</h2>
          <ul class="shortcut-list">
    `;

    shortcuts.forEach((shortcut) => {
      helpHTML += `
        <li>
          <span class="shortcut-keys">${shortcut.keys}</span>
          <span class="shortcut-desc">${shortcut.description}</span>
        </li>
      `;
    });

    helpHTML += `
          </ul>
          <button class="btn close-shortcut-help">Tutup</button>
        </div>
      </div>
    `;

    const existingHelp = document.querySelector('.shortcut-help-overlay');
    if (existingHelp) {
      existingHelp.remove();
      return;
    }

    document.body.insertAdjacentHTML('beforeend', helpHTML);
    document.querySelector('.close-shortcut-help').addEventListener('click', () => {
      document.querySelector('.shortcut-help-overlay').remove();
    });
  }

  #setupMobileFeatures() {
    if (!this.#isMobile) return;

    document
      .getElementById('open-mobile-camera')
      .addEventListener('click', () =>
        document.getElementById('open-documentations-camera-button').click(),
      );

    const docsList = document.getElementById('documentations-taken-list');
    if (docsList) {
      let touchStartX = 0;
      docsList.addEventListener(
        'touchstart',
        (e) => (touchStartX = e.changedTouches[0].screenX),
        false,
      );
      docsList.addEventListener(
        'touchend',
        (e) => {
          const touchEndX = e.changedTouches[0].screenX;
          if (Math.abs(touchEndX - touchStartX) > 50) {
            this.#scrollDocumentationList(touchEndX < touchStartX ? 1 : -1);
          }
        },
        false,
      );
    }
  }

  #scrollDocumentationList(direction) {
    const list = document.getElementById('documentations-taken-list');
    if (list) list.scrollBy({ left: 200 * direction, behavior: 'smooth' });
  }

  #setupScreenshotButton() {
    document
      .getElementById('take-screenshot-button')
      .addEventListener('click', () => this.#takeScreenshot());
  }

  async #takeScreenshot() {
    try {
      if (this.#isMobile) {
        document.getElementById('open-documentations-camera-button').click();
        return;
      }

      const canvas = await this.#screenshot.take(document.getElementById('new-form'));
      canvas.toBlob(async (blob) => {
        if (blob) {
          await this.#addTakenPicture(blob);
          await this.#populateTakenPictures();
        }
      }, 'image/webp');
    } catch (error) {
      console.error('Screenshot error:', error);
      alert('Gagal mengambil screenshot. Silakan coba lagi.');
    }
  }

  async initialMap(report) {
    if (!this.#map) {
      const lat = report?.lat ?? -6.352052;
      const lon = report?.lon ?? 106.83252;
      this.#map = initializeMap('map', [lat, lon], 9);

      const customIcon = L.icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      this.#marker = L.marker([lat, lon], { icon: customIcon }).addTo(this.#map);
      this.#map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        document.getElementById('latitudeInput').value = lat;
        document.getElementById('longitudeInput').value = lng;
        this.updateMapLocation();
      });
    }

    ['latitudeInput', 'longitudeInput'].forEach((id) =>
      document.getElementById(id).addEventListener('input', () => this.updateMapLocation()),
    );
  }

  async updateMapLocation() {
    if (!this.#map) return;
    const lat = parseFloat(document.getElementById('latitudeInput').value);
    const lon = parseFloat(document.getElementById('longitudeInput').value);

    if (!isNaN(lat) && !isNaN(lon)) {
      this.#map.setView([lat, lon], 8);
      if (this.#marker) this.#map.removeLayer(this.#marker);

      const customIcon = L.icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      this.#marker = L.marker([lat, lon], { icon: customIcon }).addTo(this.#map);
    }
  }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }
    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  async #addTakenPicture(image) {
    const blob = image instanceof String ? convertBase64ToBlob(image, 'image/png') : image;
    this.#takenDocumentations = [
      ...this.#takenDocumentations,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        blob: blob,
      },
    ];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations
      .map(
        (picture, i) => `
      <li class="new-form__documentations__outputs-item">
        <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
          <img src="${URL.createObjectURL(picture.blob)}" alt="Dokumentasi ke-${i + 1}">
        </button>
      </li>
    `,
      )
      .join('');

    document.getElementById('documentations-taken-list').innerHTML = html;
    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (e) => {
        if (this.#removePicture(e.currentTarget.dataset.deletepictureid)) {
          this.#populateTakenPictures();
        }
      }),
    );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((p) => p.id == id);
    if (!selectedPicture) return null;
    this.#takenDocumentations = this.#takenDocumentations.filter((p) => p.id != id);
    return selectedPicture;
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Buat Laporan
      </button>`;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Story</button>`;
  }
}
