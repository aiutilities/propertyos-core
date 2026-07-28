import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';

import {
  CreatePropertyDto,
} from './create-property.dto';

import {
  UpdatePropertyDto,
} from './update-property.dto';

describe(
  'Property DTO validation contract',
  () => {
    const pipe =
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      });

    it(
      'accepts the supported create-property fields',
      async () => {
        const payload = {
          name: "Advaith's Nest",
          code: 'ADN-CHN',
          propertyType: 'PG',
          description:
            'Managed studio residence',
          addressLine1:
            'GST Road',
          addressLine2:
            'Near railway station',
          city: 'Chengalpattu',
          state: 'Tamil Nadu',
          country: 'India',
          postalCode: '603402',
        };

        await expect(
          pipe.transform(
            payload,
            {
              type: 'body',
              metatype:
                CreatePropertyDto,
            },
          ),
        ).resolves.toEqual(payload);
      },
    );

    it(
      'rejects fields outside the create-property contract',
      async () => {
        await expect(
          pipe.transform(
            {
              name:
                "Advaith's Nest",
              unsupportedField:
                'must fail',
            },
            {
              type: 'body',
              metatype:
                CreatePropertyDto,
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'requires a non-empty property name for creation',
      async () => {
        await expect(
          pipe.transform(
            {
              name: '',
            },
            {
              type: 'body',
              metatype:
                CreatePropertyDto,
            },
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'accepts a partial supported update',
      async () => {
        const payload = {
          city: 'Chennai',
          isActive: true,
        };

        await expect(
          pipe.transform(
            payload,
            {
              type: 'body',
              metatype:
                UpdatePropertyDto,
            },
          ),
        ).resolves.toEqual(payload);
      },
    );
  },
);
