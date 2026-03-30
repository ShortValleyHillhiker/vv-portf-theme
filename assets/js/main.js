import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';

import { initNav } from './nav.js';
import { initAnchorScroll } from './anchor-scroll.js';
import { initNavObserver } from './nav-observer.js';
import { initMenu } from './menu.js';
import { initGrid } from './grid.js';
import { initTheme } from './theme.js';
import { initLoadMore } from './load-more.js';
import { initIntroSlider } from './intro-slider.js';

const swup = new Swup({
  plugins: [new SwupHeadPlugin()],
  containers: ['#swup'],
});

initMenu();
initGrid();
initTheme();

swup.hooks.on('page:view', () => {
  initNav();
  initAnchorScroll();
  initNavObserver();
  initLoadMore();
  initIntroSlider();
});

initNav();
initAnchorScroll();
initNavObserver();
initLoadMore();
initIntroSlider();
