let audioContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  return audioContext;
}

function playTone({
  frequency = 440,
  duration = 0.12,
  type = "sine",
  volume = 0.04,
  rampTo = null,
}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  if (rampTo) {
    oscillator.frequency.exponentialRampToValueAtTime(
      rampTo,
      ctx.currentTime + duration
    );
  }

  gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    volume,
    ctx.currentTime + 0.01
  );
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + duration
  );

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration + 0.02);
}

export function playCorrectSound() {
  playTone({
    frequency: 620,
    duration: 0.08,
    type: "triangle",
    volume: 0.035,
    rampTo: 880,
  });

  setTimeout(() => {
    playTone({
      frequency: 880,
      duration: 0.1,
      type: "triangle",
      volume: 0.03,
      rampTo: 1040,
    });
  }, 70);
}

export function playWrongSound() {
  playTone({
    frequency: 260,
    duration: 0.14,
    type: "sawtooth",
    volume: 0.03,
    rampTo: 180,
  });
}
