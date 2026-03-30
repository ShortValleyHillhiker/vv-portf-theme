export function initIntroSlider() {
  const slide = document.querySelector('.option-slide');
  const slider = document.querySelector('.option-slider');
  const options = slider ? [...slider.querySelectorAll('p')] : [];
  const displays = document.querySelectorAll('.option-display > *');

  if (!slider || !options.length) return;

  const updateMasks = () => {
    const { scrollLeft, scrollWidth, clientWidth } = slider;
    slide.classList.toggle('mask-left', scrollLeft > 4);
    slide.classList.toggle('mask-right', scrollLeft < scrollWidth - clientWidth - 4);
  };

  const select = (index) => {
    options.forEach((p, i) => p.classList.toggle('selected', i === index));
    displays.forEach((d, i) => d.classList.toggle('selected', i === index));
  };

  options.forEach((p, i) => {
    p.addEventListener('click', () => select(i));
  });

  slider.addEventListener('scroll', updateMasks, { passive: true });
  updateMasks();
}
