<script lang="ts">
	import { onMount } from 'svelte';

	let videoEl: HTMLVideoElement | null = $state(null);
	let opacity = $state(0);
	let fadingOutRef = false;
	let animFrame: number | null = null;

	const FADE_MS = 250;
	const FADE_OUT_REMAINING = 0.55;

	function cancelAnim() {
		if (animFrame !== null) {
			cancelAnimationFrame(animFrame);
			animFrame = null;
		}
	}

	function fadeTo(target: number, duration = FADE_MS) {
		cancelAnim();
		const start = performance.now();
		const from = opacity;

		function step(now: number) {
			const t = Math.min(1, (now - start) / duration);
			opacity = from + (target - from) * t;
			if (t < 1) {
				animFrame = requestAnimationFrame(step);
			} else {
				animFrame = null;
				opacity = target;
			}
		}
		animFrame = requestAnimationFrame(step);
	}

	function onTimeUpdate() {
		if (!videoEl || fadingOutRef) return;
		const remaining = videoEl.duration - videoEl.currentTime;
		if (remaining <= FADE_OUT_REMAINING && remaining > 0) {
			fadingOutRef = true;
			fadeTo(0);
		}
	}

	function onEnded() {
		if (!videoEl) return;
		opacity = 0;
		setTimeout(() => {
			if (!videoEl) return;
			videoEl.currentTime = 0;
			videoEl.play();
			fadingOutRef = false;
			fadeTo(1);
		}, 100);
	}

	onMount(() => {
		if (!videoEl) return;
		const start = () => {
			fadingOutRef = false;
			fadeTo(1);
		};
		videoEl.addEventListener('playing', start, { once: true });
		videoEl.play().catch(() => {});
		return () => {
			cancelAnim();
			videoEl?.removeEventListener('playing', start);
		};
	});
</script>

<video
	bind:this={videoEl}
	autoplay
	muted
	playsinline
	class="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top"
	style="width: 115%; height: 115%; opacity: {opacity};"
	ontimeupdate={onTimeUpdate}
	onended={onEnded}
>
	<source
		src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"
		type="video/mp4"
	/>
</video>
