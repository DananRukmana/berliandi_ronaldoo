import {
  generateLoaderAbsoluteTemplate,
  generateReportDetailErrorTemplate,
  generateStorytDetailTemplate,
  generateSaveReportButtonTemplate,
} from '../../templates';
import { createCarousel } from '../../utils';
import ReportDetailPresenter from './story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import * as StoryAppApi from '../../data/api';
import { initializeMap, addMarkersToMap, getLocationDetails } from '../../utils/map-utils';
import {
  debugServiceWorker,
  handleSubscribe,
  handleUnsubscribe,
} from '../../utils/pushNotification';

export default class ReportDetailPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="report-detail__container">
          <div id="report-detail" class="report-detail"></div>
          <div id="report-detail-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await debugServiceWorker();
    this.#presenter = new ReportDetailPresenter(parseActivePathname().id, {
      view: this,
      apiModel: StoryAppApi,
    });

    this.#presenter.showReportDetail();
    await this.updateSubscriptionUI();
  }

  async populateReportDetailAndInitialMap(message, report) {
    const reportDetailElement = document.getElementById('report-detail');

    if (!reportDetailElement) {
      console.error("Elemen 'report-detail' tidak ditemukan di DOM.");
      return;
    }

    const address = await getLocationDetails(report.lat, report.lon);
    reportDetailElement.innerHTML = generateStorytDetailTemplate({
      title: report.name,
      description: report.description,
      evidenceImages: report.photoUrl,
      latitudeLocation: report.lat,
      longitudeLocation: report.lon,
      reporterName: report.name,
      createdAt: report.createdAt,
      address,
    });

    this.addMarkersToMap(report);

    createCarousel(document.getElementById('images'));
    await this.#presenter.showReportDetailMap();
    this.#presenter.showSaveButton();
  }

  async initialMap(report) {
    if (!this.#map) {
      if (report?.lat !== undefined && report?.lon !== undefined) {
        this.#map = initializeMap('map', [report.lat, report.lon], 15);
      } else {
        this.#map = initializeMap('map', [-6.352052, 106.83252], 15);
      }
    }
  }

  async addMarkersToMap(report) {
    if (!report.lat || !report.lon) return;
    const reports = [report];
    if (!this.#map) await this.initialMap(report);
    addMarkersToMap(this.#map, reports);
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML = '';
  }

  populateReportDetailError(message) {
    document.getElementById('report-detail').innerHTML = generateReportDetailErrorTemplate(message);
  }

  renderSaveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateSaveReportButtonTemplate();

    document.getElementById('report-detail-save').addEventListener('click', () => {
      this.#presenter.saveReport();
    });

    const notifyButton = document.getElementById('report-detail-notify-me');
    if (notifyButton) {
      notifyButton.addEventListener('click', async () => {
        try {
          notifyButton.disabled = true;
          notifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

          const isSubscribed = await this.checkSubscriptionStatus();
          if (isSubscribed) {
            await handleUnsubscribe();
            alert('Successfully unsubscribed from notifications');
          } else {
            const result = await handleSubscribe();
            if (result) {
              alert('Successfully subscribed to notifications');
            }
          }
        } catch (error) {
          console.error('Notification error:', error);
          alert(`Error: ${error.message}`);
        } finally {
          await this.updateSubscriptionUI();
          notifyButton.disabled = false;
        }
      });
    }
  }

  async checkSubscriptionStatus() {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error saat memeriksa status subscription:', error);
      return false;
    }
  }

  async updateSubscriptionUI() {
    const isSubscribed = await this.checkSubscriptionStatus();
    const button = document.getElementById('report-detail-notify-me');

    if (button) {
      button.innerHTML = isSubscribed ? '🔕 Berhenti Berlangganan' : '🔔 Berlangganan Notifikasi';
    }
  }
}
