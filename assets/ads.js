/* Fixed ad placements. Every element with [data-ad] becomes one AdSense unit,
   but only once AD_SLOT is filled in. Until then the placements stay hidden
   and take no space. Subscribers (future) never see ads. */
(function () {
  'use strict';
  var AD_CLIENT = 'ca-pub-4913143800554205';
  var AD_SLOT = ''; // paste the data-ad-slot number from AdSense here

  var subscriber = false;
  try { subscriber = !!(JSON.parse(localStorage.getItem('otto:v1')) || {}).subscriber; } catch (e) { /* storage blocked */ }
  if (!AD_SLOT || subscriber) return;

  document.querySelectorAll('[data-ad]').forEach(function (box) {
    box.innerHTML = '<span class="ad-label">Advertisement</span>' +
      '<ins class="adsbygoogle" style="display:block" data-ad-client="' + AD_CLIENT + '" data-ad-slot="' + AD_SLOT + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    box.hidden = false;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { box.hidden = true; }
  });
})();
