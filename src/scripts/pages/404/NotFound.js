export default class RenderNotFound {
  async render() {
    return `
      <section class="not-found-container">
        <div class="not-found-content">
          <div class="not-found-graphic">
            <div class="not-found-circle"></div>
            <h1 class="not-found-title">404</h1>
          </div>
          <h2 class="not-found-subtitle">Halaman Tidak Ditemukan</h2>
          <p class="not-found-description">Halaman yang Anda cari tidak tersedia atau telah dipindahkan ke alamat lain.</p>
          <a href="#/" class="not-found-button btn">
            <i class="fas fa-home"></i> Kembali ke Beranda
          </a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    setTimeout(() => {
      document.querySelector('.not-found-circle').classList.add('animate');
      document.querySelector('.not-found-title').classList.add('animate');
    }, 100);
  }
}
