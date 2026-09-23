import type { SourceId } from '@everyone-house/domain/types';
import { SourceCopy } from '../format/source-copy.js';

export function SourceBadge({ sourceId }: { sourceId: SourceId }) {
  const presentation = SourceCopy.of(sourceId);
  return <span className={`badge ${presentation.className}`}>{presentation.label}</span>;
}
