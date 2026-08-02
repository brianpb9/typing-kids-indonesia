/**
 * Victory certificate — canvas PNG download / share
 */

/**
 * @param {{
 *   childName?: string,
 *   stars: number,
 *   totalStars: number,
 *   rank: string,
 *   mode: string,
 *   theme: string,
 *   lang: 'id'|'en',
 *   title: string,
 *   subtitle: string,
 *   footer: string,
 * }} data
 * @returns {Promise<Blob>}
 */
export async function renderCertificate(data) {
  // Ensure web fonts are ready so canvas uses Nunito when available
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    if (document.fonts?.load) {
      await Promise.all([
        document.fonts.load('bold 28px Nunito'),
        document.fonts.load('900 56px Nunito'),
        document.fonts.load('800 26px Nunito'),
      ]);
    }
  } catch {
    /* system font fallback ok */
  }

  const w = 900;
  const h = 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('no canvas'));

  const font = '"Nunito", system-ui, -apple-system, sans-serif';

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#FFF8F0');
  grad.addColorStop(0.5, '#E8F4FC');
  grad.addColorStop(1, '#FFF3E6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#6CB4EE';
  ctx.lineWidth = 10;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  ctx.strokeStyle = '#FFE566';
  ctx.lineWidth = 4;
  ctx.strokeRect(44, 44, w - 88, h - 88);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#3D3A35';
  ctx.font = `bold 28px ${font}`;
  ctx.fillText(data.title || 'Typing Kids', w / 2, 110);

  ctx.font = `900 56px ${font}`;
  ctx.fillStyle = '#4A9FD8';
  ctx.fillText(
    '★  ' + (data.lang === 'en' ? 'CHAMPION' : 'JUARA') + '  ★',
    w / 2,
    190
  );

  ctx.font = `bold 32px ${font}`;
  ctx.fillStyle = '#3D3A35';
  ctx.fillText(data.subtitle || '', w / 2, 250);

  ctx.font = `800 26px ${font}`;
  ctx.fillStyle = '#7A756C';
  const lines = [
    `★ ${data.stars}`,
    data.mode,
    data.theme,
    data.rank,
    `${data.lang === 'en' ? 'Total' : 'Total'} ★ ${data.totalStars}`,
  ];
  lines.forEach((line, i) => {
    ctx.fillText(String(line), w / 2, 320 + i * 40);
  });

  ctx.font = `700 18px ${font}`;
  ctx.fillStyle = '#5B8C5A';
  ctx.fillText(data.footer || '', w / 2, h - 70);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('toBlob failed'));
    }, 'image/png');
  });
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * @param {Blob} blob
 * @param {{ title: string, text: string }} meta
 */
export async function shareCertificate(blob, meta) {
  const file = new File([blob], 'typing-kids-certificate.png', {
    type: 'image/png',
  });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: meta.title,
      text: meta.text,
    });
    return 'shared';
  }
  downloadBlob(blob, 'typing-kids-certificate.png');
  return 'downloaded';
}

export default { renderCertificate, downloadBlob, shareCertificate };
