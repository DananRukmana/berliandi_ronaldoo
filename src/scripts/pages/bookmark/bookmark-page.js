import { getAllSavedStories, deleteSavedStory } from '../../data/IndexedDB.js';

export default class BookmarkPage {
  constructor() {
    this.data = [];
  }

  async render() {
    return `
    <div class="content">
      <h2 class="content__heading">Story Collection</h2>
      <div id="bookmark-content" class="stories"></div>
      <div id="empty-container" class="empty-container"></div>
    </div>
    `;
  }

  async afterRender() {
    this.data = await getAllSavedStories();
    const bookmarkContainer = document.getElementById('bookmark-content');
    const emptyContainer = document.getElementById('empty-container');
    if (this.data.length === 0) {
      bookmarkContainer.innerHTML = `<div></div>`;
      emptyContainer.innerHTML = `
    <div class="empty-message">
      <p>Tidak ada Story Collection tersimpan.</p>
      <p>Simpan cerita favorit Anda untuk melihatnya di sini.</p>
    </div>
  `;
      return;
    }

    bookmarkContainer.innerHTML = this.data.map(this.renderBookmarkItem).join('');
    bookmarkContainer.addEventListener('click', async (event) => {
      if (event.target.classList.contains('delete-btn')) {
        const id = event.target.dataset.id;
        await deleteSavedStory(id);
        this.afterRender();
      }
    });
  }

  renderBookmarkItem(story) {
    return `
    <div class="story-item">
      <div class="story-item__image">
        <img src="${story.photoUrl}" alt="${story.name}" loading="lazy" />
        <button class="delete-btn" data-id="${story.id}" aria-label="Delete story">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
      <div class="story-item__content">
        <h3>${story.name}</h3>
        <p class="story-item__description">${story.description}</p>
        <div class="story-item__location">
          <span class="story-item__coordinate">
            <i class="fas fa-map-marker-alt"></i> Lat: ${story.lat}
          </span>
          <span class="story-item__coordinate">
            <i class="fas fa-map-pin"></i> Long: ${story.lon}
          </span>
        </div>
      </div>
    </div>
    `;
  }
}
