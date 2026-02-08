import { getRandomBytes } from "./randomStringGenerator";
import 'react-native-get-random-values';

export function formatSeconds(time: number) {
  if (time == null || isNaN(time)) return "00:00";

  const t = Math.floor(time);

  const hrs = Math.floor(t / 3600);
  const mins = Math.floor((t % 3600) / 60);
  const secs = t % 60;

  const hh = hrs > 0 ? String(hrs).padStart(2, "0") + ":" : "";
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");

  return `${hh}${mm}:${ss}`;
}



const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function getRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array); // now works
  return array[0] % max;
}

export function generate(alphabet, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[getRandomInt(alphabet.length)];
  }
  return result;
}

export function generateContentPlaybackNonce() {
  return generate(ALPHABET, 16);
}

export function generateTParameter() {
  return generate(ALPHABET, 12);
}
