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
  PlaceDetailsDto,
  PlacesNearbyDto,
  PlacesSearchDto,
} from '../dto';

import {
  PLACES_PERMISSIONS,
} from '../places.constants';

import {
  PlacesService,
} from '../services';

@ApiTags(
  'Places',
)
@ApiBearerAuth(
  'JWT',
)
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller(
  'places',
)
export class PlacesController {
  constructor(
    private readonly service:
      PlacesService,
  ) {}

  @Get('search')
  @RequirePermission(
    PLACES_PERMISSIONS.USE,
  )
  async search(
    @Query()
    query:
      PlacesSearchDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.search(
        query,
        {
          correlationId:
            requestId,

          actorId,
        },
      ),
    );
  }

  @Post('nearby')
  @RequirePermission(
    PLACES_PERMISSIONS.USE,
  )
  async nearby(
    @Body()
    dto:
      PlacesNearbyDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.nearby(
        dto,
        {
          correlationId:
            requestId,

          actorId,
        },
      ),
    );
  }

  @Get('details')
  @RequirePermission(
    PLACES_PERMISSIONS.READ,
  )
  async details(
    @Query()
    query:
      PlaceDetailsDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.details(
        query,
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
    PLACES_PERMISSIONS.READ,
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
