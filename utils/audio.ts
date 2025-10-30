let audioContext: (AudioContext | (Window & typeof globalThis)['webkitAudioContext']) | null = null;
let unlocked = false;

export function unlockAudioOnce() {
  if (unlocked) return;
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!audioContext) audioContext = new Ctx();
    if ((audioContext as any).state === 'suspended') (audioContext as any).resume();
    unlocked = true;
  } catch {
    // ignore
  }
}

export function getAudioContext() {
  return audioContext as AudioContext | null;
}

export function playBassBeat() {
  if (!audioContext) return;
  try {
    const oscillator = (audioContext as any).createOscillator();
    const gainNode = (audioContext as any).createGain();
    oscillator.connect(gainNode);
    gainNode.connect((audioContext as any).destination);
    oscillator.frequency.setValueAtTime(60, (audioContext as any).currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, (audioContext as any).currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, (audioContext as any).currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, (audioContext as any).currentTime + 0.3);
    oscillator.start((audioContext as any).currentTime);
    oscillator.stop((audioContext as any).currentTime + 0.3);
  } catch {
    // ignore
  }
}


