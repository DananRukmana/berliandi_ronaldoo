import { openDB } from 'idb';

const dbPromise = openDB('story-app', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('stories')) {
      db.createObjectStore('stories', { keyPath: 'id' });
    }
  },
});

export const saveStory = async (story) => {
  if (!story.id) {
    console.error('Error: Story harus memiliki properti "id".', story);
    return;
  }

  const db = await dbPromise;
  const tx = db.transaction('stories', 'readwrite');
  const store = tx.objectStore('stories');

  try {
    await store.put(story);
    console.log('Story berhasil disimpan:', story);
  } catch (error) {
    console.error('Gagal menyimpan story:', error);
  }

  return tx.done;
};

export const getAllSavedStories = async () => {
  const db = await dbPromise;
  return db.getAll('stories');
};

export const getSavedStoryById = async (id) => {
  if (!id) {
    console.error('Error: ID tidak boleh kosong.');
    return null;
  }

  const db = await dbPromise;
  return db.get('stories', id);
};

export const deleteSavedStory = async (id) => {
  if (!id) {
    console.error('Error: ID tidak boleh kosong.');
    return;
  }

  const db = await dbPromise;
  const tx = db.transaction('stories', 'readwrite');
  const store = tx.objectStore('stories');

  try {
    await store.delete(id);
    console.log('Story berhasil dihapus:', id);
  } catch (error) {
    console.error('Gagal menghapus story:', error);
  }

  return tx.done;
};

export const updateSavedStory = async (story) => {
  if (!story.id) {
    console.error('Error: Story harus memiliki properti "id" untuk diperbarui.', story);
    return;
  }

  const db = await dbPromise;
  const tx = db.transaction('stories', 'readwrite');
  const store = tx.objectStore('stories');

  try {
    await store.put(story);
    console.log('Story berhasil diperbarui:', story);
  } catch (error) {
    console.error('Gagal memperbarui story:', error);
  }

  return tx.done;
};
