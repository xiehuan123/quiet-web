document.querySelector('#insert-ad').addEventListener('click', () => {
  const ad = document.createElement('aside');
  ad.id = 'dynamic-ad';
  ad.dataset.ad = '';
  ad.dataset.adSlot = 'feed';
  ad.innerHTML = '<span>赞助内容</span><button data-ad-close>关闭广告</button>';
  document.querySelector('#dynamic-root').append(ad);
});
