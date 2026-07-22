<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import 'lenis/dist/lenis.css';
	import Lenis from 'lenis';

	let { children } = $props();

	onMount(() => {
		const lenis = new Lenis({
			duration: 1.2,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true,
			touchMultiplier: 1.5
		});

		function raf(time: number) {
			lenis.raf(time);
			requestAnimationFrame(raf);
		}
		requestAnimationFrame(raf);

		return () => {
			lenis.destroy();
		};
	});
</script>

{@render children()}
