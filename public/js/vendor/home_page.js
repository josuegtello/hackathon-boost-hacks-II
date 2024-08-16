const d = document;
const body = d.body;
const w = window;

import { sleep } from './sleep.js';

export async function initializeHomepage() {
	const $btnCelestialSecLock = d.getElementById('btnCelestialSecLock');
	const $btnCelestialSmartPot = d.getElementById('btnCelestialSmartPot');
	const $btnCelestialSmartWatch = d.getElementById('btnCelestialSecWatch');
	const $cardCelestialSecLock = d.getElementById('cardCelestialSecLock');
	const $cardCelestialSmartPot = d.getElementById('cardCelestialSmartPot');
	const $cardCelestialSmartWatch = d.getElementById('cardCelestialSecWatch');
	const $skipButton = d.getElementById('skipButton');
	const $VideoContainer = d.getElementById('VideoContainer');
	const $VideoSection = d.getElementById('VideoSection');

	const $modalVideo = document.getElementById('videoCelestialSecLock');
	const $DigInto = document.getElementById('DigInto');

	const $Information = document.getElementById('Information');
	const $GetBack = document.getElementById('GetBackButton');
	const $Celock = document.getElementById('features-container');
	const $videostill = document.getElementById('videoCelestialSecLockStill');
	let alreadywatched = 0;
	console.log($skipButton);
	// Poner event listeners
	$skipButton.addEventListener('click', () => {
		$VideoContainer.classList.toggle('VideoContainer');
		$VideoContainer.classList.toggle('VideoSkip');
		$VideoSection.classList.add('pointer-events-none');
		$skipButton.classList.add('VideoHide');
		$modalVideo.classList.add('VideoHide');
		$modalVideo.pause();
		alreadywatched = 1;
	});

	$btnCelestialSecLock.addEventListener('click', async () => {
		$cardCelestialSecLock.classList.toggle('display-none');
		$cardCelestialSmartWatch.classList.add('display-none');
		$cardCelestialSmartPot.classList.add('display-none');
		$VideoSection.classList.remove('VideoHide');
		$VideoContainer.classList.remove('VideoHide');
		$VideoContainer.classList.add('VideoShow');
		$VideoSection.classList.remove('pointer-events-none');
		if (alreadywatched == 0) {
			$modalVideo.play();
			$modalVideo.volume = 0.5;
		}
		$DigInto.classList.add('display-none');

		await sleep(1000);
		$Celock.classList.remove('display-none');
		$modalVideo.addEventListener('ended', () => {
			$modalVideo.pause();
			$VideoSection.style.display = 'none';
			$VideoContainer.style.display = 'none';

			// $VideoSection.style.opacity = '1';
			// $VideoContainer.style.opacity = '1';
		});
		if (alreadywatched == 1) $VideoSection.classList.add('pointer-events-none');
	});
	// $btnCelestialSmartPot.addEventListener('click', () => {
	// 	$cardCelestialSecLock.classList.toggle('display-none');
	// 	$cardCelestialSmartWatch.classList.add('display-none');
	// 	$cardCelestialSmartPot.classList.add('display-none');
	// 	$Celock.classList.remove('display-none');
	// 	$VideoSection.classList.toggle('VideoHide');
	// 	$VideoContainer.classList.toggle('VideoShow');
	// 	$VideoSection.classList.remove('pointer-events-none');
	// 	$DigInto.classList.add('display-none');
	// 	if (alreadywatched == 1) $VideoSection.classList.add('pointer-events-none');
	// });
	// $btnCelestialSmartWatch.addEventListener('click', () => {
	// 	$cardCelestialSecLock.classList.toggle('display-none');
	// 	$cardCelestialSmartWatch.classList.add('display-none');
	// 	$cardCelestialSmartPot.classList.add('display-none');
	// 	$Celock.classList.remove('display-none');
	// 	$VideoSection.classList.toggle('VideoHide');
	// 	$VideoContainer.classList.toggle('VideoShow');
	// 	$VideoSection.classList.remove('pointer-events-none');
	// 	$DigInto.classList.add('display-none');
	// 	if (alreadywatched == 1) $VideoSection.classList.add('pointer-events-none');
	// });

	$GetBack.addEventListener('click', () => {
		$VideoSection.classList.add('pointer-events-none');
		$cardCelestialSmartWatch.classList.remove('display-none');
		$cardCelestialSmartPot.classList.remove('display-none');
		$cardCelestialSecLock.classList.remove('display-none');
		$DigInto.classList.toggle('display-none');
		$Celock.classList.add('display-none');
		$VideoSection.classList.toggle('VideoHide');
		$VideoContainer.classList.toggle('VideoShow');
	});

	document.addEventListener('fullscreenchange', handleFullscreenChange);

	function handleFullscreenChange() {
		if (document.fullscreenElement === $videostill) {
			$videostill.currentTime = 0;
			$videostill.play();
			$videostill.muted = false;
		} else {
			$videostill.muted = true;
		}
	}

	// To toggle fullscreen mode on $videostill click

	$videostill.addEventListener('click', () => {
		if (!document.fullscreenElement) $videostill.requestFullscreen();
	});
}
