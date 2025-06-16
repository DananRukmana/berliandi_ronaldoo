import { showFormattedDate } from './utils';

export function generateLoaderTemplate() {
  return `
    <div class="loader"></div>
  `;
}

export function generateLoaderAbsoluteTemplate() {
  return `
    <div class="loader loader-absolute"></div>
  `;
}

export function generateMainNavigationListTemplate() {
  return `
    <li><a href="#/collection">All Story</a></li>
    <li><a href="#/404">Not Found</a></li>
  `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="login-button" href="#/login">Login</a></li>
    <li><a id="register-button" href="#/register">Register</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="new-report-button" class="btn new-report-button" href="#/new"><i class="fas fa-plus"></i> New Story</a></li>
    <li><a id="logout-button" class="logout-button" href="#/logout"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
  `;
}

export function generateStoryListEmptyTemplate() {
  return `
    <div id="reports-list-empty" class="reports-list__empty">
      <h2>Tidak ada story yang tersedia</h2>
      <p>Saat ini, tidak ada story yang di tampilkan.</p>
    </div>
  `;
}

export function generateStoryListErrorTemplate(message) {
  return `
    <div id="reports-list-error" class="reports-list__error">
      <h2>Terjadi kesalahan pengambilan daftar Story</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

export function generateReportDetailErrorTemplate(message) {
  return `
    <div id="reports-detail-error" class="reports-detail__error">
      <h2>Terjadi kesalahan pengambilan detail laporan</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

export function generateStoryItemItemTemplate({
  id,
  name,
  description,
  photoUrl,
  reporterName,
  createdAt,
  lat,
  lon,
}) {
  return `
    <div class="story-item">
      <div class="story-item__image">
        <img src="${photoUrl}" alt="${name}" loading="lazy" />
      </div>
      <div class="story-item__content">
        <h2 class="story-item__title">${name}</h2>
        <div id="report-description" class="report-item__description">
          ${description}
        </div>
        <div class="report-item__more-info">
          <div class="report-item__author">
           Ditulis oleh: ${reporterName}
          </div>
        </div>
        <a class="btn report-item__read-more" href="#/story/${id}">
          Selengkapnya <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
}

export function generateDamageLevelMinorTemplate() {
  return `
    <span class="report-detail__damage-level__minor" data-damage-level="minor">Kerusakan Rendah</span>
  `;
}

export function generateDamageLevelModerateTemplate() {
  return `
    <span class="report-detail__damage-level__moderate" data-damage-level="moderate">Kerusakan Sedang</span>
  `;
}

export function generateDamageLevelSevereTemplate() {
  return `
    <span class="report-detail__damage-level__severe" data-damage-level="severe">Kerusakan Berat</span>
  `;
}

export function generateDamageLevelBadge(damageLevel) {
  if (damageLevel === 'minor') {
    return generateDamageLevelMinorTemplate();
  }

  if (damageLevel === 'moderate') {
    return generateDamageLevelModerateTemplate();
  }

  if (damageLevel === 'severe') {
    return generateDamageLevelSevereTemplate();
  }

  return '';
}

export function generateReportDetailImageTemplate(imageUrl = null, alt = '') {
  if (!imageUrl) {
    return `
      <img class="report-detail__image" src="images/placeholder-image.jpg" alt="Placeholder Image">
    `;
  }

  return `
    <img class="report-detail__image" src="${imageUrl}" alt="${alt}">
  `;
}

export function generateStorytDetailTemplate({
  title,
  description,
  evidenceImages,
  latitudeLocation,
  longitudeLocation,
  reporterName,
  createdAt,
  address,
}) {
  return `
    <div class="report-detail__images__container">
      <div class="report-detail__images" id="images">
        <img class="report-detail__image" src="${evidenceImages}" alt="${title}" loading="lazy" />
      </div>
    </div>
    
    <div class="report-detail__body-container">
      <div class="report-detail__body">
        <div class="report-detail__header">
          <h1 class="report-detail__title">${title}</h1>
          
          <div class="report-detail__meta">
            <div class="report-detail__meta-item">
              <i class="fas fa-user"></i>
              <span>${reporterName}</span>
            </div>
            <div class="report-detail__meta-item">
              <i class="fas fa-calendar"></i>
              <span>${new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div class="report-detail__address">
            <i class="fas fa-map-marker-alt"></i>
            <span>${address || 'Location information unavailable'}</span>
          </div>
          
          <div class="report-detail__coordinates">
            <div class="report-detail__coordinate">
              <i class="fas fa-location-arrow"></i>
              <div>
                <div class="report-detail__coordinate-label">Latitude</div>
                <div class="report-detail__coordinate-value">${latitudeLocation}</div>
              </div>
            </div>
            <div class="report-detail__coordinate">
              <i class="fas fa-map-pin"></i>
              <div>
                <div class="report-detail__coordinate-label">Longitude</div>
                <div class="report-detail__coordinate-value">${longitudeLocation}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="report-detail__section">
          <h2 class="report-detail__section-title">Description</h2>
          <div class="report-detail__description">${description}</div>
        </div>
        
        <div class="report-detail__section">
          <h2 class="report-detail__section-title">Location</h2>
          <div class="report-detail__map__container">
            <div id="map" class="report-detail__map"></div>
            <div id="map-loading-container"></div>
          </div>
        </div>
        
        <div id="save-actions-container" class="report-detail__actions"></div>
      </div>
    </div>
  `;
}

export function generateSaveReportButtonTemplate() {
  return `
    <button id="report-detail-save" class="report-detail__action-btn report-detail__save-btn">
      <i class="fas fa-bookmark"></i> Save Story
    </button>
    
    <button id="report-detail-notify-me" class="report-detail__action-btn report-detail__notify-btn">
      <i class="fas fa-bell"></i> Subscribe to Notifications
    </button>
  `;
}

export function generateUnsubscribeButtonTemplate() {
  return `
    <button id="unsubscribe-button" class="btn unsubscribe-button">
      Unsubscribe <i class="fas fa-bell-slash"></i>
    </button>
  `;
}

export function generateRemoveReportButtonTemplate() {
  return `
    <button id="report-detail-remove" class="btn btn-transparent">
      Buang laporan <i class="fas fa-bookmark"></i>
    </button>
  `;
}
