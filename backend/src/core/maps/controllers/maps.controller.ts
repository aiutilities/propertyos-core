import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  RequirePermission,
} from '../../auth/decorators/require-permission.decorator';

import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';

import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';

import {
  MapsGeocodeQueryDto,
  MapsReverseGeocodeDto,
  MapsRouteDto,
} from '../dto';

import {
  MAPS_PERMISSIONS,
} from '../maps.constants';

import {
  MapsService,
} from '../services';

@ApiTags(
  'Maps',
)
@ApiBearerAuth(
  'JWT',
)
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller(
  'maps',
)
export class MapsController {
  constructor(
    private readonly service:
      MapsService,
  ) {}

  @Get('geocode')
  @RequirePermission(
    MAPS_PERMISSIONS.USE,
  )
  async geocode(
    @Query()
    query:
      MapsGeocodeQueryDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.geocode(
        query,
        {
          correlationId:
            requestId,

          actorId,
        },
      ),
    );
  }

  @Post('reverse-geocode')
  @RequirePermission(
    MAPS_PERMISSIONS.USE,
  )
  async reverseGeocode(
    @Body()
    dto:
      MapsReverseGeocodeDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service
        .reverseGeocode(
          dto,
          {
            correlationId:
              requestId,

            actorId,
          },
        ),
    );
  }

  @Post('route')
  @RequirePermission(
    MAPS_PERMISSIONS.USE,
  )
  async route(
    @Body()
    dto:
      MapsRouteDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.route(
        dto,
        {
          correlationId:
            requestId,

          actorId,
        },
      ),
    );
  }

  @Get('health')
  @RequirePermission(
    MAPS_PERMISSIONS.READ,
  )
  health() {
    return this.success(
      this.service.health(),
    );
  }

  private success(
    data:
      unknown,
  ) {
    return {
      success:
        true,

      data,
    };
  }
}
