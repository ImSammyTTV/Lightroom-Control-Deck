/** Runs `fn` at most once per `ms` (Elgato asks plugins to stay under 10 screen updates per second); a trailing call keeps the last state. */
export function throttle(fn: () => void, ms = 125): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending = false;
	return () => {
		if (timer) {
			pending = true;
			return;
		}
		fn();
		timer = setTimeout(() => {
			timer = undefined;
			if (pending) {
				pending = false;
				fn();
			}
		}, ms);
	};
}
