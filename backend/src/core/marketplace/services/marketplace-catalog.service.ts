import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketplaceCatalogService {

  async list() {
    return [];
  }

  async details(slug: string) {
    return { slug };
  }

}
