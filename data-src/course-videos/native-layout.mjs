const outside = (box, frame) => box.x < frame.x - 2 || box.y < frame.y - 2
  || box.x + box.width > frame.x + frame.width + 2 || box.y + box.height > frame.y + frame.height + 2;

export function nativeLayoutErrors(boxes, zones) {
  const errors = [];
  for (const box of boxes) {
    if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) errors.push(`${box.name}: nonfinite bounds`);
    else if (outside(box, {x:0, y:0, width:1200, height:480})) errors.push(`${box.name}: outside native stage (${JSON.stringify(box)})`);
    for (const clip of box.clips || []) {
      if (outside(box, clip)) errors.push(`${box.name}: text clipped by ${clip.name}`);
    }
  }
  for (const zone of zones) {
    if (zone.scrollWidth > zone.clientWidth + 1 || zone.scrollHeight > zone.clientHeight + 1) errors.push(`${zone.name}: text overflow`);
  }
  const labels = boxes.filter(box => box.kind === 'label');
  for (const [index, first] of labels.entries()) {
    for (const second of labels.slice(index + 1)) {
      const width = Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x);
      const height = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y);
      if (width > 2 && height > 2) errors.push(`Overlapping native labels: ${first.text} / ${second.text}`);
    }
  }
  return errors;
}