import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemItemTemplate,
  generateStoryListEmptyTemplate,
  generateStoryListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import * as StoryAppApi from '../../data/api';
import { initializeMap, addMarkersToMap } from '../../utils/map-utils';

export default class HomePage {
  #presenter = null;
  #map = null;
  #currentPage = 1;
  #reportsPerPage = 6;
  #allReports = [];

  async render() {
    return `
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Stories</h1>
        <div class="reports-list__container">
          <div id="reports-list"></div>
          <div id="pagination-container" class="pagination-container"></div>
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    setTimeout(async () => {
      this.#presenter = new HomePresenter({
        view: this,
        model: StoryAppApi,
      });

      await this.#presenter.initialGalleryAndMap();

      // Tambahkan event listener untuk paginasi
      const paginationContainer = document.getElementById('pagination-container');
      if (paginationContainer) {
        paginationContainer.addEventListener('click', this.handlePaginationClick.bind(this));
      }
    }, 100);
  }

  getPaginatedReports() {
    const start = (this.#currentPage - 1) * this.#reportsPerPage;
    return this.#allReports.slice(start, start + this.#reportsPerPage);
  }

  renderPagination() {
    const totalPages = Math.ceil(this.#allReports.length / this.#reportsPerPage);
    if (totalPages <= 1) {
      document.getElementById('pagination-container').innerHTML = '';
      return;
    }
    let html = '';
    if (this.#currentPage > 1) {
      html += `<button class="pagination-btn" data-page="${this.#currentPage - 1}">Prev</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pagination-btn${i === this.#currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (this.#currentPage < totalPages) {
      html += `<button class="pagination-btn" data-page="${this.#currentPage + 1}">Next</button>`;
    }
    document.getElementById('pagination-container').innerHTML = html;
  }

  handlePaginationClick(event) {
    if (event.target.classList.contains('pagination-btn')) {
      const page = Number(event.target.dataset.page);
      if (page !== this.#currentPage) {
        this.#currentPage = page;
        this.populateReportsList(null, this.#allReports);
      }
    }
  }

  populateReportsList(message, reports) {
    if (!Array.isArray(reports) || reports.length <= 0) {
      this.populateReportsListEmpty();
      return;
    }

    // Simpan semua data untuk paginasi
    this.#allReports = reports;

    const paginatedReports = this.getPaginatedReports();
    const html = paginatedReports.reduce((accumulator, report) => {
      return accumulator.concat(
        generateStoryItemItemTemplate({
          ...report,
          reporterName: report.name,
        }),
      );
    }, '');
    const reportsListContainer = document.getElementById('reports-list');
    if (reportsListContainer) {
      reportsListContainer.innerHTML = `<div class="reports-list">${html}</div>`;
      this.addMarkersToMap(paginatedReports);
    } else {
      console.warn('Elemen #reports-list tidak ditemukan.');
    }

    this.renderPagination();
  }

  populateReportsListEmpty() {
    const reportsListContainer = document.getElementById('reports-list');
    if (reportsListContainer) {
      reportsListContainer.innerHTML = generateStoryListEmptyTemplate();
    }
  }

  populateReportsListError(message) {
    const reportsListContainer = document.getElementById('reports-list');
    if (reportsListContainer) {
      reportsListContainer.innerHTML = generateStoryListErrorTemplate(message);
    }
  }

  async initialMap() {
    if (!this.#map) {
      this.#map = initializeMap('map', [-6.352052, 106.83252], 8);
    }
  }

  async addMarkersToMap(reports) {
    if (!this.#map) await this.initialMap();
    if (reports.length === 0) {
      reports.push({ lat: -6.352052, lon: 106.83252, name: 'Default Marker' });
    }
    addMarkersToMap(this.#map, reports);
  }

  showMapLoading() {
    const loadingContainer = document.getElementById('map-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideMapLoading() {
    const loadingContainer = document.getElementById('map-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = '';
    }
  }

  showLoading() {
    const loadingContainer = document.getElementById('reports-list-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideLoading() {
    const loadingContainer = document.getElementById('reports-list-loading-container');
    if (loadingContainer) {
      loadingContainer.innerHTML = '';
    } else {
      console.warn('Elemen #reports-list-loading-container tidak ditemukan.');
    }
  }
}
