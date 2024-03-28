const box = document.getElementById('box');

box.addEventListener('mouseenter', (event) => {
  const { left, top, width, height } = box.getBoundingClientRect();
  const mouseX = event.clientX - left;
  const mouseY = event.clientY - top;
  
  const offsetX = (mouseX / width - 0.5) * 20;
  const offsetY = (mouseY / height - 0.5) * 20;

  box.style.transform = `rotateX(${offsetY}deg) rotateY(${offsetX}deg)`;
});

box.addEventListener('mouseleave', () => {
  box.style.transform = 'rotateX(0deg) rotateY(0deg)';
});
