import {
  Injectable,
} from '@nestjs/common';
import {
  createHash,
} from 'crypto';

@Injectable()
export class PlatformIdempotencyFingerprintService {
  fingerprint(
    value: unknown,
  ): string {
    return createHash('sha256')
      .update(
        JSON.stringify(
          this.canonicalize(value),
        ),
      )
      .digest('hex');
  }

  canonicalize(
    value: unknown,
  ): unknown {
    if (Array.isArray(value)) {
      return value.map(
        (item) =>
          this.canonicalize(item),
      );
    }

    if (
      value !== null &&
      typeof value === 'object'
    ) {
      return Object.fromEntries(
        Object.entries(
          value as
            Record<string, unknown>,
        )
          .sort(
            ([left], [right]) =>
              left.localeCompare(right),
          )
          .map(
            ([key, item]) => [
              key,
              this.canonicalize(item),
            ],
          ),
      );
    }

    if (value === undefined) {
      return null;
    }

    return value;
  }
}
