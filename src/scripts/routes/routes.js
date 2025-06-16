import RegisterPage from '../pages/auth/register/register-page';
import LoginPage from '../pages/auth/login/login-page';
import HomePage from '../pages/home/home-page';
import StoryDetailPage from '../pages/story-detail/story-detail-page';
import NewPage from '../pages/new/new-page';
import NotFoundPage from '../pages/404/NotFound';
import BookmarkPage from '../pages/bookmark/bookmark-page';

import { checkAuthenticatedRoute, checkUnauthenticatedRouteOnly } from '../utils/auth';

// Web Animations API
function animatePageTransition(page) {
  const container = document.getElementById('app');
  if (container) {
    container.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 500, easing: 'ease-out' },
    );
  }
  return page;
}

export const routes = {
  '/login': () => animatePageTransition(checkUnauthenticatedRouteOnly(new LoginPage())),
  '/register': () => animatePageTransition(checkUnauthenticatedRouteOnly(new RegisterPage())),

  '/': () => animatePageTransition(checkAuthenticatedRoute(new HomePage())),
  '/new': () => animatePageTransition(checkAuthenticatedRoute(new NewPage())),
  '/story/:id': () => animatePageTransition(checkAuthenticatedRoute(new StoryDetailPage())),
  '/404': () => animatePageTransition(new NotFoundPage()),
  '/collection': () => animatePageTransition(checkAuthenticatedRoute(new BookmarkPage())),
};
