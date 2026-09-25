"""Build short, damped landing impacts from the original CC0 scrap recordings.

Usage: python scripts/rebuild-landings.py SOURCE_DIRECTORY
The source directory contains the three pre-update landing MP3s. Outputs use
the existing public paths; no source recordings are downloaded by the game.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
from scipy.ndimage import median_filter
from scipy.signal import butter, istft, resample_poly, sosfiltfilt, stft, welch

SR = 44100
root = Path(__file__).resolve().parents[1]
source_dir = Path(sys.argv[1])


def decode(path):
    return np.frombuffer(subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', str(path), '-ar', str(SR),
        '-ac', '1', '-f', 'f32le', '-']), dtype=np.float32).copy()


def band(data, low, high):
    return sosfiltfilt(butter(3, [low, high], btype='bandpass', fs=SR, output='sos'), data)


def metrics(data):
    freq, power = welch(data, SR, nperseg=2048)
    energy = np.sum(data**2)
    return {'durationSeconds': round(len(data)/SR, 3),
            'peak': round(float(np.max(np.abs(data))), 4),
            'energyBelow1200HzPercent': round(float(100*power[freq < 1200].sum()/power.sum()), 2),
            'energyAfter400msPercent': round(float(100*np.sum(data[int(.4*SR):]**2)/energy), 3)}


rows = []
for name, source, duration, body_mix in [
    ('landing_light_01', 'landing_heavy_01', .30, .70),
    ('landing_heavy_01', 'landing_heavy_01', .52, .88),
    ('landing_heavy_02', 'landing_heavy_02', .64, .90),
]:
    path = source_dir/(source+'.mp3')
    raw = decode(path)
    original = decode(source_dir/(name+'.mp3'))
    peak = int(np.argmax(np.abs(raw[:int(.18*SR)])))
    start = max(0, peak-int(.012*SR))
    segment = raw[start:start+int(.55*SR)]
    freq, times, spectrum = stft(segment, SR, nperseg=1024, noverlap=768)
    # Suppress stable narrow resonances, while preserving the leading crack.
    power = np.mean(abs(spectrum[:, times > .03])**2, axis=1)
    bed = median_filter(power, size=17)+1e-12
    mask = np.clip((bed/(power+1e-12))**.65, .09, 1)
    mask[freq < 220] = 1
    blend = np.clip((times-.012)/.035, 0, 1)
    spectrum *= 1+(mask[:, None]-1)*blend
    _, clean = istft(spectrum, SR, nperseg=1024, noverlap=768)
    n = round(duration*SR)
    t = np.arange(n)/SR

    def fit(data):
        return np.pad(data, (0, max(0, n-len(data))))[:n]

    # Recorded low body plus a short metal transient. No bell oscillators.
    body = fit(band(resample_poly(clean[:int(.16*SR)], 3, 1), 35, 700))
    crunch = fit(band(clean, 350, 3100))
    body *= np.exp(-t/(.065 if name.endswith('light_01') else .12))
    crunch *= np.exp(-t/(.045 if name.endswith('light_01') else .075))
    body /= max(np.sqrt(np.mean(body**2)), 1e-8)
    crunch /= max(np.sqrt(np.mean(crunch**2)), 1e-8)
    data = body_mix*body+(1-body_mix)*crunch
    data *= np.minimum(1, t/.0015)*np.minimum(1, (duration-t)/.045)
    data *= .82/max(abs(data))
    out = root/'public/audio'/(name+'.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR),
                    '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '160k',
                    str(out)], input=data.astype(np.float32).tobytes(), check=True)
    decoded = decode(out)
    rows.append({'file': out.name, 'source': 'https://freesound.org/people/SamsterBirdies/sounds/587443/',
                 'license': 'CC0', 'sourceExcerpt': source+'.mp3',
                 'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                 'before': metrics(original), 'after': metrics(decoded),
                 'bytes': out.stat().st_size,
                 'processing': 'Isolated attack; narrow resonance suppression; recorded low body; short damped tail'})

(root/'docs/landing-audio-assets.json').write_text(json.dumps(rows, indent=2)+'\n')
print(json.dumps(rows, indent=2))
